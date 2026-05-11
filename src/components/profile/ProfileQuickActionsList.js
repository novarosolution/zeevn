import React from "react";
import { View } from "react-native";
import InteractiveListRow from "../ui/InteractiveListRow";

/**
 * Quick-actions list with dividers — keeps ProfileScreen section markup minimal.
 */
export default function ProfileQuickActionsList({ profileStyles, items }) {
  return (
    <View style={profileStyles.accountOptionsList}>
      {items.map((item, idx) => (
        <View key={item.key}>
          <InteractiveListRow
            iconName={item.iconName}
            title={item.title}
            subtitle={item.hint}
            onPress={item.onPress}
            tone={item.tone}
            rightSlot={item.rightSlot}
          />
          {idx < items.length - 1 ? <View style={profileStyles.accountOptionDivider} /> : null}
        </View>
      ))}
    </View>
  );
}
