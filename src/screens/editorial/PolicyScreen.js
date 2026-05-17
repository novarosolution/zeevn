import React from "react";
import { View } from "react-native";
import Screen from "../../components/ui/Screen";
import AppFooter from "../../components/AppFooter";
import PolicyDocumentLayout from "../../components/editorial/PolicyDocumentLayout";
import { EDITORIAL_POLICIES } from "../../content/editorialContent";
import useRouteMeta from "../../hooks/useRouteMeta";

const POLICY_ROUTE_MAP = {
  Privacy: "privacy",
  Terms: "terms",
  ShippingPolicy: "shipping",
  ReturnsPolicy: "returns",
};

export default function PolicyScreen({ navigation, route }) {
  const screenName = route?.name;
  const policyKey = POLICY_ROUTE_MAP[screenName] || route?.params?.policyKey || "privacy";
  const doc = EDITORIAL_POLICIES[policyKey] || EDITORIAL_POLICIES.privacy;

  useRouteMeta(doc.metaRoute);

  return (
    <Screen
      navigation={navigation}
      title={doc.title}
      breadcrumbLabel={doc.title}
      contentContainerStyle={{ maxWidth: 1100, alignSelf: "center", width: "100%" }}
    >
      <PolicyDocumentLayout lastUpdated={doc.lastUpdated} toc={doc.toc} blocks={doc.blocks} />
      <View style={{ marginTop: 32 }}>
        <AppFooter webTight />
      </View>
    </Screen>
  );
}
