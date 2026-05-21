import React, { useState } from "react";
import { Alert, Linking, Platform, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/ui/Screen";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import AppFooter from "../../components/AppFooter";
import ContactMap from "../../components/editorial/ContactMap";
import EditorialLink from "../../components/editorial/EditorialLink";
import WhatsAppFab from "../../components/editorial/WhatsAppFab";
import { CONTACT_PAGE } from "../../content/editorialContent";
import { useTheme } from "../../context/ThemeContext";
import useRouteMeta from "../../hooks/useRouteMeta";
import { fonts, icon } from "../../theme/tokens";

export default function ContactScreen({ navigation }) {
  useRouteMeta("contact");
  const { width } = useWindowDimensions();
  const { semanticPalette, TYPE, SPACING } = useTheme();
  const stacked = width < 900;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = () => {
    if (!String(email || "").trim() || !String(message || "").trim()) {
      Alert.alert("Missing details", "Please add your email and message.");
      return;
    }
    setSending(true);
    const mailUrl = `mailto:${CONTACT_PAGE.email}?subject=${encodeURIComponent(subject || "Zeevan enquiry")}&body=${encodeURIComponent(
      `Name: ${name}\n\n${message}`
    )}`;
    Linking.openURL(mailUrl)
      .catch(() => Alert.alert("Unable to open mail"))
      .finally(() => {
        setSending(false);
        Alert.alert(CONTACT_PAGE.form.successToast);
      });
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen navigation={navigation} breadcrumbLabel="Contact">
        <View style={{ flexDirection: stacked ? "column" : "row", gap: SPACING["2xl"], marginBottom: SPACING["2xl"] }}>
          <View style={{ flex: 1, gap: SPACING.md, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: TYPE.serifFamily,
                ...TYPE.h2,
                color: semanticPalette.ink,
                marginBottom: SPACING.sm,
              }}
            >
              {CONTACT_PAGE.headline}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: TYPE.body.fontSize,
                lineHeight: TYPE.body.lineHeight * 1.5,
                color: semanticPalette.inkSoft,
                marginBottom: SPACING.md,
              }}
            >
              {CONTACT_PAGE.subline}
            </Text>
            <Input label={CONTACT_PAGE.form.nameLabel} value={name} onChangeText={setName} autoCapitalize="words" />
            <Input
              label={CONTACT_PAGE.form.emailLabel}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input label={CONTACT_PAGE.form.subjectLabel} value={subject} onChangeText={setSubject} />
            <Input label={CONTACT_PAGE.form.messageLabel} value={message} onChangeText={setMessage} multiline />
            <Button
              label={CONTACT_PAGE.form.submitLabel}
              variant="primary"
              size="md"
              fullWidth
              loading={sending}
              onPress={submit}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: SPACING.lg }}>
            <Text style={{ fontFamily: TYPE.serifFamily, ...TYPE.h3, color: semanticPalette.ink }}>{CONTACT_PAGE.infoTitle}</Text>
            <InfoRow iconName="mail-outline" label={CONTACT_PAGE.emailLabel}>
              <EditorialLink href={`mailto:${CONTACT_PAGE.email}`}>{CONTACT_PAGE.email}</EditorialLink>
            </InfoRow>
            <InfoRow iconName="call-outline" label={CONTACT_PAGE.phoneLabel}>
              <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                {CONTACT_PAGE.phone}
              </Text>
            </InfoRow>
            <InfoRow iconName="time-outline" label={CONTACT_PAGE.hoursLabel}>
              <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                {CONTACT_PAGE.hoursValue}
              </Text>
            </InfoRow>
            <InfoRow iconName="location-outline" label={CONTACT_PAGE.addressLabel}>
              <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
                {CONTACT_PAGE.addressValue}
              </Text>
            </InfoRow>
            <ContactMap
              embedUrl={CONTACT_PAGE.mapEmbedUrl}
              mapsUrl={CONTACT_PAGE.mapsUrl}
              label={CONTACT_PAGE.mapOpenLabel}
            />
          </View>
        </View>
        <AppFooter webTight />
      </Screen>

      <WhatsAppFab
        url={CONTACT_PAGE.whatsappUrl}
        accessibilityLabel={CONTACT_PAGE.whatsappLabel}
        bottomOffset={Platform.OS === "web" ? 16 : 72}
      />
    </View>
  );
}

function InfoRow({ iconName, label, children }) {
  const { semanticPalette, TYPE, SPACING } = useTheme();
  return (
    <View style={{ gap: SPACING.xs }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.caption.fontSize, color: semanticPalette.inkMuted }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
        <Ionicons name={iconName} size={icon.md} color={semanticPalette.accent} />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}
