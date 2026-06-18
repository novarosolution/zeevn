import React, { useEffect, useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import AuthGateShell from "../components/AuthGateShell";
import KankregSiteHeader from "../components/kankreg/KankregSiteHeader";
import PageTransition from "../components/motion/PageTransition";
import * as CoreScreens from "./screenRegistryCore";
import { FindLocationScreen } from "./screenRegistryCustomer";
import * as LazyScreens from "./lazyScreens";
import { useAuth } from "../context/AuthContext";
import { DeliveryLocationProvider } from "../context/DeliveryLocationContext";

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

function withRoleGuard(Component, roleCheck) {
  return withPageTransition(function RoleGuardedScreen(props) {
    const { isAuthenticated, isAuthLoading, user } = useAuth();
    useEffect(() => {
      if (isAuthLoading) return;
      if (!isAuthenticated) return;
      if (!roleCheck(user)) {
        props.navigation.replace("Home");
      }
    }, [isAuthLoading, isAuthenticated, user, props.navigation]);
    if (isAuthLoading) {
      return <AuthGateShell navigation={props.navigation} />;
    }
    if (!isAuthenticated) {
      return <AuthGateShell signedOut navigation={props.navigation} />;
    }
    if (!roleCheck(user)) {
      return <AuthGateShell navigation={props.navigation} />;
    }
    return <Component {...props} />;
  });
}

const WrappedLogin = withPageTransition(CoreScreens.LoginScreen);
const WrappedRegister = withPageTransition(CoreScreens.RegisterScreen);
const WrappedFindLocation = withPageTransition(FindLocationScreen);
const WrappedHome = withPageTransition(CoreScreens.KankregHomeScreen);
const WrappedShop = withPageTransition(LazyScreens.ShopScreen);
const WrappedProduct = withPageTransition(LazyScreens.ProductScreen);
const WrappedAbout = withPageTransition(LazyScreens.AboutScreen);
const WrappedLegal = withPageTransition(LazyScreens.LegalDocumentScreen);

const ProtectedCart = withAuthGuard(LazyScreens.CartScreen);
const ProtectedCheckout = withAuthGuard(LazyScreens.CheckoutScreen);
const ProtectedProfile = withAuthGuard(LazyScreens.ProfileScreen);
const ProtectedEditProfile = withAuthGuard(LazyScreens.EditProfileScreen);
const ProtectedMyOrders = withAuthGuard(LazyScreens.MyOrdersScreen);
const ProtectedOrderConfirmed = withAuthGuard(LazyScreens.OrderConfirmedScreen);
const ProtectedNotifications = withAuthGuard(LazyScreens.NotificationsScreen);
const ProtectedSettings = withAuthGuard(LazyScreens.SettingsScreen);
const ProtectedRedeemRewards = withAuthGuard(LazyScreens.RedeemRewardsScreen);
const ProtectedManageAddress = withAuthGuard(LazyScreens.ManageAddressScreen);
const ProtectedSupport = withAuthGuard(LazyScreens.SupportScreen);
/** Auth only — role is checked inside the screen after a fresh profile fetch (avoids stale cache + wrong redirect). */
const ProtectedDeliveryDashboard = withAuthGuard(LazyScreens.DeliveryDashboardScreen);
const ProtectedAdminDashboard = withRoleGuard(LazyScreens.AdminDashboardScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminProducts = withRoleGuard(LazyScreens.AdminProductsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminInventory = withRoleGuard(LazyScreens.AdminInventoryScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminAddProduct = withRoleGuard(LazyScreens.AdminAddProductScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminOrders = withRoleGuard(LazyScreens.AdminOrdersScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminOrderDetail = withRoleGuard(LazyScreens.AdminOrderDetailScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminUsers = withRoleGuard(LazyScreens.AdminUsersScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminNotifications = withRoleGuard(LazyScreens.AdminNotificationsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminAnalytics = withRoleGuard(LazyScreens.AdminAnalyticsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminCoupons = withRoleGuard(LazyScreens.AdminCouponsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminRewards = withRoleGuard(LazyScreens.AdminRewardsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminSupport = withRoleGuard(LazyScreens.AdminSupportScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminHomeView = withRoleGuard(LazyScreens.AdminHomeViewScreen, (user) => Boolean(user?.isAdmin));

export default function AppNavigator({ navigationRef, navReady = false }) {
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: "transparent" },
      animation: Platform.OS === "web" ? "none" : "fade",
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
    }),
    []
  );

  return (
    <View style={styles.navRoot}>
      <KankregSiteHeader navigationRef={navigationRef} navReady={navReady} />
      <View style={styles.stackFill}>
    <DeliveryLocationProvider>
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={screenOptions}
    >
      <Stack.Group screenOptions={{ presentation: "card" }}>
        <Stack.Screen name="Login" component={WrappedLogin} />
        <Stack.Screen name="Register" component={WrappedRegister} />
      </Stack.Group>

      <Stack.Group>
        {Platform.OS !== "web" && (
          <Stack.Screen
            name="FindLocation"
            component={WrappedFindLocation}
            options={{ animation: "fade", gestureEnabled: false }}
          />
        )}
        <Stack.Screen name="Home" component={WrappedHome} />
        <Stack.Screen name="Shop" component={WrappedShop} />
        <Stack.Screen name="About" component={WrappedAbout} />
        <Stack.Screen name="Privacy" component={WrappedLegal} />
        <Stack.Screen name="Terms" component={WrappedLegal} />
        <Stack.Screen
          name="Product"
          component={WrappedProduct}
          options={Platform.OS === "web" ? undefined : { animation: "fade_from_bottom" }}
        />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen
          name="Cart"
          component={ProtectedCart}
          options={Platform.OS === "web" ? undefined : { animation: "fade_from_bottom" }}
        />
        <Stack.Screen
          name="Checkout"
          component={ProtectedCheckout}
          options={Platform.OS === "web" ? undefined : { animation: "fade_from_bottom" }}
        />
        <Stack.Screen name="Profile" component={ProtectedProfile} />
        <Stack.Screen name="EditProfile" component={ProtectedEditProfile} />
        <Stack.Screen name="MyOrders" component={ProtectedMyOrders} />
        <Stack.Screen
          name="OrderConfirmed"
          component={ProtectedOrderConfirmed}
          options={
            Platform.OS === "web"
              ? undefined
              : { animation: "fade_from_bottom", gestureEnabled: false }
          }
        />
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
        <Stack.Screen name="AdminProducts" component={ProtectedAdminProducts} />
        <Stack.Screen name="AdminInventory" component={ProtectedAdminInventory} />
        <Stack.Screen name="AdminAddProduct" component={ProtectedAdminAddProduct} />
        <Stack.Screen name="AdminOrders" component={ProtectedAdminOrders} />
        <Stack.Screen name="AdminOrderDetail" component={ProtectedAdminOrderDetail} />
        <Stack.Screen name="AdminUsers" component={ProtectedAdminUsers} />
        <Stack.Screen name="AdminNotifications" component={ProtectedAdminNotifications} />
        <Stack.Screen name="AdminAnalytics" component={ProtectedAdminAnalytics} />
        <Stack.Screen name="AdminCoupons" component={ProtectedAdminCoupons} />
        <Stack.Screen name="AdminRewards" component={ProtectedAdminRewards} />
        <Stack.Screen name="AdminSupport" component={ProtectedAdminSupport} />
        <Stack.Screen name="AdminHomeView" component={ProtectedAdminHomeView} />
      </Stack.Group>
    </Stack.Navigator>
    </DeliveryLocationProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navRoot: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: {
        minHeight: "100dvh",
        height: "100%",
        maxWidth: "100%",
        overflowX: "clip",
      },
      default: {},
    }),
  },
  stackFill: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    minHeight: 0,
    ...Platform.select({
      web: { overflowX: "clip" },
      default: {},
    }),
  },
});
