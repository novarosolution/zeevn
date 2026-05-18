import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Badge from "../ui/Badge";
import { TRENDING_SEARCHES, SEARCH_OVERLAY_UI } from "../../content/appContent";
import { useDebouncedSearchProducts } from "../../hooks/useDebouncedSearchProducts";
import { useTheme } from "../../context/ThemeContext";
import { formatINRWhole } from "../../utils/currency";
import { getImageUriCandidates } from "../../utils/image";
import { fonts, icon, semanticRadius } from "../../theme/tokens";
import { WEB_Z_INDEX } from "../../theme/web";

function SearchChip({ label, onPress, selected }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <Badge variant={selected ? "brass" : "neutral"} size="md">
        {label}
      </Badge>
    </Pressable>
  );
}

/**
 * Recent / Trending chips + product suggestion rows (56px) with keyboard navigation on web.
 */
export function SearchSuggestionsPanel({
  recentSearches,
  onAddRecent,
  query,
  onClose,
  onSubmitTerm,
  onPickProduct,
  colors: colorsProp,
  isDark: isDarkProp,
  listenWindowKeys = true,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  fullBleed = false,
}) {
  const theme = useTheme();
  const colors = colorsProp || {
    textPrimary: theme.semanticPalette.ink,
    textSecondary: theme.semanticPalette.inkSoft,
    textMuted: theme.semanticPalette.inkMuted,
    surface: theme.semanticPalette.surface,
  };
  const isDark = isDarkProp ?? theme.isDark;
  const { semanticPalette, SPACING } = theme;

  const productHits = useDebouncedSearchProducts(query, 200);
  const term = String(query || "").trim();

  const rows = useMemo(() => {
    const out = [];
    const rec = (recentSearches || []).filter(Boolean);
    if (rec.length) {
      out.push({ kind: "header", key: "h-recent", label: SEARCH_OVERLAY_UI.recentTitle });
      rec.forEach((t, i) => {
        out.push({ kind: "recent", key: `r-${i}-${t}`, term: t });
      });
    }
    out.push({ kind: "header", key: "h-trend", label: SEARCH_OVERLAY_UI.trendingTitle });
    TRENDING_SEARCHES.forEach((t, i) => {
      out.push({ kind: "trending", key: `t-${i}-${t}`, term: t });
    });
    if (term && productHits.length > 0) {
      out.push({ kind: "header", key: "h-prod", label: SEARCH_OVERLAY_UI.productsTitle });
      productHits.forEach((p, i) => {
        out.push({ kind: "product", key: `p-${p?.id ?? i}`, product: p });
      });
    }
    return out;
  }, [productHits, recentSearches, term]);

  const selectableRows = useMemo(() => rows.filter((r) => r.kind !== "header"), [rows]);
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;
  const setActiveIndex = onActiveIndexChange ?? setInternalIndex;

  useEffect(() => {
    if (controlledIndex != null) return;
    setInternalIndex(0);
  }, [controlledIndex, query, rows.length]);

  const runRow = useCallback(
    (row) => {
      if (!row) return;
      if (row.kind === "recent" || row.kind === "trending") {
        onAddRecent(row.term);
        onSubmitTerm(row.term);
      } else if (row.kind === "product" && row.product) {
        onAddRecent(String(row.product.name || "").trim());
        onPickProduct(row.product);
      }
    },
    [onAddRecent, onPickProduct, onSubmitTerm]
  );

  useEffect(() => {
    if (!listenWindowKeys || Platform.OS !== "web" || typeof window === "undefined") return undefined;
    const onKey = (e) => {
      if (!e) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, selectableRows.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const row = selectableRows[activeIndex];
        if (!row) return;
        e.preventDefault();
        runRow(row);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, listenWindowKeys, runRow, selectableRows, setActiveIndex]);

  const surfaceAlt = isDark ? "rgba(255,255,255,0.06)" : semanticPalette.surfaceAlt;

  const chipSection = (title, chips) => (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{title}</Text>
      <View style={styles.chipRow}>{chips}</View>
    </View>
  );

  const recentChips = (recentSearches || [])
    .filter(Boolean)
    .map((t, i) => {
      const flatIndex = selectableRows.findIndex((r) => r.kind === "recent" && r.term === t);
      return (
        <SearchChip
          key={`chip-r-${i}`}
          label={t}
          selected={flatIndex === activeIndex}
          onPress={() => runRow({ kind: "recent", term: t })}
        />
      );
    });

  const trendingChips = TRENDING_SEARCHES.map((t, i) => {
    const flatIndex = selectableRows.findIndex((r) => r.kind === "trending" && r.term === t);
    return (
      <SearchChip
        key={`chip-t-${i}`}
        label={t}
        selected={flatIndex === activeIndex}
        onPress={() => runRow({ kind: "trending", term: t })}
      />
    );
  });

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={[styles.scroll, fullBleed && { flex: 1 }]}
      contentContainerStyle={{
        paddingHorizontal: fullBleed ? SPACING.lg : SPACING.md,
        paddingBottom: SPACING["3xl"],
        maxWidth: 720,
        width: "100%",
        alignSelf: "center",
      }}
      nativeID="search-suggestions"
      accessibilityRole={Platform.OS === "web" ? "listbox" : undefined}
      accessibilityLabel="Search suggestions"
    >
      {recentChips.length > 0 ? chipSection(SEARCH_OVERLAY_UI.recentTitle, recentChips) : null}
      {chipSection(SEARCH_OVERLAY_UI.trendingTitle, trendingChips)}

      {term && productHits.length > 0 ? (
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{SEARCH_OVERLAY_UI.productsTitle}</Text>
          {productHits.map((p, i) => {
            const flatIndex = selectableRows.findIndex((r) => r.kind === "product" && r.product?.id === p.id);
            const selected = flatIndex === activeIndex;
            const name = String(p?.name || "").trim();
            const uri = getImageUriCandidates(p?.image || (Array.isArray(p?.images) ? p.images[0] : ""))[0] || "";
            const price = formatINRWhole(Number(p?.price) || 0);
            return (
              <Pressable
                key={`prod-${p.id}-${i}`}
                onPress={() => runRow({ kind: "product", product: p })}
                style={({ pressed, hovered }) => [
                  styles.productRow,
                  {
                    backgroundColor: selected ? surfaceAlt : "transparent",
                    borderColor: selected ? semanticPalette.line : "transparent",
                  },
                  hovered && Platform.OS === "web" ? { backgroundColor: surfaceAlt } : null,
                  pressed && { opacity: 0.88 },
                ]}
                accessibilityRole={Platform.OS === "web" ? "option" : "button"}
                accessibilityState={{ selected }}
              >
                <View style={[styles.thumb, { backgroundColor: semanticPalette.surfaceAlt }]}>
                  {uri ? (
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Ionicons name="image-outline" size={icon.sm} color={colors.textMuted} />
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={[styles.productName, { color: colors.textPrimary }]}>
                  {name}
                </Text>
                <Text style={[styles.productPrice, { color: semanticPalette.ink }]}>{price}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

export default function SearchSuggestionsPopover({
  visible,
  onClose,
  anchorRef,
  query,
  onSubmitTerm,
  onPickProduct,
  recentSearches,
  onAddRecent,
  colors,
  isDark,
}) {
  const [box, setBox] = useState({ top: 0, left: 0, width: 280 });

  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const node = anchorRef?.current;
    if (!node || typeof node.measureInWindow !== "function") return;
    const id = requestAnimationFrame(() => {
      node.measureInWindow((x, y, width, height) => {
        setBox({
          top: y + height + 8,
          left: x,
          width: Math.max(280, width),
        });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [anchorRef, visible, query]);

  useEffect(() => {
    if (!visible || Platform.OS !== "web" || typeof document === "undefined") return undefined;
    const onDoc = (e) => {
      const t = e?.target;
      const anchor = anchorRef?.current;
      const pop = document.getElementById("search-suggestions-popover-root");
      if (anchor && typeof anchor.contains === "function" && t && anchor.contains(t)) return;
      if (pop && t && typeof pop.contains === "function" && pop.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [anchorRef, onClose, visible]);

  if (!visible || Platform.OS !== "web") return null;

  return (
    <>
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={onClose}
        style={[styles.scrim, { zIndex: WEB_Z_INDEX.dropdownScrim }]}
      />
      <View
        nativeID="search-suggestions-popover-root"
        style={[
          styles.popover,
          {
            top: box.top,
            left: box.left,
            width: box.width,
            maxHeight: 480,
            backgroundColor: colors.surface,
            borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(148,163,184,0.35)",
            zIndex: WEB_Z_INDEX.dropdown,
          },
        ]}
      >
        <SearchSuggestionsPanel
          recentSearches={recentSearches}
          onAddRecent={onAddRecent}
          query={query}
          onClose={onClose}
          onSubmitTerm={onSubmitTerm}
          onPickProduct={onPickProduct}
          colors={colors}
          isDark={isDark}
          listenWindowKeys
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...(Platform.OS === "web"
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }
      : {}),
    backgroundColor: "transparent",
  },
  popover: {
    position: "fixed",
    borderRadius: semanticRadius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
        }
      : {}),
  },
  scroll: {
    maxHeight: Platform.OS === "web" ? 480 : undefined,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: semanticRadius.panel,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    minWidth: 0,
  },
  productPrice: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
});
