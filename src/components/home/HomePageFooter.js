import React, { useMemo, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  APP_DISPLAY_NAME,
  HOME_FOOTER,
} from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { FONT_DISPLAY } from "../../theme/customerAlchemy";
import { fonts, getSemanticColors, layout, radius, semanticRadius, spacing, typography } from "../../theme/tokens";

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
      marginTop: spacing.xl + 6,
      paddingVertical: spacing.xl - 2,
      paddingHorizontal: Platform.select({ web: spacing.xl + 2, default: spacing.lg }),
      paddingBottom: 36,
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
      gap: spacing.md,
      marginBottom: spacing.md + 2,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(226,232,240,0.16)",
    },
    newsletterTextCol: {
      flex: 1,
      minWidth: 240,
      gap: 4,
    },
    newsletterTitle: {
      fontFamily: FONT_DISPLAY,
      fontSize: typography.h3,
      lineHeight: typography.h3 + 6,
      letterSpacing: -0.3,
      color: "#F8FAFC",
    },
    newsletterSub: {
      color: "rgba(203,213,225,0.92)",
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      lineHeight: 18,
    },
    newsletterToast: {
      color: "#A7F3D0",
      fontSize: typography.caption,
      fontFamily: fonts.semibold,
      marginTop: 2,
    },
    newsletterFormRow: {
      minWidth: 260,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
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
      paddingHorizontal: spacing.sm,
      color: "#F8FAFC",
      fontFamily: fonts.medium,
      fontSize: typography.bodySmall,
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
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
    },
    socialBtn: {
      width: 38,
      height: 38,
      borderRadius: semanticRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(226,232,240,0.22)",
      backgroundColor: "rgba(248,250,252,0.08)",
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
      gap: spacing.xs + 2,
      marginBottom: spacing.md + 2,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: spacing.lg + 4,
      rowGap: spacing.md + 2,
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
      fontSize: typography.overline + 1,
      fontFamily: fonts.extrabold,
      color: "#E2E8F0",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: spacing.sm,
    },
    linkRow: {
      paddingVertical: 6,
      borderRadius: semanticRadius.control,
      paddingHorizontal: 0,
    },
    linkRowHover: {
      backgroundColor: "rgba(248,250,252,0.08)",
    },
    linkText: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.medium,
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
      fontSize: typography.caption,
      fontFamily: fonts.medium,
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
      gap: spacing.xs,
    },
    meta: {
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      color: "rgba(203,213,225,0.9)",
    },
  });
}
