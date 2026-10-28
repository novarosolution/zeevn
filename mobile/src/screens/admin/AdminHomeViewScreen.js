import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { ADMIN_HOME_VIEW_COPY } from "../../content/appContent";
import { HOME_VIEW_DEFAULTS } from "../../content/homeViewDefaults";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminButton from "../../components/admin/AdminButton";
import AdminHomeHeroEditor from "../../components/admin/AdminHomeHeroEditor";
import AdminInput from "../../components/admin/AdminInput";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminPhonePreview from "../../components/admin/AdminPhonePreview";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import PremiumChip from "../../components/ui/PremiumChip";
import AdminNotice from "../../components/admin/AdminNotice";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminHomeView, updateAdminHomeView, updateAdminStoreSettings } from "../../services/adminService";
import { getCurrentAddressFromGPS } from "../../services/locationService";
import {
  adminGatePanel,
  adminShellContent,
  adminTwoColAside,
  adminTwoColMain,
  adminTwoColStyle,
  ADMIN_FONT,
  useAdminChrome,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";
import { realCoord } from "../../utils/geoCoord";

const COPY = ADMIN_SCREEN_COPY.homeView;
const LABELS = ADMIN_HOME_VIEW_COPY;
const FESTIVAL_KEYS = LABELS.festivalOptions.map((option) => option.key);

function applyConfig(data, setters) {
  setters.setHeroTitle(data.heroTitle || HOME_VIEW_DEFAULTS.heroTitle);
  setters.setHeroSubtitle(data.heroSubtitle || HOME_VIEW_DEFAULTS.heroSubtitle);
  setters.setPrimeSectionTitle(data.primeSectionTitle || HOME_VIEW_DEFAULTS.primeSectionTitle);
  setters.setProductTypeTitle(data.productTypeTitle || HOME_VIEW_DEFAULTS.productTypeTitle);
  setters.setShowPrimeSection(data.showPrimeSection !== false);
  setters.setShowProductTypeSections(data.showProductTypeSections !== false);
  setters.setProductCardStyle(data.productCardStyle === "comfortable" ? "comfortable" : "compact");
  setters.setFestivalKey(FESTIVAL_KEYS.includes(data.festivalKey) ? data.festivalKey : "");
  const shop = data.shopLocation || HOME_VIEW_DEFAULTS.shopLocation;
  setters.setShopName(shop.name || HOME_VIEW_DEFAULTS.shopLocation.name);
  setters.setShopLine1(shop.line1 || "");
  setters.setShopCity(shop.city || "");
  setters.setShopState(shop.state || "");
  setters.setShopPostalCode(shop.postalCode || "");
  setters.setShopLatitude(realCoord(shop.latitude) !== null ? String(shop.latitude) : "");
  setters.setShopLongitude(realCoord(shop.longitude) !== null ? String(shop.longitude) : "");
  setters.setHeroSlides(
    (Array.isArray(data.heroSlides) ? data.heroSlides : []).map((slide, index) => ({
      id: slide.id || `slide-${index + 1}`,
      order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : index,
      mediaType: "image",
      url: slide.url || "",
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      enabled: slide.enabled !== false,
    }))
  );
}

function slidesForSave(slides) {
  return (slides || [])
    .map((slide, index) => ({
      id: slide.id || `slide-${index + 1}`,
      order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : index,
      mediaType: "image",
      url: String(slide.url || "").trim(),
      title: String(slide.title || "").trim(),
      subtitle: String(slide.subtitle || "").trim(),
      enabled: slide.enabled !== false,
    }))
    .filter((slide) => slide.url)
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);
}

function QuickLink({ title, subtitle, icon, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={18} color="#2a7559" />
      </View>
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9a8b7c" />
    </Pressable>
  );
}

export default function AdminHomeViewScreen({ navigation, route }) {
  const { token, user } = useAuth();
  const { colors: c, shadowPremium } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [heroTitle, setHeroTitle] = useState(HOME_VIEW_DEFAULTS.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(HOME_VIEW_DEFAULTS.heroSubtitle);
  const [primeSectionTitle, setPrimeSectionTitle] = useState(HOME_VIEW_DEFAULTS.primeSectionTitle);
  const [productTypeTitle, setProductTypeTitle] = useState(HOME_VIEW_DEFAULTS.productTypeTitle);
  const [showPrimeSection, setShowPrimeSection] = useState(true);
  const [showProductTypeSections, setShowProductTypeSections] = useState(true);
  const [productCardStyle, setProductCardStyle] = useState("compact");
  const [festivalKey, setFestivalKey] = useState("");
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

  // State setters never change identity, so the bundle is built once and `loadSettings` stays stable.
  const setters = useMemo(() => ({
    setHeroTitle,
    setHeroSubtitle,
    setPrimeSectionTitle,
    setProductTypeTitle,
    setShowPrimeSection,
    setShowProductTypeSections,
    setProductCardStyle,
    setFestivalKey,
    setShopName,
    setShopLine1,
    setShopCity,
    setShopState,
    setShopPostalCode,
    setShopLatitude,
    setShopLongitude,
    setHeroSlides,
  }), []);

  const loadSettings = useCallback(async () => {
    try {
      setError("");
      applyConfig(await fetchAdminHomeView(token), setters);
    } catch (err) {
      setError(err.message || "Unable to load home view settings.");
    }
  }, [token, setters]);

  useEffect(() => {
    if (user?.isAdmin) loadSettings();
  }, [user?.isAdmin, loadSettings]);

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
    const lat = realCoord(shopLatitude.trim());
    const lng = realCoord(shopLongitude.trim());
    const name = shopName.trim() || HOME_VIEW_DEFAULTS.shopLocation.name;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const saved = await updateAdminHomeView(token, {
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim(),
        primeSectionTitle: primeSectionTitle.trim(),
        productTypeTitle: productTypeTitle.trim(),
        showPrimeSection,
        showProductTypeSections,
        productCardStyle,
        festivalKey,
        shopLocation: {
          name,
          line1: shopLine1.trim(),
          city: shopCity.trim(),
          state: shopState.trim(),
          postalCode: shopPostalCode.trim(),
          latitude: lat,
          longitude: lng,
        },
        heroSlides: slidesForSave(heroSlides),
      });
      if (lat != null && lng != null) {
        await updateAdminStoreSettings(token, { latitude: lat, longitude: lng, label: name }).catch(() => {});
      }
      applyConfig(saved, setters);
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
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <AdminNotice severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <AdminButton label={ADMIN_GATE.backHome} variant="primary" onPress={() => navigateCustomerRoute(navigation, "Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const saveBar = (
    <View style={[styles.saveBar, compact && styles.saveDock, compact && { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <AdminButton
        label={saving ? "Saving…" : "Save"}
        icon="save-outline"
        variant="primary"
        size="md"
        loading={saving}
        disabled={saving}
        fullWidth={compact}
        onPress={handleSave}
      />
    </View>
  );

  const form = (
    <View style={styles.form}>
      <AdminAlerts error={error} success={success} onCloseError={() => setError("")} onCloseSuccess={() => setSuccess("")} />

      <AdminPanel title="Hero" icon="sparkles-outline" description={LABELS.heroHint}>
        <AdminInput label="Title" value={heroTitle} onChangeText={setHeroTitle} icon="sparkles-outline" />
        <AdminInput label="Subtitle" value={heroSubtitle} onChangeText={setHeroSubtitle} multiline numberOfLines={3} icon="text-outline" />
      </AdminPanel>

      <AdminPanel title="Hero slider" icon="images-outline" description={LABELS.heroMediaHint}>
        <AdminHomeHeroEditor token={token} heroSlides={heroSlides} onHeroSlidesChange={setHeroSlides} onError={setError} />
      </AdminPanel>

      <AdminPanel title="Home headings" icon="list-outline" description={LABELS.sectionTitlesHint}>
        <AdminInput
          label="Prime title"
          value={primeSectionTitle}
          onChangeText={setPrimeSectionTitle}
          placeholder="Prime Products"
          icon="layers-outline"
        />
        <AdminInput
          label="Category title"
          value={productTypeTitle}
          onChangeText={setProductTypeTitle}
          placeholder="Shop by category"
          icon="grid-outline"
        />
        <AdminToggleRow
          title="Show prime section"
          subtitle="Products with no home section of their own"
          value={showPrimeSection}
          onValueChange={setShowPrimeSection}
        />
        <AdminToggleRow
          title="Show the category rail"
          subtitle="Shop by category"
          value={showProductTypeSections}
          onValueChange={setShowProductTypeSections}
        />
        <Text style={styles.fieldLabel}>Card density</Text>
        <View style={styles.row}>
          <PremiumChip
            label="Compact"
            tone="gold"
            size="md"
            selected={productCardStyle === "compact"}
            onPress={() => setProductCardStyle("compact")}
            style={styles.chip}
          />
          <PremiumChip
            label="Comfortable"
            tone="gold"
            size="md"
            selected={productCardStyle === "comfortable"}
            onPress={() => setProductCardStyle("comfortable")}
            style={styles.chip}
          />
        </View>
      </AdminPanel>

      <AdminPanel title="Festival look" icon="color-palette-outline" description={LABELS.festivalHint}>
        <View style={styles.chipWrap}>
          {LABELS.festivalOptions.map((option) => (
            <PremiumChip
              key={option.key || "auto"}
              label={option.label}
              tone="gold"
              size="md"
              selected={festivalKey === option.key}
              onPress={() => setFestivalKey(option.key)}
            />
          ))}
        </View>
      </AdminPanel>

      <AdminPanel title="Shop pin" icon="navigate-outline" description={LABELS.shopLocationHint}>
        <AdminInput label="Name" value={shopName} onChangeText={setShopName} icon="storefront-outline" />
        <AdminInput label="Address line" value={shopLine1} onChangeText={setShopLine1} icon="home-outline" />
        <View style={styles.split}>
          <AdminInput label="City" value={shopCity} onChangeText={setShopCity} style={styles.half} />
          <AdminInput label="State" value={shopState} onChangeText={setShopState} style={styles.half} />
        </View>
        <AdminInput label="PIN" value={shopPostalCode} onChangeText={setShopPostalCode} integer />
        <View style={styles.split}>
          <AdminInput label="Latitude" value={shopLatitude} onChangeText={setShopLatitude} numeric style={styles.half} />
          <AdminInput label="Longitude" value={shopLongitude} onChangeText={setShopLongitude} numeric style={styles.half} />
        </View>
        <AdminButton
          label={gpsLoading ? LABELS.shopUseGpsLoading : LABELS.shopUseGps}
          icon="locate-outline"
          variant="soft"
          onPress={handleUseShopGps}
          loading={gpsLoading}
          disabled={gpsLoading}
        />
      </AdminPanel>

      <AdminPanel title="Catalog" icon="link-outline" description="Product names, prices, photos, and Show on home stay on Products.">
        <View style={styles.links}>
          <QuickLink
            title={LABELS.linkProductsTitle}
            subtitle={LABELS.linkProductsSubtitle}
            icon="cube-outline"
            onPress={() => navigation.navigate("AdminProducts")}
            styles={styles}
          />
          <QuickLink
            title={LABELS.linkAddProductTitle}
            subtitle={LABELS.linkAddProductSubtitle}
            icon="add-circle-outline"
            onPress={() => navigation.navigate("AdminAddProduct")}
            styles={styles}
          />
        </View>
      </AdminPanel>

      {!compact ? saveBar : null}
    </View>
  );

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage
          scrollVariant="admin"
          showFooter={false}
          style={customerScrollFill}
          keyboardShouldPersistTaps="handled"
          stickyFooterExtra={compact ? 72 : 0}
        >
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={COPY.title}
            subtitle={COPY.subtitle}
            headerRight={
              compact ? null : (
                <AdminButton label={saving ? "Saving…" : "Save"} icon="save-outline" variant="primary" size="sm" loading={saving} disabled={saving} onPress={handleSave} />
              )
            }
          >
            <View style={[adminTwoColStyle(compact), styles.panel]}>
              <View style={adminTwoColMain(compact)}>{form}</View>
              {!compact ? (
                <View style={adminTwoColAside(compact)}>
                  <AdminPanel title="Phone preview" icon="phone-portrait-outline" description="Customer home.">
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
              ) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
        {compact ? saveBar : null}
      </KeyboardAvoidingView>
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: adminShellContent(),
    form: { gap: spacing.sm + 2 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    fieldLabel: {
      marginTop: 8,
      marginBottom: 6,
      fontSize: 11.5,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.semibold,
    },
    row: { flexDirection: "row", gap: 8 },
    chip: { flex: 1 },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    split: { flexDirection: "row", gap: 8 },
    half: { flex: 1, minWidth: 0 },
    links: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.lineSoft,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    linkIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: chrome.paper,
    },
    linkCopy: { flex: 1, minWidth: 0 },
    linkTitle: { fontSize: 13.5, color: chrome.ink, fontFamily: ADMIN_FONT.semibold },
    linkSub: { marginTop: 2, fontSize: 11.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
    saveBar: { marginTop: 4 },
    saveDock: {
      marginTop: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: chrome.line,
      backgroundColor: chrome.card,
    },
  });
}
