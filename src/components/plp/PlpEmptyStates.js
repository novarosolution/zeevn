import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";
import { HOME_CATEGORY_QUICK_NAV, HOME_EMPTY_STATES, PLP_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { suggestSearchSpellings } from "../../utils/plpCatalog";

function Illustration({ name }) {
  const { semanticPalette, SPACING } = useTheme();
  return (
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: semanticPalette.accentSoft,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: SPACING.md,
        alignSelf: "center",
      }}
    >
      <Ionicons name={name} size={40} color={semanticPalette.accent} />
    </View>
  );
}

export function PlpSearchEmptyState({ query, catalog, navigation, onClearSearch }) {
  const { semanticPalette, SPACING, TYPE } = useTheme();
  const copy = HOME_EMPTY_STATES.noSearchResults;
  const suggestions = suggestSearchSpellings(query, catalog);

  return (
    <View style={{ alignItems: "center", gap: SPACING.lg, paddingVertical: SPACING.xl }}>
      <Illustration name={copy.icon} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink, textAlign: "center" }}>
        {copy.title}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft, textAlign: "center", maxWidth: 360 }}>
        {copy.body}
      </Text>
      {suggestions.length ? (
        <View style={{ alignItems: "center", gap: SPACING.sm }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted }}>
            {PLP_UI.searchSuggestionsLabel}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: SPACING.sm }}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                onPress={() => navigation.setParams({ q: s })}
                style={{
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.sm,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: semanticPalette.line,
                  backgroundColor: semanticPalette.surface,
                }}
              >
                <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ width: "100%", maxWidth: 420, gap: SPACING.sm }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.inkMuted, textAlign: "center" }}>
          {PLP_UI.popularCategoriesLabel}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: SPACING.sm }}>
          {HOME_CATEGORY_QUICK_NAV.slice(0, 6).map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() =>
                navigation.setParams({
                  q: "",
                  category: cat.filter,
                  categoryLabel: cat.label,
                })
              }
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: 999,
                backgroundColor: semanticPalette.surfaceAlt,
              }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Button label={copy.clearCta} variant="primary" size="md" onPress={onClearSearch} />
    </View>
  );
}

export function PlpCategoryEmptyState({ categoryLabel, navigation }) {
  const { semanticPalette, SPACING, TYPE } = useTheme();
  const copy = PLP_UI.categoryEmpty;
  return (
    <View style={{ paddingVertical: 24 }}>
      <EmptyState
        iconName="grid-outline"
        title={copy.title}
        description={copy.body}
        ctaLabel={copy.browseCta}
        onCtaPress={() => navigation.navigate("Categories")}
      />
      <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
        {HOME_CATEGORY_QUICK_NAV.filter((c) => c.label !== categoryLabel)
          .slice(0, 5)
          .map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() =>
                navigation.setParams({
                  q: "",
                  category: cat.filter,
                  categoryLabel: cat.label,
                })
              }
              style={{
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: 999,
                backgroundColor: semanticPalette.surfaceAlt,
              }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.accent }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const PlpEmptyStates = memo(function PlpEmptyStates(props) {
  if (props.variant === "category") return <PlpCategoryEmptyState {...props} />;
  return <PlpSearchEmptyState {...props} />;
});

export default PlpEmptyStates;
