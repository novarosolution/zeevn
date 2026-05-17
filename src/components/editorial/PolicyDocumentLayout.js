import React, { useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import EditorialLink from "./EditorialLink";

const PROSE_MAX_WIDTH = 720;

/**
 * Policy / legal document: sticky TOC (desktop web), prose body, serif headings.
 */
export default function PolicyDocumentLayout({ lastUpdated, toc = [], blocks = [] }) {
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING } = useTheme();

  const showSidebar = Platform.OS === "web" && width >= 1024 && toc.length > 0;

  const scrollToSection = useCallback((id) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const el = document.getElementById(`policy-section-${id}`);
      el?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, []);

  const renderedBlocks = useMemo(() => {
    const bodyLineStyle = {
      fontFamily: fonts.regular,
      fontSize: TYPE.bodyLg.fontSize,
      lineHeight: TYPE.bodyLg.lineHeight * 1.6,
      color: semanticPalette.inkSoft,
      marginBottom: SPACING.md,
    };
    return blocks.map((block) => {
        if (block.type === "h2") {
          return (
            <View key={block.id} nativeID={`policy-section-${block.id}`}>
              <Text
                style={{
                  fontFamily: TYPE.serifFamily,
                  ...TYPE.h2,
                  color: semanticPalette.ink,
                  marginTop: SPACING["2xl"],
                  marginBottom: SPACING.md,
                }}
              >
                {block.text}
              </Text>
            </View>
          );
        }
        if (block.type === "h3") {
          return (
            <Text
              key={block.id}
              style={{
                fontFamily: TYPE.serifFamily,
                ...TYPE.h3,
                color: semanticPalette.ink,
                marginTop: SPACING.xl,
                marginBottom: SPACING.sm,
              }}
            >
              {block.text}
            </Text>
          );
        }
        if (block.type === "link") {
          return (
            <EditorialLink key={block.id} href={block.href} onPress={block.onPress}>
              {block.text}
            </EditorialLink>
          );
        }
        return (
          <Text key={block.id} style={bodyLineStyle}>
            {block.text}
          </Text>
        );
      });
  }, [SPACING, TYPE, blocks, semanticPalette.ink, semanticPalette.inkSoft]);

  const mainColumn = (
    <View style={{ flex: 1, minWidth: 0, maxWidth: PROSE_MAX_WIDTH }}>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: TYPE.caption.fontSize,
          color: semanticPalette.inkMuted,
          marginBottom: SPACING.lg,
        }}
      >
        Last updated {lastUpdated}
      </Text>
      {renderedBlocks}
    </View>
  );

  const sidebar = showSidebar ? (
    <View
      style={[
        styles.tocSidebar,
        {
          borderRightColor: semanticPalette.line,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: TYPE.micro.fontSize,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: semanticPalette.inkMuted,
          marginBottom: SPACING.md,
        }}
      >
        On this page
      </Text>
      {toc.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => scrollToSection(item.id)}
          style={({ pressed, hovered }) => [
            styles.tocRow,
            hovered && Platform.OS === "web" ? { opacity: 0.75 } : null,
            pressed ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  ) : null;

  if (!showSidebar) {
    return mainColumn;
  }

  return (
    <View style={styles.docRow}>
      {sidebar}
      <View style={styles.docMain}>{mainColumn}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  docRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 48,
    width: "100%",
  },
  tocSidebar: {
    width: 200,
    flexShrink: 0,
    paddingRight: 24,
    borderRightWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { position: "sticky", top: 96, alignSelf: "flex-start" },
      default: {},
    }),
  },
  tocRow: {
    paddingVertical: 8,
  },
  docMain: {
    flex: 1,
    minWidth: 0,
  },
});
