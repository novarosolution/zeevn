import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import Screen from "../components/ui/Screen";
import Button from "../components/ui/Button";
import AppFooter from "../components/AppFooter";
import { NOT_FOUND_SCREEN } from "../content/appContent";
import { getProducts } from "../services/productService";
import { useTheme } from "../context/ThemeContext";
import { formatINRWhole } from "../utils/currency";
import { getImageUriCandidates } from "../utils/image";
import { HOME_CATALOG_ALL, matchesShelfProduct } from "../utils/shelfMatch";
import useRouteMeta from "../hooks/useRouteMeta";
import { fonts } from "../theme/tokens";

export default function NotFoundScreen({ navigation }) {
  useRouteMeta("notFound");
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts();
        if (cancelled) return;
        const list = Array.isArray(data) ? data.filter((p) => matchesShelfProduct(p, HOME_CATALOG_ALL)) : [];
        setProducts(list.slice(0, 4));
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tileBasis = useMemo(() => {
    if (width >= 900) return "23%";
    if (width >= 520) return "48%";
    return "100%";
  }, [width]);

  return (
    <Screen
      navigation={navigation}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View style={{ width: "100%", maxWidth: 640, alignItems: "center", paddingVertical: SPACING["3xl"] }}>
        <Text
          style={{
            fontFamily: TYPE.serifFamily,
            fontSize: Platform.OS === "web" ? 96 : 72,
            lineHeight: Platform.OS === "web" ? 100 : 76,
            letterSpacing: -2,
            color: semanticPalette.ink,
            textAlign: "center",
          }}
        >
          {NOT_FOUND_SCREEN.code}
        </Text>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: TYPE.bodyLg.fontSize,
            lineHeight: TYPE.bodyLg.lineHeight * 1.5,
            color: semanticPalette.inkMuted,
            textAlign: "center",
            marginTop: SPACING.md,
            marginBottom: SPACING["2xl"],
          }}
        >
          {NOT_FOUND_SCREEN.title}
        </Text>
        <View style={{ flexDirection: width >= 480 ? "row" : "column", gap: SPACING.md, marginBottom: SPACING["3xl"] }}>
          <Button label={NOT_FOUND_SCREEN.primaryCta} variant="primary" onPress={() => navigation.navigate("Home")} />
          <Button label={NOT_FOUND_SCREEN.secondaryCta} variant="secondary" onPress={() => navigation.navigate("Search")} />
        </View>

        {products.length > 0 ? (
          <View style={{ width: "100%" }}>
            <Text
              style={{
                fontFamily: TYPE.serifFamily,
                ...TYPE.h3,
                color: semanticPalette.ink,
                textAlign: "center",
                marginBottom: SPACING.lg,
              }}
            >
              {NOT_FOUND_SCREEN.stripTitle}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.md, justifyContent: "center" }}>
              {products.map((p) => {
                const uri = getImageUriCandidates(p?.image || (Array.isArray(p?.images) ? p.images[0] : ""))[0] || "";
                return (
                  <Pressable
                    key={String(p.id)}
                    onPress={() => navigation.navigate("Product", { productId: String(p.id) })}
                    style={({ pressed, hovered }) => [
                      {
                        width: tileBasis,
                        minWidth: 140,
                        maxWidth: 220,
                        flexGrow: 1,
                        borderRadius: RADII.md,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: semanticPalette.line,
                        backgroundColor: semanticPalette.surface,
                        overflow: "hidden",
                      },
                      hovered && Platform.OS === "web" ? { opacity: 0.92 } : null,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View style={{ aspectRatio: 1, backgroundColor: semanticPalette.surfaceAlt }}>
                      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                    </View>
                    <View style={{ padding: SPACING.sm }}>
                      <Text numberOfLines={2} style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
                        {p.name}
                      </Text>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.ink, marginTop: 4 }}>
                        {formatINRWhole(p.price)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
      <AppFooter webTight />
    </Screen>
  );
}
