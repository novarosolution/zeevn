import React from "react";
import AccountLayout from "../../components/account/AccountLayout";
import AccountOverview from "../../components/account/AccountOverview";
import { ACCOUNT_OVERVIEW_SCREEN } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";

export default function AccountOverviewScreen({ navigation }) {
  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.Overview}
      activeSection="overview"
      hidePageHeader
    >
      <AccountOverview navigation={navigation} />
    </AccountLayout>
  );
}
