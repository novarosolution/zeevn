import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

export default function AdminProductCell({ name, imageUri, index = 0 }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome, isDark), [chrome, isDark]);
  const placeholderBg = isDark
    ? `rgba(52, 211, 153, ${0.08 + (index % 4) * 0.03})`
    : ["#e8f0eb", "#e7eee6", "#e7eee6", "#e8e9ee"][index % 4];

  return (
    <View style={styles.row}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: placeholderBg }]}>
          <Text style={styles.glyph}>∷</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

function createStyles(chrome, isDark) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    thumb: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    glyph: {
      color: isDark ? chrome.goldBright : "#5a4326",
      fontSize: 14,
    },
    name: {
      flex: 1,
      color: chrome.ink,
      fontFamily: fonts.semibold,
      fontSize: 12.5,
    },
  });
}
