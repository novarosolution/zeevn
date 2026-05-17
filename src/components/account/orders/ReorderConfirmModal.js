import React, { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { ORDER_DETAIL_SCREEN, fillPlaceholders } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../../theme/customerAlchemy";
import { fonts } from "../../../theme/tokens";
import { formatINR } from "../../../utils/currency";
import { getImageUriCandidates } from "../../../utils/image";
import useReducedMotion from "../../../hooks/useReducedMotion";

const copy = ORDER_DETAIL_SCREEN.reorderModal;

function ReorderLine({ line, idx, reducedMotion, rowRef }) {
  const { semanticPalette, SPACING, TYPE } = useTheme();
  const uri = getImageUriCandidates(line.image || "")[0] || "";
  const qty = Number(line.quantity || 1);
  const price = Number(line.price || 0);

  const row = (
    <View
      ref={idx === 0 ? rowRef : undefined}
      style={{
        flexDirection: "row",
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: semanticPalette.lineSoft,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: 48, height: 60, borderRadius: 8 }} contentFit="cover" />
      ) : (
        <View style={{ width: 48, height: 60, borderRadius: 8, backgroundColor: semanticPalette.surfaceAlt }} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>
          {line.name}
        </Text>
        {line.variantLabel ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: 2 }}>
            {line.variantLabel}
          </Text>
        ) : null}
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: 4 }}>
          Qty {qty} · {formatINR(price * qty)}
        </Text>
      </View>
    </View>
  );

  if (reducedMotion) return row;

  return (
    <Animated.View entering={FadeInDown.delay(idx * 40).duration(220).springify().damping(18)}>
      {row}
    </Animated.View>
  );
}

export default function ReorderConfirmModal({ visible, items, busy, onCancel, onConfirm }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const reducedMotion = useReducedMotion();
  const list = Array.isArray(items) ? items : [];
  const firstRowRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
  }, [visible]);

  const handleConfirm = () => {
    if (busy) return;
    const measureAndConfirm = () => {
      if (Platform.OS === "web" && firstRowRef.current?.measureInWindow) {
        firstRowRef.current.measureInWindow((x, y, width, height) => {
          const uri = getImageUriCandidates(list[0]?.image || "")[0] || "";
          onConfirm?.({ sourceRect: { x, y, width, height }, imageUri: uri });
        });
        return;
      }
      firstRowRef.current?.measure?.((x, y, width, height, pageX, pageY) => {
        const uri = getImageUriCandidates(list[0]?.image || "")[0] || "";
        onConfirm?.({
          sourceRect: { x: pageX ?? x, y: pageY ?? y, width, height },
          imageUri: uri,
        });
      }) ?? onConfirm?.();
    };
    measureAndConfirm();
  };

  const SheetWrap = reducedMotion ? View : Animated.View;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel}>
        <Pressable onPress={(e) => e.stopPropagation?.()} style={styles.sheetPressable}>
          <SheetWrap
            {...(!reducedMotion
              ? { entering: FadeInUp.duration(280).springify().damping(20) }
              : {})}
          >
            <Card padding="lg" style={[styles.sheet, { borderRadius: RADII.lg, backgroundColor: semanticPalette.surface }]}>
              <View style={styles.handle} />
              <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>
                {fillPlaceholders(copy.titleTemplate, { count: String(list.length) })}
              </Text>
              <ScrollView style={{ maxHeight: 300, marginTop: SPACING.md }} showsVerticalScrollIndicator={false}>
                {list.map((line, idx) => (
                  <ReorderLine key={`${line.product || line.name}-${idx}`} line={line} idx={idx} reducedMotion={reducedMotion} rowRef={firstRowRef} />
                ))}
              </ScrollView>
              <View ref={confirmRef} style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
                <Button label={copy.cancel} variant="ghost" size="md" style={{ flex: 1 }} onPress={onCancel} disabled={busy} />
                <Button
                  label={busy ? copy.adding : copy.confirm}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                  loading={busy}
                  onPress={handleConfirm}
                />
              </View>
            </Card>
          </SheetWrap>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(14,14,14,0.42)",
    ...Platform.select({
      web: { justifyContent: "center", alignItems: "center", padding: 24 },
      default: {},
    }),
  },
  sheetPressable: {
    width: "100%",
    ...Platform.select({
      web: { maxWidth: 440 },
      default: {},
    }),
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      web: { borderRadius: 20 },
      default: {},
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(14,14,14,0.12)",
    alignSelf: "center",
    marginBottom: 12,
  },
});
