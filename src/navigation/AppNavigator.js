import React, { useEffect, useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import AppStartupScreen from "../components/AppStartupScreen";
import AuthGateShell from "../components/AuthGateShell";
import WebAppHeader from "../components/WebAppHeader";
import PageTransition from "../components/motion/PageTransition";
import HomeScreen from "../screens/HomeScreen";
import {
  LazyAboutScreen,
  LazyAccountNavigator,
  LazyBlogIndexScreen,
  LazyBlogPostScreen,
  LazyCartScreen,
  LazyCategoriesScreen,
  LazyContactScreen,
  LazyDevDebugScreen,
  LazyFaqScreen,
  LazyForgotPasswordScreen,
  LazyLoginScreen,
  LazyNotFoundScreen,
  LazyNotificationsScreen,
  LazyPolicyScreen,
  LazyProductScreen,
  LazyRedeemRewardsScreen,
  LazyRegisterScreen,
  LazyResetPasswordScreen,
  LazyReviewsScreen,
  LazySearchScreen,
  LazySupportScreen,
  LazyTrustInfoScreen,
  LazyVerifyEmailScreen,
} from "./lazyCustomerScreens";
import { ACCOUNT_NESTED } from "./accountRoutes";
import {
  LazyAdminAddProductScreen,
  LazyAdminAnalyticsScreen,
  LazyAdminCouponsScreen,
  LazyAdminDashboardScreen,
  LazyAdminHomeViewScreen,
  LazyAdminInventoryScreen,
  LazyAdminNotificationsScreen,
  LazyAdminOrdersScreen,
  LazyAdminProductsScreen,
  LazyAdminRewardsScreen,
  LazyAdminSupportScreen,
  LazyAdminUsersScreen,
  LazyDeliveryDashboardScreen,
} from "./lazyOpsScreens";
import { useAuth } from "../context/AuthContext";
import SessionExpiryRedirect from "./SessionExpiryRedirect";
import { withRouteErrorBoundary } from "../components/errors/RouteErrorBoundary";
import { APP_VIEWPORT_MIN_HEIGHT } from "../utils/webViewport";

const Stack = createNativeStackNavigator();

function withPageTransition(Component) {
  return withRouteErrorBoundary(function PageTransitionedScreen(props) {
    return (
      <PageTransition>
        <Component {...props} />
      </PageTransition>
    );
  });
}

function withAuthGuard(Component) {
  return withPageTransition(function AuthGuardedScreen(props) {
    const { isAuthenticated, isAuthLoading } = useAuth();
    useEffect(() => {
      if (!isAuthLoading && !isAuthenticated) {
        const returnTo = {
          name: props.route.name,
          params: props.route.params,
        };
        props.navigation.replace("Login", { returnTo });
      }
    }, [isAuthLoading, isAuthenticated, props.navigation, props.route.name, props.route.params]);
    if (isAuthLoading) {
      return <AuthGateShell />;
    }
    if (!isAuthenticated) {
      return <AuthGateShell />;
    }
    return <Component {...props} />;
  });
}

function withRoleGuard(Component, roleCheck) {
  return withPageTransition(function RoleGuardedScreen(props) {
    const { isAuthenticated, isAuthLoading, user } = useAuth();
    useEffect(() => {
      if (isAuthLoading) return;
      if (!isAuthenticated) {
        props.navigation.replace("Login", {
          returnTo: { name: props.route.name, params: props.route.params },
        });
        return;
      }
      if (!roleCheck(user)) {
        props.navigation.replace("Home");
      }
    }, [isAuthLoading, isAuthenticated, user, props.navigation]);
    if (isAuthLoading) {
      return <AuthGateShell />;
    }
    if (!isAuthenticated) {
      return <AuthGateShell />;
    }
    if (!roleCheck(user)) {
      return <AuthGateShell />;
    }
    return <Component {...props} />;
  });
}

function createAccountRedirect(screenName) {
  return function AccountLegacyRedirect(props) {
    useEffect(() => {
      const params = props.route?.params;
      props.navigation.replace("Profile", {
        screen: screenName,
        params,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot legacy redirect; omit unstable route.params
    }, [props.navigation, screenName]);
    return null;
  };
}

const RedirectMyOrders = createAccountRedirect(ACCOUNT_NESTED.Orders);
const RedirectManageAddress = createAccountRedirect(ACCOUNT_NESTED.Addresses);
const RedirectEditProfile = createAccountRedirect(ACCOUNT_NESTED.AccountProfile);
const RedirectSettings = createAccountRedirect(ACCOUNT_NESTED.AccountProfile);

const WrappedLogin = withPageTransition(LazyLoginScreen);
const WrappedRegister = withPageTransition(LazyRegisterScreen);
const WrappedForgotPassword = withPageTransition(LazyForgotPasswordScreen);
const WrappedResetPassword = withPageTransition(LazyResetPasswordScreen);
const WrappedVerifyEmail = withPageTransition(LazyVerifyEmailScreen);
const WrappedHome = withPageTransition(HomeScreen);
const WrappedSearch = withPageTransition(LazySearchScreen);
const WrappedProduct = withPageTransition(LazyProductScreen);
const WrappedCategories = withPageTransition(LazyCategoriesScreen);
const WrappedReviews = withPageTransition(LazyReviewsScreen);
const WrappedQualityInfo = withPageTransition((props) => <LazyTrustInfoScreen {...props} topic="quality" />);
const WrappedProcessInfo = withPageTransition((props) => <LazyTrustInfoScreen {...props} topic="process" />);
const WrappedDeliveryInfo = withPageTransition((props) => <LazyTrustInfoScreen {...props} topic="delivery" />);
const WrappedAbout = withPageTransition(LazyAboutScreen);
const WrappedContact = withPageTransition(LazyContactScreen);
const WrappedDevDebug = withPageTransition(LazyDevDebugScreen);
const WrappedFaq = withPageTransition(LazyFaqScreen);
const WrappedPrivacy = withPageTransition(LazyPolicyScreen);
const WrappedTerms = withPageTransition(LazyPolicyScreen);
const WrappedShippingPolicy = withPageTransition(LazyPolicyScreen);
const WrappedReturnsPolicy = withPageTransition(LazyPolicyScreen);
const WrappedBlog = withPageTransition(LazyBlogIndexScreen);
const WrappedBlogPost = withPageTransition(LazyBlogPostScreen);
const WrappedNotFound = withPageTransition(LazyNotFoundScreen);

const ProtectedCart = withAuthGuard(LazyCartScreen);
const ProtectedProfile = withAuthGuard(LazyAccountNavigator);
const ProtectedRedirectMyOrders = withAuthGuard(RedirectMyOrders);
const ProtectedRedirectManageAddress = withAuthGuard(RedirectManageAddress);
const ProtectedRedirectEditProfile = withAuthGuard(RedirectEditProfile);
const ProtectedRedirectSettings = withAuthGuard(RedirectSettings);
const ProtectedNotifications = withAuthGuard(LazyNotificationsScreen);
const ProtectedRedeemRewards = withAuthGuard(LazyRedeemRewardsScreen);
const ProtectedSupport = withAuthGuard(LazySupportScreen);
/** Auth only — role is checked inside the screen after a fresh profile fetch (avoids stale cache + wrong redirect). */
const ProtectedDeliveryDashboard = withAuthGuard(LazyDeliveryDashboardScreen);
const ProtectedAdminDashboard = withRoleGuard(LazyAdminDashboardScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminProducts = withRoleGuard(LazyAdminProductsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminInventory = withRoleGuard(LazyAdminInventoryScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminAddProduct = withRoleGuard(LazyAdminAddProductScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminOrders = withRoleGuard(LazyAdminOrdersScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminUsers = withRoleGuard(LazyAdminUsersScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminNotifications = withRoleGuard(LazyAdminNotificationsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminAnalytics = withRoleGuard(LazyAdminAnalyticsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminCoupons = withRoleGuard(LazyAdminCouponsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminRewards = withRoleGuard(LazyAdminRewardsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminSupport = withRoleGuard(LazyAdminSupportScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminHomeView = withRoleGuard(LazyAdminHomeViewScreen, (user) => Boolean(user?.isAdmin));

export default function AppNavigator({ navigationRef, navigationReady = false }) {
  const { isAuthLoading } = useAuth();

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
      {Platform.OS === "web" && navigationReady && !isAuthLoading ? (
        <WebAppHeader navigationRef={navigationRef} />
      ) : null}
      <View
        nativeID="main-content"
        style={styles.stackFill}
        accessible={false}
        accessibilityRole="main"
        accessibilityLabel="Main content"
        {...Platform.select({
          web: { tabIndex: -1, role: "main", "aria-label": "Main content" },
        })}
      >
        {isAuthLoading ? (
          <AppStartupScreen />
        ) : (
    <>
      <SessionExpiryRedirect />
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Group screenOptions={{ presentation: "card" }}>
        <Stack.Screen name="Login" component={WrappedLogin} />
        <Stack.Screen name="Register" component={WrappedRegister} />
        <Stack.Screen name="ForgotPassword" component={WrappedForgotPassword} />
        <Stack.Screen name="ResetPassword" component={WrappedResetPassword} />
        <Stack.Screen name="VerifyEmail" component={WrappedVerifyEmail} />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen name="Home" component={WrappedHome} />
        <Stack.Screen name="Search" component={WrappedSearch} />
        <Stack.Screen name="Product" component={WrappedProduct} />
        <Stack.Screen name="Categories" component={WrappedCategories} />
        <Stack.Screen name="Reviews" component={WrappedReviews} />
        <Stack.Screen name="QualityInfo" component={WrappedQualityInfo} />
        <Stack.Screen name="ProcessInfo" component={WrappedProcessInfo} />
        <Stack.Screen name="DeliveryInfo" component={WrappedDeliveryInfo} />
        <Stack.Screen name="About" component={WrappedAbout} />
        <Stack.Screen name="Contact" component={WrappedContact} />
        <Stack.Screen name="DevDebug" component={WrappedDevDebug} />
        <Stack.Screen name="Faq" component={WrappedFaq} />
        <Stack.Screen name="Privacy" component={WrappedPrivacy} />
        <Stack.Screen name="Terms" component={WrappedTerms} />
        <Stack.Screen name="ShippingPolicy" component={WrappedShippingPolicy} />
        <Stack.Screen name="ReturnsPolicy" component={WrappedReturnsPolicy} />
        <Stack.Screen name="Blog" component={WrappedBlog} />
        <Stack.Screen name="BlogPost" component={WrappedBlogPost} />
        <Stack.Screen name="NotFound" component={WrappedNotFound} />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen name="Cart" component={ProtectedCart} />
        <Stack.Screen name="Profile" component={ProtectedProfile} />
        <Stack.Screen name="EditProfile" component={ProtectedRedirectEditProfile} />
        <Stack.Screen name="MyOrders" component={ProtectedRedirectMyOrders} />
        <Stack.Screen name="Notifications" component={ProtectedNotifications} />
        <Stack.Screen name="Settings" component={ProtectedRedirectSettings} />
        <Stack.Screen name="RedeemRewards" component={ProtectedRedeemRewards} />
        <Stack.Screen name="ManageAddress" component={ProtectedRedirectManageAddress} />
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
        <Stack.Screen name="AdminUsers" component={ProtectedAdminUsers} />
        <Stack.Screen name="AdminNotifications" component={ProtectedAdminNotifications} />
        <Stack.Screen name="AdminAnalytics" component={ProtectedAdminAnalytics} />
        <Stack.Screen name="AdminCoupons" component={ProtectedAdminCoupons} />
        <Stack.Screen name="AdminRewards" component={ProtectedAdminRewards} />
        <Stack.Screen name="AdminSupport" component={ProtectedAdminSupport} />
        <Stack.Screen name="AdminHomeView" component={ProtectedAdminHomeView} />
      </Stack.Group>
    </Stack.Navigator>
    </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navRoot: {
    flex: 1,
    width: "100%",
    ...Platform.select({
      web: { minHeight: APP_VIEWPORT_MIN_HEIGHT, height: "100%" },
      default: {},
    }),
  },
  stackFill: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    ...Platform.select({
      web: { position: "relative", zIndex: 0 },
      default: {},
    }),
  },
});
