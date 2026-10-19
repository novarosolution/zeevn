import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";
import StoreScreen from "./StoreScreen";
import { Card, Rise } from "./StoreKit";

/** Native legal reader (privacy, terms): title, last-updated pill, a summary card and numbered sections. */
export default function StoreLegal({ navigation, doc, icon = "shield-checkmark-outline" }) {
  const { c, type } = useStoreTheme();
  return (
    <StoreScreen title={doc.title} navigation={navigation}>
      <Rise index={0}>
        <View style={[styles.pill, { backgroundColor: c.brandSoft }]}>
          <Ionicons name={icon} size={15} color={c.brand} />
          <Text style={type.ui(12.5, "bold", c.brand)}>{doc.updated}</Text>
        </View>
      </Rise>

      <Rise index={1}>
        <Card tone="soft">
          <Text style={type.ui(16, "medium", c.inkSoft, { lineHeight: 25 })}>{doc.intro}</Text>
        </Card>
      </Rise>

      {doc.sections.map((section, index) => (
        <Rise key={section.title} index={index + 2} style={styles.section}>
          <View style={styles.head}>
            <View style={[styles.number, { backgroundColor: c.brand }]}>
              <Text style={type.ui(12.5, "extrabold", c.onBrand)}>{index + 1}</Text>
            </View>
            <Text style={[type.display(20, { semi: true, ls: -0.3, lh: 25 }), styles.title]}>{section.title}</Text>
          </View>
          <Text style={[type.ui(15, "medium", c.inkSoft, { lineHeight: 24 }), styles.body]}>{section.body}</Text>
        </Rise>
      ))}
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, height: 32, paddingHorizontal: 13, borderRadius: 16 },
  section: { gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  number: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { flex: 1 },
  body: { paddingLeft: 40 },
});
