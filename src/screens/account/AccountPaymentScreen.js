import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AccountLayout from "../../components/account/AccountLayout";
import AccountGrid from "../../components/account/shared/AccountGrid";
import DashedAddCard from "../../components/account/shared/DashedAddCard";
import PaymentCardTile from "../../components/account/payment/PaymentCardTile";
import UpiRow from "../../components/account/payment/UpiRow";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import SectionHeader from "../../components/ui/SectionHeader";
import { PAYMENT_SCREEN } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";
import { openPaymentGatewayHostedPage } from "../../utils/openPaymentGateway";
import {
  loadSavedCards,
  loadSavedUpis,
  saveSavedCards,
  saveSavedUpis,
} from "../../utils/savedPaymentMethods";

const copy = PAYMENT_SCREEN;

export default function AccountPaymentScreen({ navigation }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const [cards, setCards] = useState([]);
  const [upis, setUpis] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, u] = await Promise.all([loadSavedCards(), loadSavedUpis()]);
      setCards(c);
      setUpis(u);
    } catch {
      setCards([]);
      setUpis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const persistCards = async (next) => {
    const saved = await saveSavedCards(next);
    setCards(saved);
  };

  const persistUpis = async (next) => {
    const saved = await saveSavedUpis(next);
    setUpis(saved);
  };

  const handleAddMethod = () => {
    // PCI: never collect card numbers in-app — gateway hosted page only.
    void openPaymentGatewayHostedPage();
  };

  const handleSetDefaultCard = async (id) => {
    const next = cards.map((c) => ({ ...c, isDefault: c.id === id }));
    await persistCards(next);
  };

  const removeCard = (id) => {
    Alert.alert(copy.deleteCard.title, copy.deleteCard.body, [
      { text: copy.deleteCard.cancel, style: "cancel" },
      {
        text: copy.deleteCard.confirm,
        style: "destructive",
        onPress: async () => {
          let next = cards.filter((c) => c.id !== id);
          if (next.length && !next.some((c) => c.isDefault)) {
            next = next.map((c, i) => ({ ...c, isDefault: i === 0 }));
          }
          await persistCards(next);
        },
      },
    ]);
  };

  const removeUpi = (id) => {
    Alert.alert(copy.deleteUpi.title, copy.deleteUpi.body, [
      { text: copy.deleteUpi.cancel, style: "cancel" },
      {
        text: copy.deleteUpi.confirm,
        style: "destructive",
        onPress: async () => {
          await persistUpis(upis.filter((u) => u.id !== id));
        },
      },
    ]);
  };

  const hasMethods = cards.length > 0 || upis.length > 0;

  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.Payment}
      activeSection="payment"
      pageTitle={copy.pageTitle}
      pageSubtitle={copy.pageSubtitle}
    >
      <Card padding="md">
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACING.md }}>
          <Ionicons name="shield-checkmark-outline" size={22} color={semanticPalette.accent} style={{ marginTop: 2 }} />
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: TYPE.small.fontSize,
              lineHeight: TYPE.small.lineHeight * 1.45,
              color: semanticPalette.inkSoft,
            }}
          >
            {copy.securityBanner}
          </Text>
        </View>
      </Card>

      {!loading && !hasMethods ? (
        <EmptyState
          iconName="card-outline"
          title={copy.empty.title}
          description={copy.empty.description}
          ctaLabel={copy.empty.cta}
          onCtaPress={handleAddMethod}
          style={{ marginTop: SPACING.lg }}
        />
      ) : null}

      {cards.length > 0 ? (
        <View style={{ marginTop: SPACING.lg }}>
          <SectionHeader overline={copy.cardsSection.overline} title={copy.cardsSection.title} showActionChevron={false} />
          <AccountGrid gap={SPACING.md}>
            {cards.map((card) => (
              <PaymentCardTile
                key={card.id}
                card={card}
                onDelete={() => removeCard(card.id)}
                onSetDefault={() => handleSetDefaultCard(card.id)}
              />
            ))}
          </AccountGrid>
        </View>
      ) : null}

      {upis.length > 0 ? (
        <View style={{ marginTop: SPACING.lg }}>
          <SectionHeader overline={copy.upiSection.overline} title={copy.upiSection.title} showActionChevron={false} />
          <View style={{ gap: SPACING.sm }}>
            {upis.map((upi) => (
              <UpiRow key={upi.id} upi={upi} onDelete={() => removeUpi(upi.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: SPACING.lg }}>
        <DashedAddCard
          label={copy.addCardLabel}
          onPress={handleAddMethod}
          accessibilityLabel={copy.addCardA11y}
        />
        <Text
          style={{
            marginTop: SPACING.sm,
            fontFamily: fonts.regular,
            fontSize: TYPE.caption.fontSize,
            color: semanticPalette.inkMuted,
            textAlign: "center",
          }}
        >
          {copy.addCardHint}
        </Text>
      </View>
    </AccountLayout>
  );
}
