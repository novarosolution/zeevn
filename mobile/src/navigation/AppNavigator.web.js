import React from "react";
import { StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthGateShell from "../components/AuthGateShell";
import KankregSiteHeader from "../components/kankreg/KankregSiteHeader";
import PageTransition from "../components/motion/PageTransition";
import * as CoreScreens from "./screenRegistryCore";
import * as LazyScreens from "./lazyScreens";
import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

function withPageTransition(Component) {
  return function PageTransitionedScreen(props) {
    return (
      <PageTransition>
        <Component {...props} />
      </PageTransition>
    );
  };
}

function withAuthGuard(Component) {
  return withPageTransition(function AuthGuardedScreen(props) {
    const { isAuthenticated, isAuthLoading } = useAuth();
    if (isAuthLoading) {
      return <AuthGateShell navigation={props.navigation} />;
    }
    if (!isAuthenticated) {
      return <AuthGateShell signedOut navigation={props.navigation} />;
    }
    return <Component {...props} />;
  });
}

const WrappedLogin = withPageTransition(CoreScreens.LoginScreen);
const WrappedRegister = withPageTransition(CoreScreens.RegisterScreen);
const WrappedHome = withPageTransition(CoreScreens.KankregHomeScreen);
const WrappedShop = withPageTransition(LazyScreens.ShopScreen);
const WrappedProduct = withPageTransition(LazyScreens.ProductScreen);
const WrappedAbout = withPageTransition(LazyScreens.AboutScreen);
const WrappedLegal = withPageTransition(LazyScreens.LegalDocumentScreen);

const ProtectedCart = withAuthGuard(LazyScreens.CartScreen);
const ProtectedCheckout = withAuthGuard(LazyScreens.CheckoutScreen);
const ProtectedYoupiCheckout = withAuthGuard(LazyScreens.YoupiCheckoutScreen);
const ProtectedProfile = withAuthGuard(LazyScreens.ProfileScreen);
const ProtectedEditProfile = withAuthGuard(LazyScreens.EditProfileScreen);
const ProtectedMyOrders = withAuthGuard(LazyScreens.MyOrdersScreen);
const ProtectedOrderConfirmed = withAuthGuard(LazyScreens.OrderConfirmedScreen);
const ProtectedNotifications = withAuthGuard(LazyScreens.NotificationsScreen);
const ProtectedSettings = withAuthGuard(LazyScreens.SettingsScreen);
const ProtectedRedeemRewards = withAuthGuard(LazyScreens.RedeemRewardsScreen);
const ProtectedManageAddress = withAuthGuard(LazyScreens.ManageAddressScreen);
const ProtectedSupport = withAuthGuard(LazyScreens.SupportScreen);
const ProtectedDeliveryDashboard = withAuthGuard(LazyScreens.DeliveryDashboardScreen);
const ProtectedAdminDashboard = withAuthGuard(LazyScreens.AdminDashboardScreen);
const ProtectedAdminOrders = withAuthGuard(LazyScreens.AdminOrdersScreen);
const ProtectedAdminOrderDetail = withAuthGuard(LazyScreens.AdminOrderDetailScreen);
const ProtectedAdminDelivery = withAuthGuard(LazyScreens.AdminDeliveryScreen);
const ProtectedAdminProducts = withAuthGuard(LazyScreens.AdminProductsScreen);
const ProtectedAdminAddProduct = withAuthGuard(LazyScreens.AdminAddProductScreen);
const ProtectedAdminInventory = withAuthGuard(LazyScreens.AdminInventoryScreen);
const ProtectedAdminAnalytics = withAuthGuard(LazyScreens.AdminAnalyticsScreen);
const ProtectedAdminHomeView = withAuthGuard(LazyScreens.AdminHomeViewScreen);
const ProtectedAdminCoupons = withAuthGuard(LazyScreens.AdminCouponsScreen);
const ProtectedAdminRewards = withAuthGuard(LazyScreens.AdminRewardsScreen);
const ProtectedAdminNotifications = withAuthGuard(LazyScreens.AdminNotificationsScreen);
const ProtectedAdminUsers = withAuthGuard(LazyScreens.AdminUsersScreen);
const ProtectedAdminSupport = withAuthGuard(LazyScreens.AdminSupportScreen);

export default function AppNavigator({ navigationRef, navReady = false }) {
  const screenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: "transparent" },
    animation: "none",
    gestureEnabled: true,
    fullScreenGestureEnabled: true,
  };

  return (
    <View style={styles.navRoot}>
      <KankregSiteHeader navigationRef={navigationRef} navReady={navReady} />
      <View style={styles.stackFill}>
        <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
          <Stack.Group screenOptions={{ presentation: "card" }}>
            <Stack.Screen name="Login" component={WrappedLogin} />
            <Stack.Screen name="Register" component={WrappedRegister} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="Home" component={WrappedHome} />
            <Stack.Screen name="Shop" component={WrappedShop} />
            <Stack.Screen name="About" component={WrappedAbout} />
            <Stack.Screen name="Privacy" component={WrappedLegal} />
            <Stack.Screen name="Terms" component={WrappedLegal} />
            <Stack.Screen name="Product" component={WrappedProduct} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="Cart" component={ProtectedCart} />
            <Stack.Screen name="Checkout" component={ProtectedCheckout} />
            <Stack.Screen name="YoupiCheckout" component={ProtectedYoupiCheckout} />
            <Stack.Screen name="Profile" component={ProtectedProfile} />
            <Stack.Screen name="EditProfile" component={ProtectedEditProfile} />
            <Stack.Screen name="MyOrders" component={ProtectedMyOrders} />
            <Stack.Screen name="OrderConfirmed" component={ProtectedOrderConfirmed} />
            <Stack.Screen name="Notifications" component={ProtectedNotifications} />
            <Stack.Screen name="Settings" component={ProtectedSettings} />
            <Stack.Screen name="RedeemRewards" component={ProtectedRedeemRewards} />
            <Stack.Screen name="ManageAddress" component={ProtectedManageAddress} />
            <Stack.Screen name="Support" component={ProtectedSupport} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="DeliveryDashboard" component={ProtectedDeliveryDashboard} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="AdminDashboard" component={ProtectedAdminDashboard} />
            <Stack.Screen name="AdminOrders" component={ProtectedAdminOrders} />
            <Stack.Screen name="AdminOrderDetail" component={ProtectedAdminOrderDetail} />
            <Stack.Screen name="AdminDelivery" component={ProtectedAdminDelivery} />
            <Stack.Screen name="AdminProducts" component={ProtectedAdminProducts} />
            <Stack.Screen name="AdminAddProduct" component={ProtectedAdminAddProduct} />
            <Stack.Screen name="AdminInventory" component={ProtectedAdminInventory} />
            <Stack.Screen name="AdminAnalytics" component={ProtectedAdminAnalytics} />
            <Stack.Screen name="AdminHomeView" component={ProtectedAdminHomeView} />
            <Stack.Screen name="AdminCoupons" component={ProtectedAdminCoupons} />
            <Stack.Screen name="AdminRewards" component={ProtectedAdminRewards} />
            <Stack.Screen name="AdminNotifications" component={ProtectedAdminNotifications} />
            <Stack.Screen name="AdminUsers" component={ProtectedAdminUsers} />
            <Stack.Screen name="AdminSupport" component={ProtectedAdminSupport} />
          </Stack.Group>
        </Stack.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navRoot: {
    flex: 1,
    width: "100%",
    minHeight: "100dvh",
    height: "100%",
    maxWidth: "100%",
    overflowX: "clip",
  },
  stackFill: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minHeight: 0,
    overflowX: "clip",
  },
});
