import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, WEB_NO_FOCUS_RING, useAdminChrome } from "../../theme/adminLayout";

/** Higher is a better match; 0 means no match. */
function score(entry, q) {
  if (!q) return 1;
  const label = entry.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.split(/\s+/).some((word) => word.startsWith(q))) return 60;
  if (label.includes(q)) return 40;
  if (`${entry.hint || ""} ${entry.group || ""}`.toLowerCase().includes(q)) return 20;
  return 0;
}

/**
 * Jump-to-anything overlay (Ctrl/⌘ K on web, the search button on the top bar everywhere).
 * `entries`: { key, label, hint, icon, group } — tools and quick actions. `onPick(entry)` does the navigation.
 */
export default function AdminCommandPalette({ visible, entries, onPick, onClose }) {
  const chrome = useAdminChrome();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .map((entry) => ({ entry, rank: score(entry, q) }))
      .filter((row) => row.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 9)
      .map((row) => row.entry);
  }, [entries, query]);

  useEffect(() => {
    if (visible) {
      setQuery("");
      setActive(0);
      const id = setTimeout(() => inputRef.current?.focus?.(), 60);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [visible]);

  useEffect(() => setActive(0), [query]);

  const pick = useCallback(
    (entry) => {
      if (!entry) return;
      onClose();
      onPick(entry);
    },
    [onClose, onPick]
  );

  const onKeyPress = (event) => {
    const key = event?.nativeEvent?.key;
    if (key === "ArrowDown") {
      event.preventDefault?.();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (key === "ArrowUp") {
      event.preventDefault?.();
      setActive((i) => Math.max(i - 1, 0));
    } else if (key === "Escape") {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close search" />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.inputRow}>
            <Ionicons name="search-outline" size={18} color={chrome.inkFaint} />
            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={setQuery}
              onKeyPress={onKeyPress}
              onSubmitEditing={() => pick(results[active])}
              placeholder="Jump to a tool or action…"
              placeholderTextColor={chrome.inkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              style={[styles.input, WEB_NO_FOCUS_RING]}
              accessibilityLabel="Search tools"
            />
            {Platform.OS === "web" ? (
              <View style={styles.kbd}>
                <Text style={styles.kbdText}>Esc</Text>
              </View>
            ) : null}
          </View>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {results.length === 0 ? (
              <Text style={styles.empty}>Nothing matches “{query.trim()}”.</Text>
            ) : (
              results.map((entry, index) => {
                const on = index === active;
                return (
                  <Pressable
                    key={entry.key}
                    onPress={() => pick(entry)}
                    onHoverIn={() => setActive(index)}
                    style={[styles.row, on && styles.rowOn]}
                    accessibilityRole="button"
                    accessibilityLabel={`${entry.label}. ${entry.hint || ""}`}
                  >
                    <View style={[styles.iconWell, on && styles.iconWellOn]}>
                      <Ionicons name={entry.icon || "ellipse-outline"} size={16} color={on ? chrome.linkOnText : chrome.inkSoft} />
                    </View>
                    <View style={styles.copy}>
                      <Text style={styles.label} numberOfLines={1}>
                        {entry.label}
                      </Text>
                      {entry.hint ? (
                        <Text style={styles.hint} numberOfLines={1}>
                          {entry.hint}
                        </Text>
                      ) : null}
                    </View>
                    {entry.group ? <Text style={styles.group}>{entry.group}</Text> : null}
                    {on ? <Ionicons name="return-down-back-outline" size={14} color={chrome.inkFaint} /> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: Platform.OS === "web" ? 96 : 72, paddingHorizontal: 16 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,24,16,0.45)" },
    card: {
      width: "100%",
      maxWidth: 560,
      maxHeight: "70%",
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      ...Platform.select({
        web: { boxShadow: "0 30px 80px -20px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.12)" },
        default: { elevation: 12 },
      }),
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      height: 54,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    input: { flex: 1, minWidth: 0, fontSize: 16, color: chrome.ink, fontFamily: ADMIN_FONT.regular, paddingVertical: 0 },
    kbd: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.paper,
    },
    kbdText: { fontSize: 10.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.medium },
    list: { padding: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 12,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    rowOn: { backgroundColor: chrome.linkOnBg },
    iconWell: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: chrome.paper },
    iconWellOn: { backgroundColor: chrome.chipOnBg },
    copy: { flex: 1, minWidth: 0 },
    label: { fontSize: 14, color: chrome.ink, fontFamily: ADMIN_FONT.semibold, fontWeight: "600" },
    hint: { marginTop: 1, fontSize: 12, color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular },
    group: { fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", color: chrome.inkFaint, fontFamily: ADMIN_FONT.medium },
    empty: { padding: 24, textAlign: "center", color: chrome.inkSoft, fontFamily: ADMIN_FONT.regular, fontSize: 13 },
  });
}
