import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_GATE } from "../../content/adminContent";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminHomeView, updateAdminHomeView } from "../../services/adminService";
import {
  adminGatePanel,
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminPhonePreview from "../../components/admin/AdminPhonePreview";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import AdminAlerts from "../../components/admin/AdminAlerts";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { ADMIN_HOME_VIEW_COPY } from "../../content/appContent";
import { HOME_VIEW_DEFAULTS } from "../../content/homeViewDefaults";
import { getCurrentAddressFromGPS } from "../../services/locationService";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import SectionReveal from "../../components/motion/SectionReveal";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";
import AdminHomeHeroEditor from "../../components/admin/AdminHomeHeroEditor";
import { normalizeHeroSlides } from "../../utils/homeViewMedia";

function Section({ label, hint, children, styles, revealIndex = 0 }) {
  return (
    <SectionReveal index={revealIndex} preset="fade-up">
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
        {children}
      </View>
    </SectionReveal>
  );
}

function QuickLinkRow({ title, subtitle, icon, onPress, styles, c }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.linkRow,
        hovered && Platform.OS === "web" ? { backgroundColor: c.surfaceMuted } : null,
        pressed ? { opacity: 0.88 } : null,
      ]}
    >
      <View style={[styles.linkIconWrap, { backgroundColor: c.primarySoft, borderColor: c.primaryBorder }]}>
        <Ionicons name={icon} size={20} color={c.primaryDark} />
      </View>
      <View style={styles.linkTextCol}>
        <Text style={[styles.linkTitle, { color: c.textPrimary }]}>{title}</Text>
        <Text style={[styles.linkSubtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
    </Pressable>
  );
}

export default function AdminHomeViewScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createAdminHomeViewStyles(c, shadowPremium), [c, shadowPremium]);
    const { token, user } = useAuth();
  const copy = ADMIN_HOME_VIEW_COPY;
  const [heroTitle, setHeroTitle] = useState(HOME_VIEW_DEFAULTS.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(HOME_VIEW_DEFAULTS.heroSubtitle);
  const [primeSectionTitle, setPrimeSectionTitle] = useState(HOME_VIEW_DEFAULTS.primeSectionTitle);
  const [productTypeTitle, setProductTypeTitle] = useState(HOME_VIEW_DEFAULTS.productTypeTitle);
  const [showPrimeSection, setShowPrimeSection] = useState(true);
  const [showProductTypeSections, setShowProductTypeSections] = useState(true);
  const [productCardStyle, setProductCardStyle] = useState("compact");
  const [shopName, setShopName] = useState(HOME_VIEW_DEFAULTS.shopLocation.name);
  const [shopLine1, setShopLine1] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [shopState, setShopState] = useState("");
  const [shopPostalCode, setShopPostalCode] = useState("");
  const [shopLatitude, setShopLatitude] = useState("");
  const [shopLongitude, setShopLongitude] = useState("");
  const [heroSlides, setHeroSlides] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setError("");
      const data = await fetchAdminHomeView(token);
      setHeroTitle(data.heroTitle || HOME_VIEW_DEFAULTS.heroTitle);
      setHeroSubtitle(data.heroSubtitle || HOME_VIEW_DEFAULTS.heroSubtitle);
      setPrimeSectionTitle(data.primeSectionTitle || HOME_VIEW_DEFAULTS.primeSectionTitle);
      setProductTypeTitle(data.productTypeTitle || HOME_VIEW_DEFAULTS.productTypeTitle);
      setShowPrimeSection(data.showPrimeSection !== false);
      setShowProductTypeSections(data.showProductTypeSections !== false);
      setProductCardStyle(data.productCardStyle === "comfortable" ? "comfortable" : "compact");
      const shop = data.shopLocation || HOME_VIEW_DEFAULTS.shopLocation;
      setShopName(shop.name || HOME_VIEW_DEFAULTS.shopLocation.name);
      setShopLine1(shop.line1 || "");
      setShopCity(shop.city || "");
      setShopState(shop.state || "");
      setShopPostalCode(shop.postalCode || "");
      setShopLatitude(
        Number.isFinite(Number(shop.latitude)) ? String(shop.latitude) : ""
      );
      setShopLongitude(
        Number.isFinite(Number(shop.longitude)) ? String(shop.longitude) : ""
      );
      setHeroSlides(normalizeHeroSlides(data.heroSlides));
    } catch (err) {
      setError(err.message || "Unable to load home view settings.");
    }
  }, [token]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadSettings();
  }, [user, loadSettings]);

  const handleUseShopGps = async () => {
    try {
      setGpsLoading(true);
      setError("");
      const resolved = await getCurrentAddressFromGPS();
      if (resolved.line1) setShopLine1(resolved.line1);
      if (resolved.city) setShopCity(resolved.city);
      if (resolved.state) setShopState(resolved.state);
      if (resolved.postalCode) setShopPostalCode(resolved.postalCode);
      if (Number.isFinite(Number(resolved.latitude))) setShopLatitude(String(resolved.latitude));
      if (Number.isFinite(Number(resolved.longitude))) setShopLongitude(String(resolved.longitude));
    } catch (err) {
      setError(err.message || "Unable to read location.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateAdminHomeView(token, {
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim(),
        primeSectionTitle: primeSectionTitle.trim(),
        productTypeTitle: productTypeTitle.trim(),
        showPrimeSection,
        showProductTypeSections,
        productCardStyle,
        shopLocation: {
          name: shopName.trim() || HOME_VIEW_DEFAULTS.shopLocation.name,
          line1: shopLine1.trim(),
          city: shopCity.trim(),
          state: shopState.trim(),
          postalCode: shopPostalCode.trim(),
          latitude: shopLatitude.trim() ? Number(shopLatitude) : null,
          longitude: shopLongitude.trim() ? Number(shopLongitude) : null,
        },
        heroSlides,
      });
      setSuccess("Storefront settings saved.");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <View style={[styles.gatePanel, { margin: spacing.lg }]}>
          <PremiumErrorBanner
            severity="warning"
            title={ADMIN_GATE.title}
            message="This account does not have admin privileges."
          />
          <PremiumButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
        </View>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="inner"
        showFooter={false}
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title="Home view editor"
          subtitle="Control the customer home screen"
          headerRight={
            <PremiumButton label="Save changes" variant="primary" size="sm" onPress={handleSave} loading={saving} disabled={saving} />
          }
        >
        <View style={[adminTwoColStyle(compact), styles.panel]}>
          <View style={adminTwoColMain(compact)}>
          <AdminAlerts error={error} success={success} onCloseError={() => setError("")} onCloseSuccess={() => setSuccess("")} />

          <AdminPanel title="Home layout">
          <Section label={copy.heroSection} hint={copy.heroHint} styles={styles} revealIndex={0}>
            <View style={styles.fieldGap}>
              <PremiumInput label="Hero title" value={heroTitle} onChangeText={setHeroTitle} iconLeft="sparkles-outline" />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Hero subtitle"
                value={heroSubtitle}
                onChangeText={setHeroSubtitle}
                multiline
                numberOfLines={3}
                iconLeft="text-outline"
              />
            </View>
          </Section>

          <Section label={copy.heroMediaSection} hint={copy.heroMediaHint} styles={styles} revealIndex={1}>
            <AdminHomeHeroEditor
              token={token}
              heroSlides={heroSlides}
              onHeroSlidesChange={setHeroSlides}
              onError={setError}
            />
          </Section>

          <Section label={copy.sectionTitles} hint={copy.sectionTitlesHint} styles={styles} revealIndex={2}>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Prime section title"
                value={primeSectionTitle}
                onChangeText={setPrimeSectionTitle}
                placeholder="e.g. Prime Products"
                iconLeft="layers-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Product type strip title"
                value={productTypeTitle}
                onChangeText={setProductTypeTitle}
                placeholder="e.g. Shop by category"
                iconLeft="grid-outline"
              />
            </View>
          </Section>

          <AdminToggleRow
            title="Prime / bestsellers section"
            subtitle="Show the curated product grid"
            value={showPrimeSection}
            onValueChange={setShowPrimeSection}
          />
          <AdminToggleRow
            title="Category section"
            subtitle="Show shop-by-category rail"
            value={showProductTypeSections}
            onValueChange={setShowProductTypeSections}
            isLast
          />
          </AdminPanel>

          <Section label={copy.shopLocationSection} hint={copy.shopLocationHint} styles={styles} revealIndex={4}>
            <View style={styles.fieldGap}>
              <PremiumInput
                label={copy.shopNameLabel}
                value={shopName}
                onChangeText={setShopName}
                iconLeft="storefront-outline"
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label={copy.shopAddressLabel}
                value={shopLine1}
                onChangeText={setShopLine1}
                iconLeft="home-outline"
              />
            </View>
            <View style={styles.splitRow}>
              <View style={[styles.fieldGap, styles.halfField]}>
                <PremiumInput label={copy.shopCityLabel} value={shopCity} onChangeText={setShopCity} />
              </View>
              <View style={[styles.fieldGap, styles.halfField]}>
                <PremiumInput label={copy.shopStateLabel} value={shopState} onChangeText={setShopState} />
              </View>
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label={copy.shopPostalLabel}
                value={shopPostalCode}
                onChangeText={setShopPostalCode}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.splitRow}>
              <View style={[styles.fieldGap, styles.halfField]}>
                <PremiumInput
                  label="Latitude"
                  value={shopLatitude}
                  onChangeText={setShopLatitude}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldGap, styles.halfField]}>
                <PremiumInput
                  label="Longitude"
                  value={shopLongitude}
                  onChangeText={setShopLongitude}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <PremiumButton
              label={gpsLoading ? copy.shopUseGpsLoading : copy.shopUseGps}
              iconLeft="locate-outline"
              variant="secondary"
              size="md"
              onPress={handleUseShopGps}
              disabled={gpsLoading}
              loading={gpsLoading}
            />
          </Section>

          <Section label={copy.cardLayoutSection} hint={copy.cardLayoutHint} styles={styles} revealIndex={5}>
            <View style={styles.row}>
              <PremiumChip
                label="Compact"
                tone="gold"
                size="md"
                selected={productCardStyle === "compact"}
                onPress={() => setProductCardStyle("compact")}
                style={styles.modeChip}
              />
              <PremiumChip
                label="Comfortable"
                tone="gold"
                size="md"
                selected={productCardStyle === "comfortable"}
                onPress={() => setProductCardStyle("comfortable")}
                style={styles.modeChip}
              />
            </View>
          </Section>

          <Section label={copy.quickLinks} hint={null} styles={styles} revealIndex={6}>
            <View style={[styles.linkStack, { borderColor: c.border }]}>
              <QuickLinkRow
                title={copy.linkProductsTitle}
                subtitle={copy.linkProductsSubtitle}
                icon="cube-outline"
                onPress={() => navigation.navigate("AdminProducts")}
                styles={styles}
                c={c}
              />
              <View style={[styles.linkDivider, { backgroundColor: c.border }]} />
              <QuickLinkRow
                title={copy.linkAddProductTitle}
                subtitle={copy.linkAddProductSubtitle}
                icon="add-circle-outline"
                onPress={() => navigation.navigate("AdminAddProduct")}
                styles={styles}
                c={c}
              />
            </View>
          </Section>

          </View>
          <View style={adminTwoColAside(compact)}>
            <AdminPanel title="Live preview">
              <AdminPhonePreview
                heroTitle={heroTitle}
                heroSubtitle={heroSubtitle}
                primeTitle={primeSectionTitle}
                categoryTitle={productTypeTitle}
                showPrime={showPrimeSection}
                showCategories={showProductTypeSections}
              />
            </AdminPanel>
          </View>
        </View>
        </KankregAdminShell>
</KankregScrollPage>
    </AdminScreenShell>
  );
}

function createAdminHomeViewStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1},
    panel: adminShellContent(),
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: {
      marginTop: spacing.md,
      alignSelf: "flex-start"},
    toggleCard: {
      marginBottom: spacing.sm},
    modeChip: {
      flex: 1},
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35},
    subtitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      fontFamily: fonts.medium},
    section: {
      marginBottom: spacing.lg},
    sectionLabel: {
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.extrabold,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: spacing.xs},
    sectionHint: {
      color: c.textMuted,
      fontSize: typography.caption,
      lineHeight: 17,
      fontFamily: fonts.medium,
      marginBottom: spacing.sm},
    bannerSpacer: {
      marginBottom: spacing.sm},
    fieldGap: {
      marginBottom: spacing.sm},
    splitRow: {
      flexDirection: "row",
      gap: spacing.sm},
    halfField: {
      flex: 1,
      minWidth: 0},
    toggleBtnText: {
      fontWeight: "700",
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold},
    toggleDetail: {
      marginTop: 4,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 16},
    row: {
      flexDirection: "row",
      gap: spacing.sm},
    linkStack: {
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: "hidden"},
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} })},
    linkIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center"},
    linkTextCol: {
      flex: 1,
      minWidth: 0},
    linkTitle: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold},
    linkSubtitle: {
      marginTop: 2,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 16},
    linkDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: spacing.md + 44 + spacing.md}});
}
