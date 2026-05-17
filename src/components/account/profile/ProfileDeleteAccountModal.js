import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../context/ThemeContext";
import { ACCOUNT_PROFILE_SCREEN } from "../../../content/appContent";
import { FONT_DISPLAY_SEMI } from "../../../theme/customerAlchemy";
import { fonts } from "../../../theme/tokens";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import useReducedMotion from "../../../hooks/useReducedMotion";
import useModalA11y from "../../../hooks/useModalA11y";
import { hapticDeleteConfirmEnabled } from "../../../utils/accountHaptics";

const copy = ACCOUNT_PROFILE_SCREEN.deleteFlow;

export default function ProfileDeleteAccountModal({ visible, busy, onCancel, onConfirm }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState(copy.reasonOptions[0]);
  const [feedback, setFeedback] = useState("");
  const prevCanDelete = useRef(false);
  const pulse = useSharedValue(0);

  const confirmHelperId = "delete-account-confirm-helper";
  const canDelete = confirmText === "DELETE" && !busy;

  useEffect(() => {
    if (canDelete && !prevCanDelete.current) {
      hapticDeleteConfirmEnabled();
      if (!reducedMotion) {
        pulse.value = withSequence(
          withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
        );
      }
    }
    prevCanDelete.current = canDelete;
  }, [canDelete, pulse, reducedMotion]);

  const confirmBorderStyle = useAnimatedStyle(() => ({
    borderWidth: 1 + pulse.value,
    borderColor: pulse.value > 0.2 ? semanticPalette.accent : "transparent",
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: "center",
          padding: SPACING.lg,
          backgroundColor: "rgba(14,14,14,0.45)",
        },
        card: {
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
          maxHeight: "90%",
        },
        title: {
          fontFamily: FONT_DISPLAY_SEMI,
          fontSize: TYPE.h3.fontSize,
          lineHeight: TYPE.h3.lineHeight,
          color: semanticPalette.ink,
        },
        body: {
          marginTop: SPACING.sm,
          fontFamily: fonts.regular,
          fontSize: TYPE.body.fontSize,
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.inkSoft,
        },
        reasonRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.sm,
          paddingVertical: SPACING.sm,
        },
        reasonLabel: {
          flex: 1,
          fontFamily: fonts.regular,
          fontSize: TYPE.small.fontSize,
          color: semanticPalette.ink,
        },
      }),
    [TYPE, SPACING, semanticPalette]
  );

  const handleClose = () => {
    if (busy) return;
    setConfirmText("");
    setReason(copy.reasonOptions[0]);
    setFeedback("");
    onCancel();
  };

  useModalA11y({ visible, onClose: handleClose, containerRef });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable ref={containerRef} style={styles.overlay} onPress={handleClose}>
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <Card padding="lg" style={[styles.card, { borderRadius: RADII.lg }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.body}>{copy.body}</Text>

              <View style={{ marginTop: SPACING.lg }}>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: TYPE.small.fontSize,
                    color: semanticPalette.ink,
                    marginBottom: SPACING.sm,
                  }}
                >
                  {copy.reasonPrompt}
                </Text>
                {copy.reasonOptions.map((opt) => {
                  const selected = reason === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setReason(opt)}
                      style={styles.reasonRow}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Ionicons
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={selected ? semanticPalette.accent : semanticPalette.inkMuted}
                      />
                      <Text style={styles.reasonLabel}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ marginTop: SPACING.md }}>
                <Input label={copy.feedbackPlaceholder} value={feedback} onChangeText={setFeedback} multiline />
              </View>

              <View style={{ marginTop: SPACING.lg }}>
                <Text
                  nativeID={confirmHelperId}
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: TYPE.caption.fontSize,
                    color: semanticPalette.inkMuted,
                    marginBottom: 6,
                  }}
                >
                  {copy.confirmLabel}
                </Text>
                <Input
                  label={canDelete ? copy.confirmCta : copy.confirmDisabledLabel}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                  errorId={null}
                  describedBy={confirmHelperId}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  gap: SPACING.sm,
                  marginTop: SPACING.lg,
                  ...Platform.select({ web: { justifyContent: "flex-end" } }),
                }}
              >
                <Button label={copy.cancelCta} variant="ghost" size="md" style={{ flex: 1 }} onPress={handleClose} disabled={busy} />
                <Animated.View style={[{ flex: 1, borderRadius: 999 }, confirmBorderStyle]}>
                  <Button
                    label={busy ? copy.deleting : canDelete ? copy.confirmCta : copy.confirmDisabledLabel}
                    variant="destructive"
                    size="md"
                    fullWidth
                    disabled={!canDelete}
                    loading={busy}
                    onPress={() => onConfirm({ reason, feedback })}
                  />
                </Animated.View>
              </View>
            </ScrollView>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
