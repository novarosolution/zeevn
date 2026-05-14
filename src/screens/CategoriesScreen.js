import React, { useMemo } from "react";
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeCategoryGrid from "../components/home/HomeCategoryGrid";
import { HOME_CATEGORY_QUICK_NAV, HOME_CATEGORY_UI } from "../content/appContent";
import { useTheme } from "../context/ThemeContext";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";

export default function CategoriesScreen({ navigation }) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => (navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate("Home"))}
            style={({ pressed }) => [styles.backBtn, pressed ? styles.backBtnPressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={icon.md} color={c.textPrimary} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.pageTitle}>{HOME_CATEGORY_UI.title}</Text>
        </View>
        <HomeCategoryGrid
          categories={HOME_CATEGORY_QUICK_NAV}
          overline={HOME_CATEGORY_UI.overline}
          title={HOME_CATEGORY_UI.title}
          viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
          onPressViewAll={undefined}
          onPressCategory={(category) =>
            navigation.navigate({
              name: "Home",
              merge: true,
              params: { filterHomeCategory: category?.filter || category?.label || "" },
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    backBtn: {
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(100,116,139,0.22)",
      ...Platform.select({
        web: { cursor: "pointer" },
        default: {},
      }),
    },
    backBtnPressed: {
      opacity: 0.78,
    },
    backLabel: {
      fontSize: typography.bodySmall,
      fontFamily: fonts.semibold,
      color: c.textPrimary,
      marginRight: 2,
    },
    pageTitle: {
      fontSize: typography.h4,
      fontFamily: fonts.semibold,
      color: c.textPrimary,
    },
  });
}
