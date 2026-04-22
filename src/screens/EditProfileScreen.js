import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "../services/userService";
import { customerPageScrollBase, customerPanel, customerScrollFill } from "../theme/screenLayout";
import { fonts, radius, spacing, typography } from "../theme/tokens";

export default function EditProfileScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createStyles(c, shadowPremium), [c, shadowPremium]);
  const { isAuthenticated, token, user, updateStoredUser, isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasAddress, setHasAddress] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const profile = await fetchUserProfile(token);
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setAvatarUrl((profile.avatar || "").trim());
      setHasAddress(Boolean(profile.defaultAddress?.line1));
    } catch (err) {
      setError(err.message || "Unable to load profile.");
    } finally {
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await updateUserProfile(token, { name, phone });
      await updateStoredUser(updated);
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

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
      <ScrollView
        style={customerScrollFill}
        contentContainerStyle={[
          customerPageScrollBase,
          { paddingTop: Math.max(insets.top, Platform.OS === "web" ? spacing.md : spacing.sm) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenPageHeader
          navigation={navigation}
          title="Edit profile"
          subtitle="Photo, name & contact"
          showBack
        />

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={c.secondary} />
          </View>
        ) : (
          <View style={styles.panel}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <View style={styles.avatarBlock}>
              <TouchableOpacity
                style={styles.avatarRing}
                onPress={handlePickAvatar}
                disabled={avatarUploading}
                accessibilityLabel="Change profile photo"
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={40} color={c.textMuted} />
                )}
                {avatarUploading ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={c.onSecondary} />
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={styles.avatarActions}>
                <TouchableOpacity onPress={handlePickAvatar} disabled={avatarUploading}>
                  <Text style={styles.avatarLink}>
                    {avatarUploading ? "Uploading…" : "Change photo"}
                  </Text>
                </TouchableOpacity>
                {avatarUrl ? (
                  <TouchableOpacity onPress={handleRemoveAvatar} disabled={avatarUploading}>
                    <Text style={styles.avatarRemove}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={c.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={c.textMuted}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                textContentType="name"
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={c.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor={c.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>

            <TouchableOpacity
              style={styles.addressBtn}
              onPress={() => navigation.navigate("ManageAddress")}
            >
              <Ionicons name="location-outline" size={18} color={c.secondaryDark} />
              <Text style={styles.addressBtnText}>
                {hasAddress ? "Manage delivery address" : "Add delivery address"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Ionicons name="checkmark-circle-outline" size={18} color={c.onSecondary} />
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save changes"}</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Signed in as {user?.email || user?.phone || "your account"}. Manage theme & notifications in Settings.
            </Text>
          </View>
        )}
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    loaderWrap: {
      minHeight: 160,
      alignItems: "center",
      justifyContent: "center",
    },
    panel: {
      ...customerPanel(c, shadowPremium),
      padding: spacing.xl,
      overflow: "hidden",
    },
    inputWrap: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: typography.body,
      fontFamily: fonts.regular,
      color: c.textPrimary,
    },
    addressBtn: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.secondaryBorder,
      backgroundColor: c.secondarySoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    addressBtnText: {
      flex: 1,
      color: c.secondaryDark,
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.secondary,
      borderRadius: radius.pill,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: c.secondary,
    },
    saveBtnText: {
      color: c.onSecondary,
      fontFamily: fonts.bold,
      fontSize: typography.body,
    },
    hint: {
      marginTop: spacing.md,
      fontSize: typography.caption,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 18,
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
      marginBottom: spacing.lg,
    },
    avatarRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      borderWidth: 2,
      borderColor: c.secondaryBorder,
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
      gap: spacing.md,
      marginTop: spacing.sm,
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
  });
}
