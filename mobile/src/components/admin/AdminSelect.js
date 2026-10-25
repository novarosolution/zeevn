import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ADMIN_FONT, WEB_NO_FOCUS_RING, useAdminChrome } from "../../theme/adminLayout";

const MENU_MAX_H = 320;

/**
 * Dropdown for filters and pickers. Options: `{ value, label, hint?, meta?, icon?, leading? }`, or `{ header: "Title" }`
 * for a group heading. Opens as a popover under the field on desktop and a bottom sheet on a phone-width window.
 * `clearLabel` adds a first row that sets the value to null ("All zones", "Unassigned"…).
 */
export default function AdminSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  label,
  icon,
  compact = false,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search…",
  clearLabel,
  emptyText = "Nothing matches",
  minMenuWidth = 220,
  align = "left",
  style,
  triggerStyle,
  valueLabel,
}) {
  const chrome = useAdminChrome();
  const { width: winW, height: winH } = useWindowDimensions();
  const asSheet = winW < 760;
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [query, setQuery] = useState("");
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const selected = useMemo(() => options.find((o) => !o.header && o.value === value) || null, [options, value]);

  const close = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => {
    if (disabled) return;
    setQuery("");
    const node = triggerRef.current;
    if (!asSheet && node && typeof node.getBoundingClientRect === "function") {
      // Web: the field is a DOM node, so measure it synchronously and open at once.
      const r = node.getBoundingClientRect();
      setAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
      setOpen(true);
    } else if (!asSheet && node && typeof node.measureInWindow === "function") {
      node.measureInWindow((x, y, w, h) => {
        setAnchor({ x, y, w, h });
        setOpen(true);
      });
    } else {
      setAnchor(null);
      setOpen(true);
    }
  }, [disabled, asSheet]);

  const pick = useCallback(
    (next) => {
      setOpen(false);
      if (next !== value) onChange?.(next);
    },
    [onChange, value]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.header || `${o.label} ${o.hint || ""}`.toLowerCase().includes(q));
  }, [options, query]);
  const hasRows = visible.some((o) => !o.header);

  let popoverStyle = null;
  if (open && !asSheet && anchor) {
    const width = Math.min(Math.max(anchor.w, minMenuWidth), winW - 16);
    let left = align === "right" ? anchor.x + anchor.w - width : anchor.x;
    left = Math.max(8, Math.min(left, winW - width - 8));
    const roomBelow = winH - (anchor.y + anchor.h);
    const flip = roomBelow < 260 && anchor.y > roomBelow;
    popoverStyle = flip
      ? { left, width, bottom: winH - anchor.y + 6, maxHeight: Math.min(MENU_MAX_H, anchor.y - 16) }
      : { left, width, top: anchor.y + anchor.h + 6, maxHeight: Math.min(MENU_MAX_H, roomBelow - 16) };
  }

  const shownLabel = valueLabel || selected?.label;

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: open, disabled }}
        style={({ hovered, pressed }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          hovered && !disabled && styles.triggerHover,
          open && styles.triggerOpen,
          pressed && styles.triggerPressed,
          disabled && styles.disabled,
          triggerStyle,
        ]}
      >
        {icon ? <Ionicons name={icon} size={compact ? 13 : 15} color={chrome.inkFaint} /> : null}
        {selected?.leading || null}
        <Text style={[styles.value, !shownLabel && styles.placeholder, compact && styles.valueCompact]} numberOfLines={1}>
          {shownLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={compact ? 12 : 14} color={chrome.inkFaint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={[styles.backdrop, asSheet && styles.backdropDim]} onPress={close} accessibilityLabel="Close menu">
          <Pressable
            onPress={() => {}}
            style={[styles.menu, asSheet ? [styles.sheet, { maxHeight: Math.round(winH * 0.72) }] : [styles.popover, popoverStyle]]}
          >
            {asSheet ? <View style={styles.grabber} /> : null}
            {searchable ? (
              <View style={styles.searchRow}>
                <Ionicons name="search" size={14} color={chrome.inkFaint} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={chrome.inkFaint}
                  autoFocus
                  style={[styles.searchInput, WEB_NO_FOCUS_RING]}
                />
              </View>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.list} contentContainerStyle={styles.listInner}>
              {clearLabel && !query ? (
                <OptionRow chrome={chrome} styles={styles} option={{ value: null, label: clearLabel }} active={value == null || value === ""} onPick={pick} muted />
              ) : null}
              {visible.map((option, index) =>
                option.header ? (
                  <Text key={`h-${index}`} style={styles.header}>
                    {option.header}
                  </Text>
                ) : (
                  <OptionRow key={`${String(option.value)}-${index}`} chrome={chrome} styles={styles} option={option} active={option.value === value} onPick={pick} />
                )
              )}
              {!hasRows ? <Text style={styles.empty}>{emptyText}</Text> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function OptionRow({ chrome, styles, option, active, onPick, muted }) {
  return (
    <Pressable
      onPress={option.disabled ? undefined : () => onPick(option.value)}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active, disabled: Boolean(option.disabled) }}
      style={({ hovered, pressed }) => [
        styles.option,
        hovered && styles.optionHover,
        pressed && styles.optionPressed,
        active && styles.optionActive,
        option.disabled && styles.optionDisabled,
      ]}
    >
      {option.leading || null}
      {option.icon ? <Ionicons name={option.icon} size={16} color={active ? chrome.goldDeep : chrome.inkSoft} /> : null}
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, active && styles.optionLabelActive, muted && styles.optionMuted]} numberOfLines={1}>
          {option.label}
        </Text>
        {option.hint ? (
          <Text style={styles.optionHint} numberOfLines={1}>
            {option.hint}
          </Text>
        ) : null}
      </View>
      {option.meta ? <Text style={styles.optionMeta}>{option.meta}</Text> : null}
      {active ? <Ionicons name="checkmark" size={16} color={chrome.goldDeep} /> : null}
    </Pressable>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: { minWidth: 0 },
    label: {
      fontSize: 11,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.semibold,
      marginBottom: 6,
    },
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 11,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      ...Platform.select({ web: { cursor: "pointer", transition: "border-color 120ms ease-out, background-color 120ms ease-out" }, default: {} }),
    },
    triggerCompact: { height: 34, paddingHorizontal: 10, borderRadius: 10, gap: 6 },
    triggerHover: { borderColor: chrome.inkFaint },
    triggerOpen: { borderColor: chrome.tabOnBg },
    triggerPressed: { backgroundColor: chrome.paper },
    disabled: { opacity: 0.5 },
    value: { flex: 1, minWidth: 0, fontSize: 13.5, color: chrome.ink, fontFamily: ADMIN_FONT.medium },
    valueCompact: { fontSize: 12.5 },
    placeholder: { color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
    backdrop: { flex: 1 },
    backdropDim: { backgroundColor: "rgba(20, 24, 16, 0.42)", justifyContent: "flex-end" },
    menu: {
      backgroundColor: chrome.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      overflow: "hidden",
    },
    popover: {
      position: "absolute",
      borderRadius: 14,
      ...Platform.select({ web: { boxShadow: "0 18px 44px -12px rgba(20,24,16,0.32), 0 2px 6px rgba(20,24,16,0.08)" }, default: {} }),
    },
    sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 18 },
    grabber: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: chrome.line, marginTop: 8, marginBottom: 6 },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      height: 42,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: chrome.line,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: chrome.ink,
      fontFamily: ADMIN_FONT.regular,
      ...Platform.select({ web: { outlineStyle: "none" }, default: {} }),
    },
    list: { flexGrow: 0 },
    listInner: { padding: 6 },
    header: {
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: ADMIN_FONT.semibold,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 4,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 9,
      borderRadius: 9,
      ...Platform.select({ web: { cursor: "pointer", transition: "background-color 90ms ease-out" }, default: {} }),
    },
    optionHover: { backgroundColor: chrome.rowHover },
    optionPressed: { backgroundColor: chrome.paper },
    optionActive: { backgroundColor: chrome.chipOnBg },
    optionDisabled: { opacity: 0.45 },
    optionText: { flex: 1, minWidth: 0 },
    optionLabel: { fontSize: 13.5, color: chrome.ink, fontFamily: ADMIN_FONT.medium },
    optionLabelActive: { fontFamily: ADMIN_FONT.semibold },
    optionMuted: { color: chrome.inkSoft },
    optionHint: { marginTop: 1, fontSize: 11.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
    optionMeta: { fontSize: 11.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.medium },
    empty: { padding: 16, textAlign: "center", fontSize: 12.5, color: chrome.inkFaint, fontFamily: ADMIN_FONT.regular },
  });
}
