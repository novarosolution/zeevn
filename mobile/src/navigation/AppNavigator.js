import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import AuthGateShell from "../components/AuthGateShell";
import PageTransition from "../components/motion/PageTransition";
import * as CoreScreens from "./screenRegistryCore";
import * as LazyScreens from "./lazyScreens";
import { useAuth } from "../context/AuthContext";
import { DeliveryLocationProvider } from "../context/DeliveryLocationContext";

const Stack = createNativeStackNavigator();

/**
 * The four bottom-bar destinations are peers, not a hierarchy, and are switched dozens of times a session. A cross-fade
 * there shows two full screens ghosted over each other for ~300 ms, so they swap instantly; the nav capsule glides and the
 * arriving content rises, which is all the motion the moment needs.
 */
const TAB_ROOT_OPTIONS = { animation: "none" };

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
const WrappedFindLocation = withPageTransition(CoreScreens.FindLocationScreen);
const WrappedHome = withPageTransition(CoreScreens.KankregHomeScreen);
const WrappedShop = withPageTransition(LazyScreens.ShopScreen);
const WrappedWishlist = withPageTransition(LazyScreens.WishlistScreen);
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
/** Auth only — role is checked inside the screen after a fresh profile fetch (avoids stale cache + wrong redirect). */
const ProtectedDeliveryDashboard = withAuthGuard(LazyScreens.DeliveryDashboardScreen);

export default function AppNavigator() {
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
        <Stack.Screen name="Home" component={WrappedHome} options={TAB_ROOT_OPTIONS} />
        <Stack.Screen name="Shop" component={WrappedShop} options={TAB_ROOT_OPTIONS} />
        <Stack.Screen name="Wishlist" component={WrappedWishlist} />
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
        <Stack.Screen
          name="YoupiCheckout"
          component={ProtectedYoupiCheckout}
          options={Platform.OS === "web" ? undefined : { animation: "fade_from_bottom", gestureEnabled: false }}
        />
        <Stack.Screen name="Profile" component={ProtectedProfile} options={TAB_ROOT_OPTIONS} />
        <Stack.Screen name="EditProfile" component={ProtectedEditProfile} />
        <Stack.Screen name="MyOrders" component={ProtectedMyOrders} options={TAB_ROOT_OPTIONS} />
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
