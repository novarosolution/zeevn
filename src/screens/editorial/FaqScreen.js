import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Screen from "../../components/ui/Screen";
import Input from "../../components/ui/Input";
import AppFooter from "../../components/AppFooter";
import FaqAccordionCard from "../../components/editorial/FaqAccordionCard";
import { FAQ_PAGE } from "../../content/editorialContent";
import { useTheme } from "../../context/ThemeContext";
import useRouteMeta from "../../hooks/useRouteMeta";
import { fonts } from "../../theme/tokens";

export default function FaqScreen({ navigation }) {
  useRouteMeta("faq", { faqItems: FAQ_PAGE.categories.flatMap((c) => c.items.map((i) => ({ q: i.q, a: i.a }))) });
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return FAQ_PAGE.categories;
    return FAQ_PAGE.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [query]);

  return (
    <Screen navigation={navigation} breadcrumbLabel="Help">
      <View style={{ marginBottom: SPACING.xl }}>
        <Input
          label={FAQ_PAGE.searchPlaceholder}
          placeholder={FAQ_PAGE.searchPlaceholder}
          value={query}
          onChangeText={setQuery}
          iconLeft="search-outline"
        />
      </View>
      {filtered.map((category) => (
        <View key={category.key} style={{ marginBottom: SPACING["2xl"] }}>
          <Text
            style={{
              fontFamily: TYPE.serifFamily,
              ...TYPE.h3,
              color: semanticPalette.ink,
              marginBottom: SPACING.md,
            }}
          >
            {category.title}
          </Text>
          {category.items.map((item, idx) => (
            <FaqAccordionCard
              key={item.id}
              item={item}
              helpfulPrompt={FAQ_PAGE.helpfulPrompt}
              defaultOpen={!query && idx === 0}
            />
          ))}
        </View>
      ))}
      {filtered.length === 0 ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted }}>
          No questions match your search.
        </Text>
      ) : null}
      <AppFooter webTight />
    </Screen>
  );
}
