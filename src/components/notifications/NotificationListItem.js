import React, { useRef } from "react";
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../ui/Card";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";
import { getNotificationCategory, getNotificationIcon } from "../../utils/notificationCategory";

function formatTimestamp(createdAt) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationListItem({ item, onPress, onDismiss }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const category = getNotificationCategory(item);
  const iconName = getNotificationIcon(category);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Platform.OS !== "web" && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -88) {
          Animated.timing(translateX, { toValue: -420, duration: 180, useNativeDriver: true }).start(() => onDismiss?.());
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
        }
      },
    })
  ).current;

  const content = (
    <Card padding="md" onPress={onPress} style={{ marginBottom: SPACING.md }}>
      <View style={styles.row}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: RADII.pill,
            backgroundColor: semanticPalette.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={iconName} size={icon.md} color={semanticPalette.accent} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                fontFamily: fonts.semibold,
                fontSize: TYPE.body.fontSize,
                color: semanticPalette.ink,
              }}
            >
              {item.title}
            </Text>
            {!item.isRead ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: semanticPalette.accent,
                  marginLeft: SPACING.sm,
                  marginTop: 4,
                }}
              />
            ) : null}
          </View>
          <Text
            numberOfLines={3}
            style={{
              fontFamily: fonts.regular,
              fontSize: TYPE.small.fontSize,
              lineHeight: TYPE.small.lineHeight,
              color: semanticPalette.inkMuted,
              marginTop: 4,
            }}
          >
            {item.message}
          </Text>
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: TYPE.micro.fontSize,
              color: semanticPalette.inkMuted,
              marginTop: SPACING.sm,
            }}
          >
            {formatTimestamp(item.createdAt)}
          </Text>
        </View>
        {Platform.OS === "web" ? (
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              onDismiss?.();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="close" size={icon.sm} color={semanticPalette.inkMuted} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  if (Platform.OS === "web") {
    return content;
  }

  return (
    <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dismissBtn: {
    padding: 4,
    marginTop: 2,
  },
});
