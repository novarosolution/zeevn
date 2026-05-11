import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import GoldHairline from "../components/ui/GoldHairline";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "../services/userService";
import {
  customerInnerPageScrollContent,
  customerPanel,
  customerScrollFill,
} from "../theme/screenLayout";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumLoader from "../components/ui/PremiumLoader";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import useReducedMotion from "../hooks/useReducedMotion";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import PremiumStickyBar from "../components/ui/PremiumStickyBar";
import { EDIT_PROFILE_SCREEN } from "../content/appContent";

export default function EditProfileScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const { isAuthenticated, token, user, updateStoredUser, isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasAddress, setHasAddress] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ name: "", phone: "" });
  const [showStickySave, setShowStickySave] = useState(false);
  const stickyStateRef = useRef({ name: "", phone: "", saving: false });

  const load = useCallback(async () => {
    if (!token) return;
    const startedAt = Date.now();
    try {
      setLoading(true);
      setError("");
      const profile = await fetchUserProfile(token);
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setAvatarUrl((profile.avatar || "").trim());
      setHasAddress(Boolean(profile.defaultAddress?.line1));
    } catch (err) {
      setError(err.message || EDIT_PROFILE_SCREEN.loadErrorFallback);
    } finally {
      const elapsed = Date.now() - startedAt;
      const minimumLoaderMs = 320;
      if (elapsed < minimumLoaderMs) {
        await new Promise((resolve) => setTimeout(resolve, minimumLoaderMs - elapsed));
      }
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading) return;
      if (!isAuthenticated) {
        navigation.navigate("Login");
        return;
      }
      if (token) {
        load();
      }
    }, [isAuthLoading, isAuthenticated, token, load, navigation])
  );

  const successRipple = useSharedValue(0);
  const successRippleStyle = useAnimatedStyle(() => ({
    opacity: successRipple.value,
    transform: [{ scale: 0.95 + successRipple.value * 0.1 }],
  }));

  const handleSave = async () => {
    const nextErrors = {
      name: String(name || "").trim() ? "" : "Name is required.",
      phone: String(phone || "").trim().length >= 10 ? "" : "Enter a valid phone number.",
    };
    setFieldErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) {
      setError("Please correct the highlighted fields.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await updateUserProfile(token, { name, phone });
      await updateStoredUser(updated);
      setSuccess("Profile saved.");
      if (!reducedMotion) {
        successRipple.value = withSequence(
          withTiming(1, { duration: 220 }),
          withTiming(0, { duration: 700 }),
        );
      }
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!success || reducedMotion) return undefined;
    return undefined;
  }, [success, reducedMotion]);

  useEffect(() => {
    const hasDirty = Boolean(String(name || "").trim() || String(phone || "").trim());
    setShowStickySave(hasDirty && !saving);
    stickyStateRef.current = { name, phone, saving };
  }, [name, phone, saving]);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const showSub = Keyboard.addListener("keyboardDidShow", () => setShowStickySave(false));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      const snapshot = stickyStateRef.current;
      const hasDirty = Boolean(
        String(snapshot?.name || "").trim() || String(snapshot?.phone || "").trim()
      );
      setShowStickySave(hasDirty && !snapshot?.saving);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePickAvatar = async () => {
    if (!token) return;
    try {
      setError("");
      setSuccess("");
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setError("Photo library access is needed to set your profile picture.");
          return;
        }
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.65,
        base64: true,
      });

      if (picked.canceled) {
        return;
      }

      const asset = picked.assets?.[0];
      if (!asset?.base64) {
        setError("Could not read that photo. Try another image.");
        return;
      }

      setAvatarUploading(true);
      const updated = await uploadUserAvatar(token, {
        imageBase64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
      });
      setAvatarUrl((updated.avatar || "").trim());
      await updateStoredUser(updated);
      setSuccess("Photo updated.");
    } catch (err) {
      setError(err.message || "Could not upload photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!token) return;
    try {
      setAvatarUploading(true);
      setError("");
      setSuccess("");
      const updated = await updateUserProfile(token, { avatar: "" });
      setAvatarUrl("");
      await updateStoredUser(updated);
      setSuccess("Photo removed.");
    } catch (err) {
      setError(err.message || "Could not remove photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isAuthLoading || !isAuthenticated) {
    return <AuthGateShell />;
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={customerInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenPageHeader
          navigation={navigation}
          title={EDIT_PROFILE_SCREEN.pageTitle}
          subtitle={EDIT_PROFILE_SCREEN.pageSubtitle}
          showBack
        />
        <GoldHairline marginVertical={spacing.sm} />

        {loading ? (
          <View style={styles.loaderWrap}>
            <View style={styles.loadingAvatarRow}>
              <SkeletonBlock width={92} height={92} rounded="lg" />
              <View style={styles.loadingAvatarText}>
                <SkeletonBlock width="60%" height={14} rounded="sm" />
                <SkeletonBlock width="40%" height={12} rounded="sm" />
              </View>
            </View>
            <SkeletonBlock width="100%" height={56} rounded="lg" />
            <SkeletonBlock width="100%" height={56} rounded="lg" />
            <SkeletonBlock width="100%" height={48} rounded="pill" />
            <SkeletonBlock width="100%" height={50} rounded="pill" />
            <PremiumLoader size="sm" caption="Loading profile…" />
          </View>
        ) : (
          <SectionReveal delay={60} preset="fade-up">
            <View style={styles.panel}>
              {error ? (
                <View style={styles.bannerWrap}>
                  <PremiumErrorBanner severity="error" message={error} compact />
                </View>
              ) : null}
              {success ? (
                <View style={styles.bannerWrap}>
                  <PremiumErrorBanner severity="success" message={success} compact />
                </View>
              ) : null}

              <SectionReveal delay={120}>
                <View style={styles.sectionCard}>
                  <PremiumSectionHeader
                    overline={EDIT_PROFILE_SCREEN.photoOverline}
                    title={EDIT_PROFILE_SCREEN.photoTitle}
                    compact
                  />
                  <View style={styles.avatarBlock}>
                    <PremiumButton
                      variant="ghost"
                      size="sm"
                      label="Change photo"
                      iconLeft="image-outline"
                      onPress={handlePickAvatar}
                      disabled={avatarUploading}
                      style={styles.avatarChangeBtn}
                    />
                    <View
                      style={styles.avatarRing}
                    >
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                      ) : (
                        <Ionicons name="person" size={48} color={c.textMuted} />
                      )}
                      {avatarUploading ? (
                        <View style={styles.avatarOverlay}>
                          <ActivityIndicator color={c.onSecondary} />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.avatarActions}>
                      {avatarUrl ? (
                        <PremiumButton
                          label="Remove"
                          iconLeft="trash-outline"
                          variant="subtle"
                          size="sm"
                          onPress={handleRemoveAvatar}
                          disabled={avatarUploading}
                          style={styles.avatarRemoveBtn}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              </SectionReveal>

              <SectionReveal delay={180}>
                <View style={styles.sectionCard}>
                  <PremiumSectionHeader
                    overline={EDIT_PROFILE_SCREEN.accountOverline}
                    title={EDIT_PROFILE_SCREEN.accountTitle}
                    compact
                  />
                  <View style={styles.fieldStack}>
                    <SectionReveal delay={220}>
                      <PremiumInput
                        label="Full name"
                        value={name}
                        onChangeText={setName}
                        iconLeft="person-outline"
                        errorText={fieldErrors.name}
                        autoComplete="name"
                        textContentType="name"
                      />
                    </SectionReveal>
                    <SectionReveal delay={260}>
                      <PremiumInput
                        label="Phone number"
                        value={phone}
                        onChangeText={setPhone}
                        iconLeft="call-outline"
                        errorText={fieldErrors.phone}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                      />
                    </SectionReveal>
                  </View>
                </View>
              </SectionReveal>

              <SectionReveal delay={300}>
                <PremiumButton
                  label={hasAddress ? "Manage delivery address" : "Add delivery address"}
                  iconLeft="location-outline"
                  iconRight="chevron-forward"
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => navigation.navigate("ManageAddress")}
                  style={styles.addressBtnSpacer}
                />
              </SectionReveal>

              <SectionReveal delay={340}>
                <View style={styles.saveBtnWrap}>
                  {/* Success ripple sits behind the save CTA. */}
                  <Animated.View style={[styles.successRipple, successRippleStyle, styles.peNone]} />
                  <PremiumButton
                    label={saving ? "Saving…" : "Save changes"}
                    iconLeft="checkmark-circle-outline"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={saving}
                    disabled={saving}
                    onPress={handleSave}
                    pulse={!saving && !error}
                  />
                </View>
              </SectionReveal>

              <Text style={styles.hint}>
                Signed in as {user?.email || user?.phone || "your account"}. Manage theme & notifications in Settings.
              </Text>
            </View>
          </SectionReveal>
        )}
        <AppFooter />
      </MotionScrollView>
      {Platform.OS !== "web" && showStickySave ? (
        <PremiumStickyBar>
          <PremiumButton
            label={saving ? "Saving…" : "Save changes"}
            iconLeft="checkmark-circle-outline"
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            disabled={saving}
            onPress={handleSave}
          />
        </PremiumStickyBar>
      ) : null}
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    loaderWrap: {
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    loadingAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    loadingAvatarText: {
      flex: 1,
      gap: spacing.xs,
    },
    panel: {
      ...customerPanel(c, shadowPremium, isDark),
      padding: Platform.select({ web: spacing.xl + 2, default: spacing.lg + 2 }),
      overflow: Platform.OS === "web" ? "visible" : "hidden",
      ...Platform.select({
        web: {
          borderRadius: radius.xxl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(220, 38, 38, 0.14)" : "rgba(63, 63, 70, 0.12)",
        },
        default: {},
      }),
    },
    sectionCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderTopWidth: 2,
      borderTopColor: isDark ? "rgba(248, 113, 113, 0.34)" : "rgba(220, 38, 38, 0.2)",
      borderRadius: radius.xl,
      backgroundColor: isDark ? c.surfaceElevated || c.surfaceMuted : c.surface,
      padding: spacing.md + 2,
      marginBottom: spacing.md + 2,
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 14px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 12px 26px rgba(24, 24, 27, 0.09), inset 0 1px 0 rgba(255,255,255,0.82)",
        },
        default: {},
      }),
    },
    sectionTitle: {
      fontSize: typography.body + 1,
      fontFamily: fonts.bold,
      color: c.textPrimary,
      marginBottom: spacing.sm + 2,
      letterSpacing: -0.15,
    },
    bannerWrap: {
      marginBottom: spacing.sm,
    },
    fieldStack: {
      gap: spacing.sm,
    },
    addressBtnSpacer: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    fieldLabel: {
      fontSize: typography.caption,
      color: c.textSecondary,
      fontFamily: fonts.semibold,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
    },
    inputWrap: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 52,
      ...Platform.select({
        web: {
          transition: "border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
          boxShadow: isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.03)"
            : "inset 0 1px 0 rgba(255,255,255,0.78)",
        },
        default: {},
      }),
    },
    input: {
      flex: 1,
      paddingVertical: 13,
      fontSize: typography.body,
      fontFamily: fonts.regular,
      color: c.textPrimary,
    },
    addressBtn: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      borderColor: c.secondaryBorder,
      backgroundColor: c.secondarySoft,
      gap: 10,
    },
    addressBtnText: {
      flex: 1,
      color: c.secondaryDark,
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    saveBtnWrap: {
      position: "relative",
    },
    successRipple: {
      position: "absolute",
      top: -8,
      left: -8,
      right: -8,
      bottom: -8,
      borderRadius: radius.pill,
      backgroundColor: isDark ? "rgba(110, 231, 183, 0.45)" : "rgba(34, 197, 94, 0.4)",
      ...Platform.select({
        web: { filter: "blur(16px)" },
        default: {},
      }),
      zIndex: -1,
    },
    saveBtn: {
      gap: 8,
    },
    saveBtnText: {
      color: c.onSecondary,
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    hint: {
      marginTop: spacing.md + 2,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 20,
    },
    errorText: {
      color: c.danger,
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      marginBottom: spacing.sm,
    },
    successText: {
      color: c.success,
      fontFamily: fonts.semibold,
      fontSize: typography.caption,
      marginBottom: spacing.sm,
    },
    avatarBlock: {
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    avatarRing: {
      width: 116,
      height: 116,
      borderRadius: 58,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.secondaryBorder,
      ...Platform.select({
        web: {
          borderWidth: 2,
          borderColor: isDark ? "rgba(220, 38, 38, 0.44)" : c.secondaryBorder,
          boxShadow: isDark
            ? "0 16px 34px rgba(0,0,0,0.33)"
            : "0 12px 26px rgba(24, 24, 27, 0.14)",
        },
        default: {},
      }),
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    avatarOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
      flexWrap: "wrap",
      justifyContent: "center",
    },
    avatarActionBtn: {
      borderWidth: 1,
      borderColor: c.secondaryBorder,
      borderRadius: radius.pill,
      backgroundColor: c.secondarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    avatarRemoveBtn: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: radius.pill,
      backgroundColor: "rgba(220, 38, 38, 0.08)",
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    avatarLink: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
      color: c.secondaryDark,
    },
    avatarRemove: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      color: c.danger,
    },
    peNone: {
      pointerEvents: "none",
    },
  });
}
