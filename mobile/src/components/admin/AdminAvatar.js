import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { initialsOf } from "../../utils/adminFormat";

const AVATAR_TONES = ["olive", "blue", "teal", "purple", "gold", "red"];

function toneFor(name) {
  let hash = 0;
  for (const ch of String(name || "")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** Photo when `uri` loads; otherwise initials in a tinted circle. `online` true/false adds a presence dot. */
export default function AdminAvatar({ name, uri, size = 32, online, style }) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const t = getAdminTone(toneFor(name), isDark);
  const dot = Math.max(8, Math.round(size * 0.3));
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = Boolean(uri) && !photoFailed;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg, borderColor: t.border, overflow: "hidden" }]}>
        {photo ? (
          <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setPhotoFailed(true)} />
        ) : (
          <Text style={[styles.text, { fontSize: Math.round(size * 0.38), color: t.fg }]}>{initialsOf(name)}</Text>
        )}
      </View>
      {typeof online === "boolean" ? (
        <View
          style={[
            styles.dot,
            { width: dot, height: dot, borderRadius: dot / 2, borderColor: chrome.card, backgroundColor: online ? "#2FA36B" : "#A8A29E" },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  text: { fontFamily: fonts.bold, letterSpacing: 0.2 },
  dot: { position: "absolute", right: -1, bottom: -1, borderWidth: 2 },
});
