import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { ADDRESSES_SCREEN } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { breakpoints, fonts } from "../../../theme/tokens";
import { lookupIndianPin } from "../../../utils/indianPinLookup";

const copy = ADDRESSES_SCREEN;

function emptyForm(seed = {}) {
  return {
    fullName: seed.fullName || "",
    phone: seed.phone || "",
    countryCode: copy.fields.countryCode,
    postalCode: seed.postalCode || "",
    city: seed.city || "",
    state: seed.state || "",
    country: seed.country || "India",
    line1: seed.line1 || "",
    line2: seed.line2 || "",
    landmark: seed.landmark || "",
    tag: seed.tag || "HOME",
    customTag: seed.customTag || "",
    makeDefault: seed.makeDefault !== false,
  };
}

function FormRow({ twoCol, children }) {
  if (!twoCol) return <View style={{ gap: 12 }}>{children}</View>;
  const pairs = [];
  const list = React.Children.toArray(children);
  for (let i = 0; i < list.length; i += 2) {
    pairs.push(list.slice(i, i + 2));
  }
  return (
    <View style={{ gap: 12 }}>
      {pairs.map((pair, idx) => (
        <View key={`pair-${idx}`} style={{ flexDirection: "row", gap: 12 }}>
          {pair.map((child, j) => (
            <View key={j} style={{ flex: 1, minWidth: 0 }}>
              {child}
            </View>
          ))}
          {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

export default function AddressFormModal({ visible, mode, initial, profileSeed, saving, onClose, onSave }) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const { width } = useWindowDimensions();
  const twoCol = width >= breakpoints.md;
  const pinTimer = useRef(null);

  const [form, setForm] = useState(() => emptyForm());
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && initial) {
      setForm(
        emptyForm({
          ...initial,
          makeDefault: Boolean(initial.isDefault),
        })
      );
    } else {
      setForm(emptyForm({ makeDefault: true, ...profileSeed }));
    }
  }, [visible, mode, initial, profileSeed]);

  useEffect(() => {
    if (!visible) return undefined;
    const pin = form.postalCode.replace(/\D/g, "");
    if (pin.length !== 6) return undefined;
    if (pinTimer.current) clearTimeout(pinTimer.current);
    pinTimer.current = setTimeout(async () => {
      const hit = await lookupIndianPin(pin);
      if (hit?.city) setForm((f) => ({ ...f, city: f.city.trim() ? f.city : hit.city }));
      if (hit?.state) setForm((f) => ({ ...f, state: f.state.trim() ? f.state : hit.state }));
      if (hit?.country) setForm((f) => ({ ...f, country: f.country.trim() ? f.country : hit.country }));
    }, 450);
    return () => {
      if (pinTimer.current) clearTimeout(pinTimer.current);
    };
  }, [form.postalCode, visible]);

  const title = mode === "edit" ? copy.modalEditTitle : copy.modalAddTitle;
  const showCustomTag = form.tag === "OTHER";

  const tagChips = useMemo(
    () =>
      copy.tagOptions.map((opt) => {
        const active = form.tag === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => set("tag", opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                borderColor: active ? semanticPalette.accent : semanticPalette.line,
                backgroundColor: active ? semanticPalette.accentSoft : semanticPalette.surface,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.caption.fontSize,
                color: active ? semanticPalette.accent : semanticPalette.inkSoft,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      }),
    [form.tag, semanticPalette, TYPE.caption.fontSize]
  );

  const handleSave = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.line1.trim() || !form.city.trim() || !form.state.trim() || !form.postalCode.trim()) {
      return;
    }
    onSave?.({
      ...form,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      landmark: form.landmark.trim(),
      customTag: form.tag === "OTHER" ? form.customTag.trim() : "",
    });
  };

  const canSave =
    form.fullName.trim() &&
    form.phone.trim() &&
    form.line1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { backgroundColor: semanticPalette.surface, borderRadius: RADII.lg, maxHeight: "92%" }]}>
          <View style={[styles.header, { borderBottomColor: semanticPalette.lineSoft, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md }]}>
            <Text style={{ fontFamily: TYPE.serifFamily, ...TYPE.h3, color: semanticPalette.ink, flex: 1 }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={26} color={semanticPalette.inkMuted} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xl }}
            showsVerticalScrollIndicator={false}
          >
            <FormRow twoCol={twoCol}>
              <Input
                label={copy.fields.fullName.label}
                placeholder={copy.fields.fullName.placeholder}
                value={form.fullName}
                onChangeText={(t) => set("fullName", t)}
                autoComplete="name"
                required
              />
              <View>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                  <View
                    style={{
                      height: 40,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: semanticPalette.surfaceAlt,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: semanticPalette.line,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{copy.fields.countryCode}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label={copy.fields.phone.label}
                      placeholder={copy.fields.phone.placeholder}
                      value={form.phone}
                      onChangeText={(t) => set("phone", t.replace(/\D/g, "").slice(0, 10))}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      required
                    />
                  </View>
                </View>
              </View>
              <Input
                label={copy.fields.pincode.label}
                placeholder={copy.fields.pincode.placeholder}
                value={form.postalCode}
                onChangeText={(t) => set("postalCode", t.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                required
              />
              <Input label={copy.fields.city.label} placeholder={copy.fields.city.placeholder} value={form.city} onChangeText={(t) => set("city", t)} required />
              <Input label={copy.fields.state.label} placeholder={copy.fields.state.placeholder} value={form.state} onChangeText={(t) => set("state", t)} required />
              <Input
                label={copy.fields.line1.label}
                placeholder={copy.fields.line1.placeholder}
                value={form.line1}
                onChangeText={(t) => set("line1", t)}
                required
              />
              <Input
                label={copy.fields.line2.label}
                placeholder={copy.fields.line2.placeholder}
                value={form.line2}
                onChangeText={(t) => set("line2", t)}
              />
            </FormRow>

            <View style={{ marginTop: 12 }}>
              <Input
                label={copy.fields.landmark.label}
                placeholder={copy.fields.landmark.placeholder}
                helperText={copy.fields.landmark.helper}
                value={form.landmark}
                onChangeText={(t) => set("landmark", t)}
              />
            </View>

            <Text style={{ fontFamily: fonts.medium, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkSoft, marginTop: SPACING.md, marginBottom: 8 }}>
              {copy.fields.tag.label}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{tagChips}</View>

            {showCustomTag ? (
              <View style={{ marginTop: 12 }}>
                <Input
                  label={copy.fields.customTag.label}
                  placeholder={copy.fields.customTag.placeholder}
                  value={form.customTag}
                  onChangeText={(t) => set("customTag", t)}
                />
              </View>
            ) : null}

            <Pressable
              onPress={() => set("makeDefault", !form.makeDefault)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: form.makeDefault }}
              style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: SPACING.lg }, pressed ? { opacity: 0.9 } : null]}
            >
              <Ionicons
                name={form.makeDefault ? "checkbox" : "square-outline"}
                size={22}
                color={form.makeDefault ? semanticPalette.accent : semanticPalette.inkMuted}
              />
              <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.ink, flex: 1 }}>
                {copy.fields.makeDefault}
              </Text>
            </Pressable>
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              gap: SPACING.sm,
              padding: SPACING.lg,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: semanticPalette.lineSoft,
            }}
          >
            <Button label={copy.cancelCta} variant="ghost" size="md" style={{ flex: 1 }} onPress={onClose} disabled={saving} />
            <Button
              label={saving ? copy.savingCta : copy.saveCta}
              variant="primary"
              size="md"
              style={{ flex: 1 }}
              loading={saving}
              disabled={!canSave}
              onPress={handleSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(14,23,41,0.45)",
    justifyContent: "flex-end",
    ...Platform.select({
      web: { justifyContent: "center", alignItems: "center", padding: 24 },
      default: {},
    }),
  },
  sheet: {
    width: "100%",
    ...Platform.select({
      web: { maxWidth: 560 },
      default: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
  },
});
