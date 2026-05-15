import React, { useMemo, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  APP_DISPLAY_NAME,
  HOME_FOOTER,
} from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts, getSemanticColors, layout, radius, semanticRadius, spacing, typography } from "../../theme/tokens";
import { homeType } from "../../styles/typography";
import { spacing as homeSpacing } from "../../styles/spacing";

/**
 * Premium editorial footer:
 * - desktop: 4 columns
 * - tablet: 2 columns
 * - mobile: accordion columns
 */
export default function HomePageFooter({ colors: c }) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState("");
  const [openKeys, setOpenKeys] = useState(() => new Set(["shop"]));
  const semantic = getSemanticColors(c);
  const styles = useMemo(() => createStyles(c, isDark, semantic), [c, isDark, semantic]);
  const isDesktop = width >= 1200;
  const isMobile = width < 768;
  const footerColumns = (HOME_FOOTER.sections || [])
    .map((col) => ({
      ...col,
      links: (col.links || []).filter((link) => String(link?.label || "").trim()),
    }))
    .filter((col) => String(col.title || "").trim() && col.links.length > 0);
  const social = (HOME_FOOTER.social || []).filter((s) => s?.icon);
  const paymentIcons = HOME_FOOTER.bottom?.paymentIcons || [];

  const submitNewsletter = () => {
    if (!String(email || "").trim()) return;
    setToast(HOME_FOOTER.newsletter.success);
    setEmail("");
  };

  const toggleSection = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <View style={styles.shell}>
      <View style={styles.newsletterStrip}>
        <View style={styles.newsletterTextCol}>
          <Text style={styles.newsletterTitle}>{HOME_FOOTER.newsletter.title}</Text>
          <Text style={styles.newsletterSub}>{HOME_FOOTER.newsletter.subtitle}</Text>
          {toast ? <Text style={styles.newsletterToast}>{toast}</Text> : null}
        </View>
        <View style={styles.newsletterFormRow}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={HOME_FOOTER.newsletter.inputPlaceholder}
            placeholderTextColor="rgba(203,213,225,0.7)"
            style={styles.newsletterInput}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable
            onPress={submitNewsletter}
            style={({ pressed }) => [styles.newsletterBtn, pressed ? styles.newsletterBtnPressed : null]}
            accessibilityRole="button"
            accessibilityLabel={HOME_FOOTER.newsletter.cta}
          >
            <Text style={styles.newsletterBtnText}>{HOME_FOOTER.newsletter.cta}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.socialRow}>
        {social.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => (item.url ? Linking.openURL(item.url) : null)}
            style={({ hovered, pressed }) => [
              styles.socialBtn,
              hovered && Platform.OS === "web" ? styles.socialBtnHover : null,
              pressed ? styles.socialBtnPressed : null,
            ]}
            accessibilityRole={item.url ? "link" : "button"}
            accessibilityLabel={item.key}
          >
            <Ionicons name={item.icon} size={20} color="#E2E8F0" />
          </Pressable>
        ))}
      </View>

      {isMobile ? (
        <View style={styles.accordionWrap}>
          {footerColumns.map((column) => {
            const open = openKeys.has(column.key);
            return (
              <View key={column.key} style={styles.accordionItem}>
                <Pressable
                  onPress={() => toggleSection(column.key)}
                  style={({ pressed }) => [styles.accordionHeader, pressed ? { opacity: 0.82 } : null]}
                  accessibilityRole="button"
                  accessibilityLabel={`${open ? "Collapse" : "Expand"} ${column.title}`}
                >
                  <Text style={styles.colTitle}>{column.title}</Text>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#E2E8F0" />
                </Pressable>
                {open ? (
                  <View style={styles.accordionBody}>
                    {column.links.map((link) => (
                      <Pressable
                        key={`${column.key}-${link.label}`}
                        onPress={() => {
                          if (link.url) void Linking.openURL(link.url);
                          else if (link.route) navigation.navigate(link.route);
                        }}
                        style={({ pressed }) => [styles.linkRow, pressed ? { opacity: 0.7 } : null]}
                      >
                        <Text style={styles.linkText}>{link.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.grid, isDesktop ? styles.gridDesktop : styles.gridTablet]}>
          {footerColumns.map((column) => (
            <View key={column.key} style={[styles.col, isDesktop ? styles.colDesktop : styles.colTablet]}>
              <Text style={styles.colTitle}>{column.title}</Text>
              {column.links.map((link) => (
                <Pressable
                  key={`${column.key}-${link.label}`}
                  onPress={() => {
                    if (link.url) void Linking.openURL(link.url);
                    else if (link.route) navigation.navigate(link.route);
                  }}
                  style={({ hovered, pressed }) => [
                    styles.linkRow,
                    hovered && Platform.OS === "web" ? styles.linkRowHover : null,
                    pressed ? { opacity: 0.7 } : null,
                  ]}
                >
                  <Text style={styles.linkText}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomBar}>
        <Text style={styles.copy}>© {new Date().getFullYear()} {APP_DISPLAY_NAME}</Text>
        <View style={styles.bottomRight}>
          <View style={styles.paymentRow}>
            {paymentIcons.map((name) => (
              <Ionicons key={name} name={name} size={16} color="#E2E8F0" />
            ))}
          </View>
          <Text style={styles.meta}>{HOME_FOOTER.bottom?.madeWithCare}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(c, isDark, semantic) {
  return StyleSheet.create({
    shell: {
      marginTop: homeSpacing["3xl"],
      paddingVertical: homeSpacing["2xl"],
      paddingHorizontal: Platform.select({ web: homeSpacing["2xl"], default: homeSpacing.xl }),
      paddingBottom: homeSpacing["3xl"],
      borderRadius: semanticRadius.panel,
      backgroundColor: isDark ? "#09090B" : "#111827",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(226,232,240,0.2)",
      maxWidth: layout.maxContentWidth,
      alignSelf: "center",
      width: "100%",
      ...Platform.select({
        web: {
          boxShadow: "0 20px 40px rgba(2,6,23,0.22)",
        },
        default: {},
      }),
    },
    newsletterStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: homeSpacing.base,
      marginBottom: homeSpacing.lg,
      paddingBottom: homeSpacing.base,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(226,232,240,0.16)",
    },
    newsletterTextCol: {
      flex: 1,
      minWidth: 240,
      gap: homeSpacing.xs,
    },
    newsletterTitle: {
      fontFamily: homeType.display.fontFamily,
      fontSize: 28,
      lineHeight: Math.round(28 * 1.1),
      letterSpacing: -(28 * 0.025),
      color: "#F8FAFC",
      fontWeight: "500",
    },
    newsletterSub: {
      color: "rgba(203,213,225,0.92)",
      fontSize: 14,
      fontFamily: homeType.uiRegular.fontFamily,
      lineHeight: Math.round(14 * 1.5),
    },
    newsletterToast: {
      color: "#A7F3D0",
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      marginTop: homeSpacing.xs,
    },
    newsletterFormRow: {
      minWidth: 260,
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.md,
      flex: 1,
      maxWidth: 460,
    },
    newsletterInput: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(203,213,225,0.24)",
      backgroundColor: "rgba(15,23,42,0.45)",
      paddingHorizontal: homeSpacing.sm,
      color: "#F8FAFC",
      fontFamily: homeType.uiRegular.fontFamily,
      fontSize: 14,
    },
    newsletterBtn: {
      minHeight: 42,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(226,232,240,0.3)",
      backgroundColor: "rgba(248,250,252,0.12)",
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    newsletterBtnPressed: {
      opacity: 0.84,
    },
    newsletterBtnText: {
      color: "#F8FAFC",
      fontSize: 13,
      fontFamily: homeType.uiSemibold.fontFamily,
      lineHeight: Math.round(13 * 1.4),
    },
    socialBtn: {
      width: 36,
      height: 36,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(226,232,240,0.22)",
      backgroundColor: "rgba(255,255,255,0.06)",
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: { cursor: "pointer", transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease" },
        default: {},
      }),
    },
    socialBtnHover: {
      backgroundColor: "rgba(248,250,252,0.16)",
      borderColor: "rgba(226,232,240,0.38)",
      ...Platform.select({
        web: { boxShadow: "0 6px 14px rgba(2,6,23,0.3)" },
        default: {},
      }),
    },
    socialBtnPressed: { opacity: 0.8 },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.md,
      marginBottom: homeSpacing.lg,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: homeSpacing.xl,
      rowGap: homeSpacing.lg,
      justifyContent: "flex-start",
      marginBottom: spacing.lg,
    },
    gridDesktop: {},
    gridTablet: {},
    col: {
      minWidth: 0,
    },
    colDesktop: {
      width: "23%",
    },
    colTablet: {
      width: "47%",
    },
    accordionWrap: {
      marginBottom: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(226,232,240,0.16)",
    },
    accordionItem: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(226,232,240,0.16)",
    },
    accordionHeader: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
    },
    accordionBody: {
      paddingBottom: spacing.sm,
    },
    colTitle: {
      fontSize: 11,
      fontFamily: homeType.overline.fontFamily,
      color: "#E2E8F0",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      marginBottom: spacing.sm,
    },
    linkRow: {
      paddingVertical: homeSpacing.sm,
      borderRadius: semanticRadius.control,
      paddingHorizontal: 0,
    },
    linkRowHover: {
      backgroundColor: "rgba(248,250,252,0.08)",
    },
    linkText: {
      fontSize: 13,
      fontFamily: homeType.uiRegular.fontFamily,
      lineHeight: Math.round(13 * 1.5),
      color: "#F8FAFC",
    },
    bottomBar: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(226,232,240,0.16)",
      paddingTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: spacing.sm,
      alignItems: "center",
    },
    copy: {
      fontSize: 12,
      fontFamily: homeType.uiRegular.fontFamily,
      lineHeight: Math.round(12 * 1.4),
      color: "rgba(203,213,225,0.9)",
    },
    bottomRight: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "flex-end",
    },
    paymentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: homeSpacing.sm,
    },
    meta: {
      fontSize: 12,
      fontFamily: homeType.uiRegular.fontFamily,
      lineHeight: Math.round(12 * 1.4),
      color: "rgba(203,213,225,0.9)",
    },
  });
}
