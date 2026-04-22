import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { fetchAdminHomeView, updateAdminHomeView } from "../../services/adminService";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { ADMIN_HOME_VIEW_COPY, HOME_VIEW_DEFAULTS } from "../../content/appContent";

function Section({ label, hint, children, styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      {children}
    </View>
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

export default function AdminHomeViewScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminHomeViewStyles(c, shadowPremium), [c, shadowPremium]);
  const { token, user } = useAuth();
  const copy = ADMIN_HOME_VIEW_COPY;
  const [heroTitle, setHeroTitle] = useState(HOME_VIEW_DEFAULTS.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(HOME_VIEW_DEFAULTS.heroSubtitle);
  const [primeSectionTitle, setPrimeSectionTitle] = useState(HOME_VIEW_DEFAULTS.primeSectionTitle);
  const [productTypeTitle, setProductTypeTitle] = useState(HOME_VIEW_DEFAULTS.productTypeTitle);
  const [showPrimeSection, setShowPrimeSection] = useState(true);
  const [showHomeSections, setShowHomeSections] = useState(true);
  const [showProductTypeSections, setShowProductTypeSections] = useState(true);
  const [productCardStyle, setProductCardStyle] = useState("compact");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    try {
      setError("");
      const data = await fetchAdminHomeView(token);
      setHeroTitle(data.heroTitle || HOME_VIEW_DEFAULTS.heroTitle);
      setHeroSubtitle(data.heroSubtitle || HOME_VIEW_DEFAULTS.heroSubtitle);
      setPrimeSectionTitle(data.primeSectionTitle || HOME_VIEW_DEFAULTS.primeSectionTitle);
      setProductTypeTitle(data.productTypeTitle || HOME_VIEW_DEFAULTS.productTypeTitle);
      setShowPrimeSection(data.showPrimeSection !== false);
      setShowHomeSections(data.showHomeSections !== false);
      setShowProductTypeSections(data.showProductTypeSections !== false);
      setProductCardStyle(data.productCardStyle === "comfortable" ? "comfortable" : "compact");
    } catch (err) {
      setError(err.message || "Unable to load home view settings.");
    }
  }

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadSettings();
  }, [user?.isAdmin]);

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
        showHomeSections,
        showProductTypeSections,
        productCardStyle,
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
      <CustomerScreenShell style={styles.screen}>
        <View style={[styles.panel, { margin: spacing.lg }]}>
          <Text style={styles.title}>Admin Access Required</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.saveBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
      <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <Section label={copy.heroSection} hint={copy.heroHint} styles={styles}>
            <TextInput
              style={styles.input}
              placeholder="Hero title"
              placeholderTextColor={c.textMuted}
              value={heroTitle}
              onChangeText={setHeroTitle}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Hero subtitle"
              placeholderTextColor={c.textMuted}
              value={heroSubtitle}
              onChangeText={setHeroSubtitle}
              multiline
            />
          </Section>

          <Section label={copy.sectionTitles} hint={copy.sectionTitlesHint} styles={styles}>
            <TextInput
              style={styles.input}
              placeholder="Prime / default section title (e.g. Prime Products)"
              placeholderTextColor={c.textMuted}
              value={primeSectionTitle}
              onChangeText={setPrimeSectionTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Product type strip title (e.g. Shop by category)"
              placeholderTextColor={c.textMuted}
              value={productTypeTitle}
              onChangeText={setProductTypeTitle}
            />
          </Section>

          <Section label={copy.visibilitySection} hint={copy.visibilityHint} styles={styles}>
            <TouchableOpacity
              style={[styles.toggleBtn, showPrimeSection ? styles.toggleBtnActive : null]}
              onPress={() => setShowPrimeSection((current) => !current)}
            >
              <Text style={[styles.toggleBtnText, showPrimeSection ? styles.toggleBtnTextActive : null]}>
                {showPrimeSection ? "Show prime section: ON" : "Show prime section: OFF"}
              </Text>
              <Text style={styles.toggleDetail}>
                Affects how the prime-titled bucket is merged with other Home section groups on the storefront.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, showHomeSections ? styles.toggleBtnActive : null]}
              onPress={() => setShowHomeSections((current) => !current)}
            >
              <Text style={[styles.toggleBtnText, showHomeSections ? styles.toggleBtnTextActive : null]}>
                {showHomeSections ? "Show home sections: ON" : "Show home sections: OFF"}
              </Text>
              <Text style={styles.toggleDetail}>When on, Home can render one card per section title (plus merged list rules above).</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, showProductTypeSections ? styles.toggleBtnActive : null]}
              onPress={() => setShowProductTypeSections((current) => !current)}
            >
              <Text style={[styles.toggleBtnText, showProductTypeSections ? styles.toggleBtnTextActive : null]}>
                {showProductTypeSections ? "Show product types: ON" : "Show product types: OFF"}
              </Text>
              <Text style={styles.toggleDetail}>Saved for your storefront profile (toggle + title travel with the same home-view API).</Text>
            </TouchableOpacity>
          </Section>

          <Section label={copy.cardLayoutSection} hint={copy.cardLayoutHint} styles={styles}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.modeBtn, productCardStyle === "compact" ? styles.modeBtnActive : null]}
                onPress={() => setProductCardStyle("compact")}
              >
                <Text style={[styles.modeBtnText, productCardStyle === "compact" ? styles.modeBtnTextActive : null]}>Compact</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, productCardStyle === "comfortable" ? styles.modeBtnActive : null]}
                onPress={() => setProductCardStyle("comfortable")}
              >
                <Text
                  style={[styles.modeBtnText, productCardStyle === "comfortable" ? styles.modeBtnTextActive : null]}
                >
                  Comfortable
                </Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section label={copy.quickLinks} hint={null} styles={styles}>
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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save storefront settings"}</Text>
          </TouchableOpacity>
        </View>
        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminHomeViewStyles(c, shadowPremium) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      width: "100%",
      alignSelf: "center",
      maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
      paddingBottom: spacing.xxl,
    },
    panel: {
      ...adminPanel(c, shadowPremium),
    },
    title: {
      color: c.textPrimary,
      fontSize: typography.h2,
      fontFamily: fonts.extrabold,
      letterSpacing: -0.35,
    },
    subtitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      color: c.textSecondary,
      fontSize: typography.bodySmall,
      lineHeight: 20,
      fontFamily: fonts.medium,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      color: c.textPrimary,
      fontSize: typography.bodySmall,
      fontFamily: fonts.extrabold,
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    sectionHint: {
      color: c.textMuted,
      fontSize: typography.caption,
      lineHeight: 17,
      fontFamily: fonts.medium,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 11,
      marginBottom: spacing.sm,
      backgroundColor: c.surfaceMuted,
      color: c.textPrimary,
      fontFamily: fonts.regular,
    },
    inputMultiline: {
      minHeight: 72,
      textAlignVertical: "top",
      paddingTop: spacing.sm,
    },
    errorText: {
      color: c.danger,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    successText: {
      color: c.success,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    toggleBtn: {
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surfaceMuted,
    },
    toggleBtnActive: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    toggleBtnText: {
      color: c.textPrimary,
      fontWeight: "700",
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    toggleBtnTextActive: {
      color: c.primaryDark,
    },
    toggleDetail: {
      marginTop: 4,
      fontSize: typography.caption,
      color: c.textSecondary,
      fontFamily: fonts.medium,
      lineHeight: 16,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    modeBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: c.surfaceMuted,
    },
    modeBtnActive: {
      borderColor: c.primaryBorder,
      backgroundColor: c.primarySoft,
    },
    modeBtnText: {
      color: c.textPrimary,
      fontWeight: "700",
      fontSize: typography.bodySmall,
    },
    modeBtnTextActive: {
      color: c.primary,
    },
    linkStack: {
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    linkIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
    },
    linkTextCol: {
      flex: 1,
      minWidth: 0,
    },
    linkTitle: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.bold,
    },
    linkSubtitle: {
      marginTop: 2,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 16,
    },
    linkDivider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: spacing.md + 44 + spacing.md,
    },
    saveBtn: {
      marginTop: spacing.sm,
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      alignItems: "center",
      paddingVertical: 14,
    },
    saveBtnText: {
      color: c.onPrimary,
      fontWeight: "700",
      fontSize: typography.bodySmall,
    },
  });
}
