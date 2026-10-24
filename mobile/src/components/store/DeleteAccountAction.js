import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { STORE_PROFILE } from "../../content/storefrontContent";
import { useAuth } from "../../context/AuthContext";
import { requestAccountDeletion } from "../../services/userService";
import { fonts } from "../../theme/tokens";

/**
 * Customer/rider “Delete my account” on profile. Admins cannot file for themselves.
 */
export default function DeleteAccountAction({ variant = "store", tone }) {
  const { user, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.isAdmin) return null;

  const deletion = user.deletion || null;
  const pending = deletion?.status === "pending";
  const rejectedNote = deletion?.status === "rejected" ? String(deletion.adminNote || "").trim() : "";
  const ink = tone?.ink || "#1c1917";
  const mute = tone?.mute || "#78716c";
  const danger = tone?.danger || "#a8442f";
  const line = tone?.line || "rgba(168,68,47,0.35)";
  const paper = tone?.paper || "#fff";

  const submit = async () => {
    if (busy || pending) return;
    setBusy(true);
    setError("");
    try {
      await requestAccountDeletion(reason.trim());
      setOpen(false);
      setReason("");
      await refreshProfile({ force: true });
    } catch (err) {
      setError(err?.message || "Couldn't send this request.");
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <View style={styles.block}>
        <View style={[styles.btn, variant === "menu" ? styles.menuBtn : null, { borderColor: line, backgroundColor: paper, opacity: 0.72 }]}>
          <Ionicons name="hourglass-outline" size={18} color={danger} />
          <Text style={[styles.label, { color: danger }]}>{STORE_PROFILE.deletionRequested}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      {rejectedNote ? (
        <Text style={[styles.note, { color: mute }]}>
          {STORE_PROFILE.rejectedNote}: {rejectedNote}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen((on) => !on)}
        style={({ pressed }) => [
          styles.btn,
          variant === "menu" ? styles.menuBtn : null,
          { borderColor: line, backgroundColor: paper },
          pressed && { opacity: 0.88 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={STORE_PROFILE.deleteAccount}
      >
        <Ionicons name="person-remove-outline" size={18} color={danger} />
        <Text style={[styles.label, { color: danger }]}>{STORE_PROFILE.deleteAccount}</Text>
      </Pressable>
      {open ? (
        <View style={styles.form}>
          <Text style={[styles.hint, { color: mute }]}>{STORE_PROFILE.deleteHint}</Text>
          <TextInput
            value={reason}
            onChangeText={(value) => setReason(value.slice(0, 300))}
            placeholder={STORE_PROFILE.deleteReason}
            placeholderTextColor={mute}
            maxLength={300}
            multiline
            style={[styles.input, { color: ink, borderColor: line, backgroundColor: paper }]}
          />
          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.submit, pressed && { opacity: 0.88 }, busy && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={STORE_PROFILE.deleteSubmit}
          >
            <Text style={styles.submitText}>{busy ? "Sending…" : STORE_PROFILE.deleteSubmit}</Text>
          </Pressable>
        </View>
      ) : null}
      {error ? <Text style={[styles.err, { color: danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  menuBtn: {
    justifyContent: "flex-start",
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 12,
  },
  label: { fontFamily: fonts.semibold, fontSize: 15 },
  form: { gap: 8 },
  hint: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18 },
  input: {
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlignVertical: "top",
    ...Platform.select({ web: { outlineStyle: "none" }, default: {} }),
  },
  submit: {
    alignSelf: "flex-start",
    backgroundColor: "#1c1917",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submitText: { color: "#fffaf3", fontFamily: fonts.semibold, fontSize: 13.5 },
  note: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18 },
  err: { fontFamily: fonts.regular, fontSize: 12.5 },
});
