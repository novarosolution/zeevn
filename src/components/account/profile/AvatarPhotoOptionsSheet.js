import React from "react";
import { ActionSheetIOS, Alert, Modal, Platform, Pressable, Text, View } from "react-native";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { ACCOUNT_PROFILE_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";
import useModalA11y from "../../../hooks/useModalA11y";

const copy = ACCOUNT_PROFILE_SCREEN.avatarOptions;

export function pickAvatarPhotoOption({ onTakePhoto, onChooseLibrary, onRemove }) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [copy.takePhoto, copy.chooseLibrary, copy.removePhoto, copy.cancel],
        cancelButtonIndex: 3,
        destructiveButtonIndex: 2,
      },
      (index) => {
        if (index === 0) onTakePhoto?.();
        if (index === 1) onChooseLibrary?.();
        if (index === 2) onRemove?.();
      }
    );
    return;
  }

  Alert.alert(copy.title, undefined, [
    { text: copy.takePhoto, onPress: onTakePhoto },
    { text: copy.chooseLibrary, onPress: onChooseLibrary },
    { text: copy.removePhoto, style: "destructive", onPress: onRemove },
    { text: copy.cancel, style: "cancel" },
  ]);
}

export default function AvatarPhotoOptionsSheet({ visible, onClose, onTakePhoto, onChooseLibrary, onRemove }) {
  const { SPACING, RADII, semanticPalette, TYPE } = useTheme();
  useModalA11y({ visible, onClose });

  if (Platform.OS === "ios") return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(14,14,14,0.38)" }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <Card padding="lg" style={{ borderTopLeftRadius: RADII.lg, borderTopRightRadius: RADII.lg, gap: SPACING.sm }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink, marginBottom: SPACING.sm }}>
              {copy.title}
            </Text>
            <Button label={copy.takePhoto} variant="secondary" size="md" fullWidth onPress={() => { onClose(); onTakePhoto?.(); }} />
            <Button label={copy.chooseLibrary} variant="secondary" size="md" fullWidth onPress={() => { onClose(); onChooseLibrary?.(); }} />
            <Button label={copy.removePhoto} variant="ghost" size="md" fullWidth onPress={() => { onClose(); onRemove?.(); }} />
            <Button label={copy.cancel} variant="ghost" size="md" fullWidth onPress={onClose} />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
