import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../components/AppFooter";
import BottomNavBar from "../components/BottomNavBar";
import AuthGateShell from "../components/AuthGateShell";
import CustomerScreenShell from "../components/CustomerScreenShell";
import ScreenPageHeader from "../components/ScreenPageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getCurrentAddressFromGPS } from "../services/locationService";
import { fetchUserProfile, updateUserProfile } from "../services/userService";
import { fonts, radius, spacing, typography } from "../theme/tokens";
import {
  customerPageScrollBase,
  customerPanel,
  customerScrollFill,
  inputOutlineWeb,
} from "../theme/screenLayout";

export default function ManageAddressScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createManageStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, updateStoredUser, isAuthLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
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
    if (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !country.trim()) {
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
          title="Delivery address"
          subtitle="Where we ship your order"
          showLocation={false}
        />
        <View style={styles.panel}>
        <View style={styles.sectionIntro}>
          <Text style={styles.sectionOverline}>Delivery</Text>
          <Text style={styles.sectionTitle}>Your address</Text>
          <Text style={styles.sectionSub}>Used for shipping and checkout.</Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TouchableOpacity style={styles.detectBtn} onPress={handleDetect}>
          <Ionicons name="locate" size={18} color={c.primary} />
          <Text style={styles.detectBtnText}>
            {detecting ? "Detecting..." : "Use current location"}
          </Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Address line"
          placeholderTextColor={c.textMuted}
          value={line1}
          onChangeText={setLine1}
          style={[styles.input, { color: c.textPrimary, fontFamily: fonts.regular }]}
        />
        <View style={[styles.row, isCompact ? styles.rowCompact : null]}>
          <TextInput
            placeholder="City"
            placeholderTextColor={c.textMuted}
            value={city}
            onChangeText={setCity}
            style={[styles.input, styles.half, { color: c.textPrimary, fontFamily: fonts.regular }]}
          />
          <TextInput
            placeholder="State"
            placeholderTextColor={c.textMuted}
            value={state}
            onChangeText={setState}
            style={[styles.input, styles.half, { color: c.textPrimary, fontFamily: fonts.regular }]}
          />
        </View>
        <View style={[styles.row, isCompact ? styles.rowCompact : null]}>
          <TextInput
            placeholder="Postal code"
            placeholderTextColor={c.textMuted}
            value={postalCode}
            onChangeText={setPostalCode}
            style={[styles.input, styles.half, { color: c.textPrimary, fontFamily: fonts.regular }]}
          />
          <TextInput
            placeholder="Country"
            placeholderTextColor={c.textMuted}
            value={country}
            onChangeText={setCountry}
            style={[styles.input, styles.half, { color: c.textPrimary, fontFamily: fonts.regular }]}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Ionicons name="save-outline" size={16} color={c.onPrimary} />
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save address"}</Text>
        </TouchableOpacity>
      </View>
        <AppFooter />
      </ScrollView>
      <BottomNavBar />
    </CustomerScreenShell>
  );
}

function createManageStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    panel: {
      ...customerPanel(c, shadowPremium),
      overflow: "hidden",
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
    detectBtn: {
      alignSelf: "flex-start",
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    detectBtnText: {
      color: c.primaryDark,
      fontSize: 13,
      fontFamily: fonts.bold,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      minHeight: 48,
      marginBottom: spacing.sm,
      backgroundColor: c.searchBarFill,
      ...inputOutlineWeb,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    rowCompact: {
      flexDirection: "column",
      gap: 0,
    },
    half: {
      flex: 1,
    },
    saveBtn: {
      marginTop: spacing.sm,
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingVertical: 14,
    },
    saveBtnText: {
      color: c.onPrimary,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
  });
}
