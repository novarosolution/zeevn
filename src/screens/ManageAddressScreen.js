import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
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
import { getCurrentAddressFromGPS } from "../services/locationService";
import { fetchUserProfile, updateUserProfile } from "../services/userService";
import { fonts, spacing, typography } from "../theme/tokens";
import {
  customerInnerPageScrollContent,
  customerPanel,
  customerScrollFill,
} from "../theme/screenLayout";
import { Ionicons } from "@expo/vector-icons";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import { ALCHEMY } from "../theme/customerAlchemy";
import MotionScrollView from "../components/motion/MotionScrollView";
import SectionReveal from "../components/motion/SectionReveal";
import PremiumStickyBar from "../components/ui/PremiumStickyBar";
import { MANAGE_ADDRESS_SCREEN } from "../content/appContent";

export default function ManageAddressScreen({ navigation }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createManageStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, updateStoredUser, isAuthLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const isWide = width >= 980;
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const loadAddress = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await fetchUserProfile(token);
      setLine1(profile.defaultAddress?.line1 || "");
      setCity(profile.defaultAddress?.city || "");
      setState(profile.defaultAddress?.state || "");
      setPostalCode(profile.defaultAddress?.postalCode || "");
      setCountry(profile.defaultAddress?.country || "");
      setLatitude(Number.isFinite(Number(profile.defaultAddress?.latitude)) ? Number(profile.defaultAddress?.latitude) : null);
      setLongitude(Number.isFinite(Number(profile.defaultAddress?.longitude)) ? Number(profile.defaultAddress?.longitude) : null);
    } catch {
      // User can still enter address manually.
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
        loadAddress();
      }
    }, [isAuthLoading, isAuthenticated, token, loadAddress, navigation])
  );

  const handleDetect = async () => {
    try {
      setDetecting(true);
      setError("");
      setSuccess("");
      const address = await getCurrentAddressFromGPS();
      if (address.line1) setLine1(address.line1);
      if (address.city) setCity(address.city);
      if (address.state) setState(address.state);
      if (address.postalCode) setPostalCode(address.postalCode);
      if (address.country) setCountry(address.country);
      if (Number.isFinite(Number(address.latitude))) setLatitude(Number(address.latitude));
      if (Number.isFinite(Number(address.longitude))) setLongitude(Number(address.longitude));
      setSuccess("Address detected from current location.");
    } catch (err) {
      setError(err.message || "Unable to detect location.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    const nextErrors = {
      line1: line1.trim() ? "" : "Address line is required.",
      city: city.trim() ? "" : "City is required.",
      state: state.trim() ? "" : "State is required.",
      postalCode: postalCode.trim() ? "" : "Postal code is required.",
      country: country.trim() ? "" : "Country is required.",
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError("Please fill all address fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await updateUserProfile(token, {
        defaultAddress: {
          line1: line1.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          latitude,
          longitude,
        },
      });
      await updateStoredUser(updated);
      setSuccess("Address saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save address.");
    } finally {
      setSaving(false);
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
          title={MANAGE_ADDRESS_SCREEN.pageTitle}
          subtitle={MANAGE_ADDRESS_SCREEN.pageSubtitle}
          showLocation={false}
        />
        <GoldHairline marginVertical={spacing.sm} />
        <View style={isWide ? styles.desktopGrid : null}>
          <View style={isWide ? styles.desktopColPreview : null}>
            {(line1 || city) ? (
              <SectionReveal delay={40} preset="fade-up">
                <View style={styles.previewWrap}>
                  <PremiumCard goldAccent variant="accent" padding="lg">
                    <View style={styles.previewHead}>
                      <View style={styles.previewIconWrap}>
                        <Ionicons name="location" size={18} color={ALCHEMY.brown} />
                      </View>
                      <View style={styles.previewTitleCol}>
                        <Text style={styles.previewKicker}>Saved address</Text>
                        <Text style={styles.previewTitle}>Default delivery</Text>
                      </View>
                      <View style={styles.previewRibbon}>
                        <Ionicons name="star" size={11} color={ALCHEMY.brown} />
                        <Text style={styles.previewRibbonText}>Default</Text>
                      </View>
                    </View>
                    <Text style={styles.previewLine}>{line1}</Text>
                    <Text style={styles.previewLine}>
                      {[city, state].filter(Boolean).join(", ")} {postalCode}
                    </Text>
                    {country ? <Text style={styles.previewLineMuted}>{country}</Text> : null}
                    {latitude != null && longitude != null ? (
                      <View style={styles.gpsBadge}>
                        <Ionicons name="locate-outline" size={12} color={c.secondaryDark} />
                        <Text style={styles.gpsBadgeText}>GPS verified</Text>
                      </View>
                    ) : null}
                  </PremiumCard>
                </View>
              </SectionReveal>
            ) : null}
          </View>

          <View style={isWide ? styles.desktopColForm : null}>
            <SectionReveal delay={60} preset="fade-up">
              <View style={styles.panel}>
            <SectionReveal delay={100}>
              <View style={styles.sectionIntro}>
                <PremiumSectionHeader
                  overline="Delivery"
                  title={(line1 || city) ? MANAGE_ADDRESS_SCREEN.cardTitleWhenFilled : MANAGE_ADDRESS_SCREEN.cardTitleWhenEmpty}
                  subtitle={MANAGE_ADDRESS_SCREEN.cardSubtitle}
                  compact
                />
              </View>
            </SectionReveal>
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

            <SectionReveal delay={140}>
              <PremiumButton
                label={detecting ? "Detecting…" : "Use current location"}
                iconLeft="locate"
                variant="ghost"
                size="md"
                loading={detecting}
                disabled={detecting}
                onPress={handleDetect}
                pulse={detecting}
                style={styles.detectBtnSpacer}
              />
            </SectionReveal>

            <View style={styles.fieldStack}>
              <SectionReveal delay={180}>
                <PremiumInput
                  label="Address line"
                  value={line1}
                  onChangeText={setLine1}
                  iconLeft="home-outline"
                    errorText={fieldErrors.line1}
                />
              </SectionReveal>
              <SectionReveal delay={220}>
                <View style={[styles.row, isCompact ? styles.rowCompact : null]}>
                  <View style={styles.half}>
                    <PremiumInput label="City" value={city} onChangeText={setCity} errorText={fieldErrors.city} />
                  </View>
                  <View style={styles.half}>
                    <PremiumInput label="State" value={state} onChangeText={setState} errorText={fieldErrors.state} />
                  </View>
                </View>
              </SectionReveal>
              <SectionReveal delay={260}>
                <View style={[styles.row, isCompact ? styles.rowCompact : null]}>
                  <View style={styles.half}>
                    <PremiumInput label="Postal code" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" errorText={fieldErrors.postalCode} />
                  </View>
                  <View style={styles.half}>
                    <PremiumInput label="Country" value={country} onChangeText={setCountry} errorText={fieldErrors.country} />
                  </View>
                </View>
              </SectionReveal>
            </View>

            <SectionReveal delay={320}>
              <PremiumButton
                label={saving ? "Saving…" : "Save address"}
                iconLeft="save-outline"
                variant="primary"
                size="lg"
                fullWidth
                loading={saving}
                disabled={saving}
                onPress={handleSave}
                pulse={!saving && !error}
                style={styles.saveBtnSpacer}
              />
            </SectionReveal>
              </View>
            </SectionReveal>
          </View>
        </View>
        <AppFooter />
      </MotionScrollView>
      {Platform.OS !== "web" ? (
        <PremiumStickyBar>
          <PremiumButton
            label={saving ? "Saving…" : "Save address"}
            iconLeft="save-outline"
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

function createManageStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    panel: {
      ...customerPanel(c, shadowPremium, isDark),
      overflow: "hidden",
    },
    desktopGrid: {
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "flex-start",
    },
    desktopColPreview: {
      flex: 1,
      minWidth: 0,
    },
    desktopColForm: {
      flex: 1.2,
      minWidth: 0,
    },
    sectionIntro: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sectionOverline: {
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      color: c.primary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      fontSize: typography.h3,
      fontFamily: fonts.extrabold,
      color: c.textPrimary,
      letterSpacing: -0.3,
    },
    sectionSub: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      color: c.textSecondary,
      lineHeight: 20,
    },
    bannerWrap: {
      marginBottom: spacing.sm,
    },
    detectBtnSpacer: {
      marginBottom: spacing.md,
    },
    fieldStack: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    rowCompact: {
      flexDirection: "column",
      gap: spacing.sm,
    },
    half: {
      flex: 1,
    },
    saveBtnSpacer: {
      marginTop: spacing.md,
    },
    previewWrap: {
      marginBottom: spacing.md,
    },
    previewHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    previewIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.16)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.32)" : "rgba(63, 63, 70, 0.18)",
    },
    previewTitleCol: {
      flex: 1,
      minWidth: 0,
    },
    previewKicker: {
      fontFamily: fonts.bold,
      fontSize: typography.overline,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: c.textMuted,
    },
    previewTitle: {
      marginTop: 2,
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    previewRibbon: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(220, 38, 38, 0.16)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(220, 38, 38, 0.32)" : "rgba(63, 63, 70, 0.18)",
    },
    previewRibbonText: {
      fontFamily: fonts.extrabold,
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown,
    },
    previewLine: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      color: c.textPrimary,
      marginBottom: 2,
    },
    previewLineMuted: {
      fontFamily: fonts.regular,
      fontSize: typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
    gpsBadge: {
      marginTop: spacing.sm,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.secondaryBorder,
      backgroundColor: c.secondarySoft,
    },
    gpsBadgeText: {
      fontFamily: fonts.bold,
      fontSize: typography.overline,
      color: c.secondaryDark,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  });
}
