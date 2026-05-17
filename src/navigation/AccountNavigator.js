import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccountOverviewScreen from "../screens/account/AccountOverviewScreen";
import AccountOrdersScreen from "../screens/account/AccountOrdersScreen";
import AccountOrderDetailScreen from "../screens/account/AccountOrderDetailScreen";
import AccountWishlistScreen from "../screens/account/AccountWishlistScreen";
import AccountAddressesScreen from "../screens/account/AccountAddressesScreen";
import AccountPaymentScreen from "../screens/account/AccountPaymentScreen";
import AccountProfileScreen from "../screens/account/AccountProfileScreen";
import AccountNotificationPrefsScreen from "../screens/account/AccountNotificationPrefsScreen";
import AccountActivityScreen from "../screens/account/AccountActivityScreen";
import { ACCOUNT_NESTED } from "./accountRoutes";

const Stack = createNativeStackNavigator();

export default function AccountNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
      initialRouteName={ACCOUNT_NESTED.Overview}
    >
      <Stack.Screen name={ACCOUNT_NESTED.Overview} component={AccountOverviewScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.Orders} component={AccountOrdersScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.OrderDetail} component={AccountOrderDetailScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.Wishlist} component={AccountWishlistScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.Addresses} component={AccountAddressesScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.Payment} component={AccountPaymentScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.AccountProfile} component={AccountProfileScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.NotificationPrefs} component={AccountNotificationPrefsScreen} />
      <Stack.Screen name={ACCOUNT_NESTED.AccountActivity} component={AccountActivityScreen} />
    </Stack.Navigator>
  );
}
