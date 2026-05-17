import React, { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../../ui/Card";
import HoverLiftCard from "../interactions/HoverLiftCard";
import Badge from "../../ui/Badge";
import IconGhostButton from "../shared/IconGhostButton";
import { PAYMENT_SCREEN, fillPlaceholders } from "../../../content/appContent";
import { useTheme } from "../../../context/ThemeContext";
import { fonts } from "../../../theme/tokens";
import { headingA11yProps } from "../../../utils/a11y";
const copy = PAYMENT_SCREEN;

function brandMark(brand) {
  const b = String(brand || "").toLowerCase();
  if (b.includes("visa")) return "VISA";
  if (b.includes("master")) return "MC";
  if (b.includes("rupay")) return "RuPay";
  if (b.includes("amex")) return "AMEX";
  return String(brand || "CARD").slice(0, 4).toUpperCase();
}

function PaymentCardTileBase({ card, onDelete, onSetDefault }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();

  return (
    <HoverLiftCard>
    <Card padding="lg">
      <View style={styles.top}>
        <View style={[styles.logoBox, { backgroundColor: semanticPalette.surfaceAlt }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.6, color: semanticPalette.ink }}>{brandMark(card.brand)}</Text>
        </View>
        <IconGhostButton name="trash-outline" onPress={onDelete} accessibilityLabel={copy.deleteCardA11y} />
      </View>

      <Text
        {...headingA11yProps(3)}
        style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink, marginTop: SPACING.md }}
      >
        {fillPlaceholders(copy.maskedCardTemplate, { last4: card.last4 })}
      </Text>

      {card.expiry ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft, marginTop: 4 }}>
          {fillPlaceholders(copy.expiryTemplate, { expiry: card.expiry })}
        </Text>
      ) : null}

      {card.cardholder ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft, marginTop: 4 }}>
          {card.cardholder}
        </Text>
      ) : null}

      <View style={[styles.footer, { marginTop: SPACING.md }]}>
        {card.isDefault ? (
          <Badge variant="brass" size="sm">
            {copy.defaultBadge}
          </Badge>
        ) : (
          <View />
        )}
        {!card.isDefault ? (
          <Pressable onPress={onSetDefault} hitSlop={8} accessibilityRole="button">
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
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
});

const PaymentCardTile = memo(PaymentCardTileBase);
export default PaymentCardTile;
