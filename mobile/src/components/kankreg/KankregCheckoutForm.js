import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AddressTypeSelector from "../address/AddressTypeSelector";
import PremiumInput from "../ui/PremiumInput";
import PremiumErrorBanner from "../ui/PremiumErrorBanner";
import { CART_ADDRESS } from "../../content/appContent";
import { FIGMA, figmaEyebrow, figmaTextPrimary } from "../../theme/figmaApp";
import { useTheme } from "../../context/ThemeContext";
import { fonts, spacing } from "../../theme/tokens";
import KankregCheckoutSectionCard from "./KankregCheckoutSectionCard";

function FormSection({ eyebrow, children, isDark }) {
  return (
    <View style={styles.section}>
      <Text style={figmaEyebrow(isDark)}>{eyebrow}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Delivery + contact data entry — app + web checkout */
export default function KankregCheckoutForm({
  fullName,
  onFullNameChange,
  phone,
  onPhoneChange,
  addressType,
  onAddressTypeChange,
  houseNumber,
  onHouseNumberChange,
  line1,
  onLine1Change,
  landmark,
  onLandmarkChange,
  city,
  onCityChange,
  postalCode,
  onPostalCodeChange,
  country,
  onCountryChange,
  note,
  onNoteChange,
  error,
  onDismissError,
  fieldErrors = {},
  isDetectingLocation = false,
  onUseGps,
  onOpenMap,
  onUseSavedAddress,
  hasSavedAddress = false,
  isCompact = false,
}) {
  const { isDark } = useTheme();

  return (
    <KankregCheckoutSectionCard
      title={CART_ADDRESS.panelTitle}
      actionLabel={hasSavedAddress ? CART_ADDRESS.useSaved : undefined}
      onActionPress={hasSavedAddress ? onUseSavedAddress : undefined}
    >
      {error ? (
        <View style={styles.banner}>
          <PremiumErrorBanner severity="error" message={error} onClose={onDismissError} compact />
        </View>
      ) : null}

      <Pressable
        onPress={onOpenMap}
        style={({ pressed, hovered }) => [
          styles.gpsBtn,
          Platform.OS === "web" && hovered && styles.gpsBtnHover,
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={["rgba(176,141,87,0.12)", "rgba(176,141,87,0.04)"]}
          style={styles.gpsGrad}
        >
          <Ionicons name="map-outline" size={16} color={isDark ? FIGMA.goldBright : FIGMA.goldDeep} />
          <Text style={[styles.gpsTitle, figmaTextPrimary(isDark)]}>{CART_ADDRESS.useMap}</Text>
          <Ionicons name="chevron-forward" size={14} color={isDark ? "rgba(245,239,228,0.68)" : FIGMA.inkFaint} />
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={onUseGps}
        disabled={isDetectingLocation}
        style={({ pressed, hovered }) => [
          styles.gpsBtn,
          Platform.OS === "web" && hovered && !isDetectingLocation && styles.gpsBtnHover,
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={["rgba(176,141,87,0.12)", "rgba(176,141,87,0.04)"]}
          style={styles.gpsGrad}
        >
          <Ionicons name="locate" size={16} color={isDark ? FIGMA.goldBright : FIGMA.goldDeep} />
          <Text style={[styles.gpsTitle, figmaTextPrimary(isDark)]}>
            {isDetectingLocation ? CART_ADDRESS.useGpsLoading : CART_ADDRESS.useGps}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={isDark ? "rgba(245,239,228,0.68)" : FIGMA.inkFaint} />
        </LinearGradient>
      </Pressable>

      <FormSection eyebrow={CART_ADDRESS.contactSection} isDark={isDark}>
        <PremiumInput
          label="Full name *"
          value={fullName}
          onChangeText={onFullNameChange}
          iconLeft="person-outline"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          errorText={fieldErrors.fullName}
        />
        <PremiumInput
          label="Mobile number *"
          value={phone}
          onChangeText={onPhoneChange}
          iconLeft="call-outline"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          errorText={fieldErrors.phone}
        />
      </FormSection>

      <FormSection eyebrow={CART_ADDRESS.addressSection} isDark={isDark}>
        <AddressTypeSelector value={addressType} onChange={onAddressTypeChange} />
        <PremiumInput
          label="House / flat / building no. *"
          value={houseNumber}
          onChangeText={onHouseNumberChange}
          iconLeft="business-outline"
          autoCapitalize="characters"
          placeholder="e.g. 14B, Sea View Apartments"
          errorText={fieldErrors.houseNumber}
        />
        <PremiumInput
          label="Street / area / colony *"
          value={line1}
          onChangeText={onLine1Change}
          iconLeft="map-outline"
          autoCapitalize="sentences"
          autoComplete="street-address"
          textContentType="streetAddressLine1"
          placeholder="e.g. Marine Drive, Bandra West"
          errorText={fieldErrors.line1}
        />
        <PremiumInput
          label="Landmark (optional)"
          value={landmark}
          onChangeText={onLandmarkChange}
          iconLeft="navigate-outline"
          placeholder="Near city mall, opposite park…"
        />
        <View style={[styles.row, isCompact && styles.rowStack]}>
          <View style={styles.half}>
            <PremiumInput
              label="City *"
              value={city}
              onChangeText={onCityChange}
              iconLeft="business-outline"
              autoCapitalize="words"
              autoComplete="address-level2"
              textContentType="addressCity"
              errorText={fieldErrors.city}
            />
          </View>
          <View style={styles.half}>
            <PremiumInput
              label="Pincode *"
              value={postalCode}
              onChangeText={onPostalCodeChange}
              iconLeft="pin-outline"
              keyboardType="number-pad"
              autoComplete="postal-code"
              textContentType="postalCode"
              errorText={fieldErrors.postalCode}
            />
          </View>
        </View>
        <PremiumInput
          label="Country"
          value={country}
          onChangeText={onCountryChange}
          iconLeft="flag-outline"
          placeholder="India"
          autoCapitalize="words"
        />
      </FormSection>

      <FormSection eyebrow={CART_ADDRESS.noteSection} isDark={isDark}>
        <PremiumInput
          label="Instructions for delivery"
          value={note}
          onChangeText={onNoteChange}
          multiline
          numberOfLines={3}
          iconLeft="chatbubbles-outline"
          placeholder="Gate code, floor, call on arrival…"
        />
      </FormSection>
    </KankregCheckoutSectionCard>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.sm,
  },
  gpsBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: spacing.md + 2,
    borderWidth: 1,
    borderColor: "rgba(220, 172, 116, 0.4)",
  },
  gpsBtnHover: {
    borderColor: FIGMA.gold,
  },
  gpsGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  gpsCopy: {
    flex: 1,
    minWidth: 0,
  },
  gpsTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  section: {
    marginBottom: spacing.md + 2,
  },
  sectionHint: {
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 4,
    marginBottom: spacing.sm,
    lineHeight: 14,
  },
  sectionBody: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowStack: {
    flexDirection: "column",
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
});
