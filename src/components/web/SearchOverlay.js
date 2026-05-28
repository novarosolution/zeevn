import React, { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Input from "../ui/Input";
import { SearchSuggestionsPanel } from "./SearchSuggestionsPopover";
import { useTheme } from "../../context/ThemeContext";
import { SEARCH_OVERLAY_UI } from "../../content/appContent";
import { icon } from "../../theme/tokens";
import { WEB_Z_INDEX, webOverlayRootStyle } from "../../theme/web";
import useModalA11y from "../../hooks/useModalA11y";
import { APP_VIEWPORT_MIN_HEIGHT } from "../../utils/webViewport";

/**
 * Full-screen search overlay (compact web / mobile header).
 */
export default function SearchOverlay({
  visible,
  onClose,
  query,
  onChangeQuery,
  onSubmitQuery,
  onPickProduct,
  recentSearches,
  onAddRecent,
  placeholder,
}) {
  const { semanticPalette, SPACING } = useTheme();
  const [local, setLocal] = useState(query);
  const containerRef = useRef(null);

  useModalA11y({ visible, onClose, containerRef });

  useEffect(() => {
    setLocal(query);
  }, [query, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        ref={containerRef}
        style={[styles.root, { backgroundColor: semanticPalette.bg }, webOverlayRootStyle(WEB_Z_INDEX.overlayPanel)]}
      >
        <View style={[styles.header, { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, gap: SPACING.sm }]}>
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <Input
                value={local}
                onChangeText={(t) => {
                  setLocal(t);
                  onChangeQuery(t);
                }}
                placeholder={placeholder || SEARCH_OVERLAY_UI.placeholder}
                iconLeft="search-outline"
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => {
                  const t = String(local || "").trim();
                  if (t) onSubmitQuery(t);
                }}
                accessibilityLabel={SEARCH_OVERLAY_UI.searchA11y}
              />
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={SEARCH_OVERLAY_UI.closeA11y}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="close" size={icon.lg} color={semanticPalette.ink} />
            </Pressable>
          </View>
        </View>
        <SearchSuggestionsPanel
          recentSearches={recentSearches}
          onAddRecent={onAddRecent}
          query={local}
          onClose={onClose}
          onSubmitTerm={onSubmitQuery}
          onPickProduct={onPickProduct}
          listenWindowKeys
          fullBleed
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...Platform.select({
      web: { minHeight: APP_VIEWPORT_MIN_HEIGHT },
      default: {},
    }),
  },
  header: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  closeBtn: {
    marginTop: 4,
    padding: 8,
  },
});
