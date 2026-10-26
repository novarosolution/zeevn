import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View} from "react-native";
import { useKankregLayout } from "../theme/kankregBreakpoints";
import { useFocusEffect } from "@react-navigation/native";
import KankregScrollPage from "../components/kankreg/KankregScrollPage";

import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import KankregCustomerPageHeader from "../components/kankreg/KankregCustomerPageHeader";
import { MANAGE_ADDRESS_SCREEN_UI } from "../content/appContent";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getCurrentAddressFromGPS, validMapCoord } from "../services/locationService";
import { fetchUserProfile, updateUserProfile } from "../services/userService";
import { useDeliveryLocation } from "../context/DeliveryLocationContext";
import { openPickLocation, usePickedPlace } from "../navigation/pickLocationNav";
import { fonts, spacing, typography } from "../theme/tokens";
import {
  customerPanel,
  customerScrollFill} from "../theme/screenLayout";
import { Ionicons } from "@expo/vector-icons";
import PremiumInput from "../components/ui/PremiumInput";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumErrorBanner from "../components/ui/PremiumErrorBanner";
import PremiumCard from "../components/ui/PremiumCard";
import PremiumSectionHeader from "../components/ui/PremiumSectionHeader";
import AddressTypeSelector from "../components/address/AddressTypeSelector";
import { ALCHEMY } from "../theme/customerAlchemy";
import SectionReveal from "../components/motion/SectionReveal";
import { StoreAddress } from "../components/store/entry";
import { FIGMA } from "../theme/figmaApp";

export default function ManageAddressScreen({ navigation, route }) {
  const { colors: c, shadowPremium, isDark } = useTheme();
  const styles = useMemo(() => createManageStyles(c, shadowPremium, isDark), [c, shadowPremium, isDark]);
    const { isAuthenticated, token, updateStoredUser, isAuthLoading } = useAuth();
  const { applyPlace } = useDeliveryLocation();
  const { isXs, useSplitLayout } = useKankregLayout();
  const isCompact = isXs;
  const isWide = useSplitLayout;
  const isNativeApp = Platform.OS !== "web";
  const [addressType, setAddressType] = useState("Home");
  const [houseNumber, setHouseNumber] = useState("");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
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
      setAddressType(profile.defaultAddress?.addressType || "Home");
      setHouseNumber(profile.defaultAddress?.houseNumber || "");
      setLine1(profile.defaultAddress?.line1 || "");
      setLandmark(profile.defaultAddress?.landmark || "");
      setCity(profile.defaultAddress?.city || "");
      setPostalCode(profile.defaultAddress?.postalCode || "");
      setCountry(profile.defaultAddress?.country || "");
      setLatitude(validMapCoord(profile.defaultAddress?.latitude) ? Number(profile.defaultAddress?.latitude) : null);
      setLongitude(validMapCoord(profile.defaultAddress?.longitude) ? Number(profile.defaultAddress?.longitude) : null);
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

  const fillFromPlace = async (address, okMessage) => {
    if (address.line1) setLine1(address.line1);
    if (address.city) setCity(address.city);
    if (address.postalCode) setPostalCode(address.postalCode);
    if (address.country) setCountry(address.country);
    if (!houseNumber.trim() && address.line1) {
      setHouseNumber(String(address.line1).split(",")[0].slice(0, 32));
    }
    if (validMapCoord(address.latitude)) setLatitude(Number(address.latitude));
    if (validMapCoord(address.longitude)) setLongitude(Number(address.longitude));
    await applyPlace(address);
    setSuccess(okMessage);
  };

  const handleDetect = async () => {
    try {
      setDetecting(true);
      setError("");
      setSuccess("");
      const address = await getCurrentAddressFromGPS();
      await fillFromPlace(address, "Address detected from current location.");
    } catch (err) {
      setError(err.message || "Unable to detect location.");
    } finally {
      setDetecting(false);
    }
  };

  usePickedPlace(route, navigation, (place) => {
    fillFromPlace(place, "Place set — review the fields, then save.");
  });

  const openMap = () =>
    openPickLocation(navigation, {
      latitude,
      longitude,
      returnTo: "ManageAddress",
    });

  const handleSave = async () => {
    const nextErrors = {
      houseNumber: houseNumber.trim() ? "" : "House / flat number is required.",
      line1: line1.trim() ? "" : "Street / area is required.",
      city: city.trim() ? "" : "City is required.",
      postalCode: postalCode.trim() ? "" : "Pincode is required."};
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError("Please fill the required address fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await updateUserProfile(token, {
        defaultAddress: {
          addressType: addressType || "Home",
          houseNumber: houseNumber.trim(),
          line1: line1.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || "India",
          latitude,
          longitude}});
      await updateStoredUser(updated);
      await applyPlace(updated?.defaultAddress || {
        houseNumber: houseNumber.trim(),
        line1: line1.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim() || "India",
        latitude,
        longitude,
      });
      setSuccess("Address saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save address.");
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading) {
    return <AuthGateShell navigation={navigation} />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  if (isNativeApp) {
    return (
      <StoreAddress
        navigation={navigation}
        error={error}
        success={success}
        onDismissError={() => setError("")}
        onDismissSuccess={() => setSuccess("")}
        addressType={addressType}
        onAddressType={setAddressType}
        houseNumber={houseNumber}
        onHouseNumber={setHouseNumber}
        line1={line1}
        onLine1={setLine1}
        landmark={landmark}
        onLandmark={setLandmark}
        city={city}
        onCity={setCity}
        postalCode={postalCode}
        onPostalCode={setPostalCode}
        latitude={latitude}
        longitude={longitude}
        gps={latitude != null && longitude != null}
        fieldErrors={fieldErrors}
        detecting={detecting}
        detectLabel={detecting ? MANAGE_ADDRESS_SCREEN_UI.useGpsLoading : MANAGE_ADDRESS_SCREEN_UI.useGps}
        onDetect={handleDetect}
        onOpenMap={openMap}
        saving={saving}
        onSave={handleSave}
      />
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="inner"
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KankregCustomerPageHeader
          eyebrow={MANAGE_ADDRESS_SCREEN_UI.pageEyebrow}
          title={MANAGE_ADDRESS_SCREEN_UI.pageTitle}
          subtitle={MANAGE_ADDRESS_SCREEN_UI.pageSubtitle}
          navigation={navigation}
          showLocation={false}
          showHairline={!isNativeApp}
        />
        <View style={isWide ? styles.desktopGrid : null}>
          <View style={isWide ? styles.desktopColPreview : null}>
            {(line1 || city) ? (
              <SectionReveal delay={40} preset="fade-up">
                <View style={styles.previewWrap}>
                    <PremiumCard goldAccent padding="lg">
                      <View style={styles.previewHead}>
                        <View style={styles.previewIconWrap}>
                          <Ionicons name="location" size={18} color={ALCHEMY.brown} />
                        </View>
                        <View style={styles.previewTitleCol}>
                          <Text style={styles.previewKicker}>Saved address</Text>
                          <Text style={styles.previewTitle}>{addressType || "Home"} · Default</Text>
                        </View>
                        <View style={styles.previewRibbon}>
                          <Ionicons name="star" size={11} color={ALCHEMY.brown} />
                          <Text style={styles.previewRibbonText}>Default</Text>
                        </View>
                      </View>
                      <Text style={styles.previewLine}>
                        {[houseNumber, line1].filter(Boolean).join(", ")}
                      </Text>
                      {landmark ? (
                        <Text style={styles.previewLineMuted}>Near {landmark}</Text>
                      ) : null}
                      <Text style={styles.previewLine}>
                        {[city, postalCode].filter(Boolean).join(" - ")}
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
              <View style={[styles.panel, isNativeApp && styles.nativePanel]}>
                <SectionReveal delay={100}>
                  <View style={styles.sectionIntro}>
                    <PremiumSectionHeader
                      overline="Delivery"
                      title={(line1 || city) ? "Update your address" : "Add your address"}
                      subtitle="Used for shipping and checkout."
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
                    label={MANAGE_ADDRESS_SCREEN_UI.useMap}
                    iconLeft="map-outline"
                    variant="ghost"
                    size="md"
                    onPress={openMap}
                    style={styles.detectBtnSpacer}
                  />
                  <PremiumButton
                    label={detecting ? MANAGE_ADDRESS_SCREEN_UI.useGpsLoading : MANAGE_ADDRESS_SCREEN_UI.useGps}
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
                  <SectionReveal delay={170}>
                    <AddressTypeSelector value={addressType} onChange={setAddressType} />
                  </SectionReveal>
                  <SectionReveal delay={200}>
                    <PremiumInput
                      label="House / Flat / Building no."
                      value={houseNumber}
                      onChangeText={setHouseNumber}
                      iconLeft="business-outline"
                      errorText={fieldErrors.houseNumber}
                    />
                  </SectionReveal>
                  <SectionReveal delay={230}>
                    <PremiumInput
                      label="Street / Area / Colony"
                      value={line1}
                      onChangeText={setLine1}
                      iconLeft="map-outline"
                      errorText={fieldErrors.line1}
                    />
                  </SectionReveal>
                  <SectionReveal delay={260}>
                    <PremiumInput
                      label="Landmark (optional)"
                      value={landmark}
                      onChangeText={setLandmark}
                      iconLeft="navigate-outline"
                      placeholder="e.g. Near city mall"
                    />
                  </SectionReveal>
                  <SectionReveal delay={290}>
                    <View style={[styles.row, isCompact ? styles.rowCompact : null]}>
                      <View style={styles.half}>
                        <PremiumInput label="City" value={city} onChangeText={setCity} iconLeft="business-outline" errorText={fieldErrors.city} />
                      </View>
                      <View style={styles.half}>
                        <PremiumInput label="Pincode" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" iconLeft="pin-outline" errorText={fieldErrors.postalCode} />
                      </View>
                    </View>
                  </SectionReveal>
                  <SectionReveal delay={320}>
                    <PremiumInput
                      label="Country (optional)"
                      value={country}
                      onChangeText={setCountry}
                      iconLeft="flag-outline"
                      placeholder="India"
                    />
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
</KankregScrollPage>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createManageStyles(c, shadowPremium, isDark) {
  return StyleSheet.create({
    screen: {
      flex: 1},
    nativePreviewWrap: {
      paddingHorizontal: FIGMA.gutter,
      marginBottom: spacing.sm,
    },
    nativePreviewCard: {
      padding: 14,
    },
    nativePanel: {
      paddingHorizontal: FIGMA.gutter,
    },
    panel: {
      ...customerPanel(c, shadowPremium, isDark),
      overflow: "hidden"},
    desktopGrid: {
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "flex-start"},
    desktopColPreview: {
      flex: 1,
      minWidth: 0},
    desktopColForm: {
      flex: 1.2,
      minWidth: 0},
    sectionIntro: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border},
    sectionOverline: {
      fontSize: typography.overline,
      fontFamily: fonts.bold,
      color: c.primary,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: spacing.xs},
    sectionTitle: {
      fontSize: typography.h3,
      fontFamily: fonts.extrabold,
      color: c.textPrimary,
      letterSpacing: -0.3},
    sectionSub: {
      marginTop: spacing.xs,
      fontSize: typography.bodySmall,
      fontFamily: fonts.regular,
      color: c.textSecondary,
      lineHeight: 20},
    bannerWrap: {
      marginBottom: spacing.sm},
    detectBtnSpacer: {
      marginTop: spacing.sm,
      marginBottom: spacing.md},
    fieldStack: {
      gap: spacing.sm},
    row: {
      flexDirection: "row",
      gap: spacing.sm},
    rowCompact: {
      flexDirection: "column",
      gap: spacing.sm},
    half: {
      flex: 1},
    saveBtnSpacer: {
      marginTop: spacing.md},
    previewWrap: {
      marginBottom: spacing.md},
    previewHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm},
    previewIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.16)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(52, 211, 153, 0.32)" : "rgba(22, 69, 51, 0.18)"},
    previewTitleCol: {
      flex: 1,
      minWidth: 0},
    previewKicker: {
      fontFamily: fonts.bold,
      fontSize: typography.overline,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: c.textMuted},
    previewTitle: {
      marginTop: 2,
      fontFamily: fonts.extrabold,
      fontSize: typography.body,
      color: c.textPrimary,
      letterSpacing: -0.2},
    previewRibbon: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(52, 211, 153, 0.16)" : ALCHEMY.goldSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(52, 211, 153, 0.32)" : "rgba(22, 69, 51, 0.18)"},
    previewRibbonText: {
      fontFamily: fonts.extrabold,
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: isDark ? ALCHEMY.goldBright : ALCHEMY.brown},
    previewLine: {
      fontFamily: fonts.semibold,
      fontSize: typography.bodySmall,
      color: c.textPrimary,
      marginBottom: 2},
    previewLineMuted: {
      fontFamily: fonts.regular,
      fontSize: typography.caption,
      color: c.textMuted,
      marginTop: 2},
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
      backgroundColor: c.secondarySoft},
    gpsBadgeText: {
      fontFamily: fonts.bold,
      fontSize: typography.overline,
      color: c.secondaryDark,
      letterSpacing: 0.5,
      textTransform: "uppercase"}});
}
