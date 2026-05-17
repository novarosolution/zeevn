import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../../ui/Card";
import HoverLiftCard from "../interactions/HoverLiftCard";
import Badge from "../../ui/Badge";
import IconGhostButton from "../shared/IconGhostButton";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";
import { formatAddressLines, formatPhoneLine, tagLabel } from "../../../utils/savedAddresses";
import { ADDRESSES_SCREEN } from "../../../content/appContent";
import { headingA11yProps } from "../../../utils/a11y";

const copy = ADDRESSES_SCREEN;

function AddressCardBase({ address, onEdit, onDelete, onSetDefault }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const lines = formatAddressLines(address);
  const phone = formatPhoneLine(address);
  const label = tagLabel(address);

  return (
    <HoverLiftCard>
    <Card padding="lg" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.tagPill}>
          <Text style={[styles.tagText, { color: semanticPalette.accent }]}>{label}</Text>
        </View>
        <View style={styles.iconRow}>
          <IconGhostButton name="create-outline" onPress={onEdit} accessibilityLabel={copy.editA11y} />
          <IconGhostButton name="trash-outline" onPress={onDelete} accessibilityLabel={copy.deleteA11y} />
        </View>
      </View>

      {address.fullName ? (
        <Text {...headingA11yProps(3)} style={[styles.name, { color: semanticPalette.ink, fontSize: TYPE.body.fontSize }]}>{address.fullName}</Text>
      ) : null}

      {lines.map((line) => (
        <Text
          key={line}
          style={{
            fontFamily: fonts.regular,
            fontSize: TYPE.body.fontSize,
            lineHeight: TYPE.body.lineHeight * 1.5,
            color: semanticPalette.inkSoft,
            marginTop: 4,
          }}
        >
          {line}
        </Text>
      ))}

      {phone ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: TYPE.body.fontSize,
            color: semanticPalette.inkSoft,
            marginTop: SPACING.sm,
          }}
        >
          {phone}
        </Text>
      ) : null}

      <View style={[styles.footer, { marginTop: SPACING.md }]}>
        {address.isDefault ? (
          <Badge variant="brass" size="sm">
            {copy.defaultBadge}
          </Badge>
        ) : (
          <View />
        )}
        {!address.isDefault ? (
          <Pressable
            onPress={onSetDefault}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={copy.setDefaultLink}
            style={({ pressed }) => [pressed ? { opacity: 0.8 } : null]}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.caption.fontSize,
                color: semanticPalette.inkSoft,
                ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
              }}
            >
              {copy.setDefaultLink}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>
    </Card>
    </HoverLiftCard>
  );
}

const styles = StyleSheet.create({
  card: { position: "relative" },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -4,
    marginRight: -4,
  },
  name: {
    fontFamily: fonts.semibold,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
});

const AddressCard = memo(AddressCardBase);
export default AddressCard;
