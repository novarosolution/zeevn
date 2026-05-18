import React, { useEffect, useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import AppStartupScreen from "../components/AppStartupScreen";
import AuthGateShell from "../components/AuthGateShell";
import WebAppHeader from "../components/WebAppHeader";
import PageTransition from "../components/motion/PageTransition";
import HomeScreen from "../screens/HomeScreen";
import ProductScreen from "../screens/ProductScreen";
import CategoriesScreen from "../screens/CategoriesScreen";
import TrustInfoScreen from "../screens/TrustInfoScreen";
import ReviewsScreen from "../screens/ReviewsScreen";
import CartScreen from "../screens/CartScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import RedeemRewardsScreen from "../screens/RedeemRewardsScreen";
import AccountNavigator from "./AccountNavigator";
import { ACCOUNT_NESTED } from "./accountRoutes";
import SearchScreen from "../screens/SearchScreen";
import SupportScreen from "../screens/SupportScreen";
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
import AboutScreen from "../screens/editorial/AboutScreen";
import ContactScreen from "../screens/editorial/ContactScreen";
import FaqScreen from "../screens/editorial/FaqScreen";
import PolicyScreen from "../screens/editorial/PolicyScreen";
import BlogIndexScreen from "../screens/editorial/BlogIndexScreen";
import BlogPostScreen from "../screens/editorial/BlogPostScreen";
import NotFoundScreen from "../screens/NotFoundScreen";
import { useAuth } from "../context/AuthContext";
import SessionExpiryRedirect from "./SessionExpiryRedirect";
import { withRouteErrorBoundary } from "../components/errors/RouteErrorBoundary";

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

const WrappedLogin = withPageTransition(LoginScreen);
const WrappedRegister = withPageTransition(RegisterScreen);
const WrappedForgotPassword = withPageTransition(ForgotPasswordScreen);
const WrappedResetPassword = withPageTransition(ResetPasswordScreen);
const WrappedVerifyEmail = withPageTransition(VerifyEmailScreen);
const WrappedHome = withPageTransition(HomeScreen);
const WrappedSearch = withPageTransition(SearchScreen);
const WrappedProduct = withPageTransition(ProductScreen);
const WrappedCategories = withPageTransition(CategoriesScreen);
const WrappedReviews = withPageTransition(ReviewsScreen);
const WrappedQualityInfo = withPageTransition((props) => <TrustInfoScreen {...props} topic="quality" />);
const WrappedProcessInfo = withPageTransition((props) => <TrustInfoScreen {...props} topic="process" />);
const WrappedDeliveryInfo = withPageTransition((props) => <TrustInfoScreen {...props} topic="delivery" />);
const WrappedAbout = withPageTransition(AboutScreen);
const WrappedContact = withPageTransition(ContactScreen);
const WrappedFaq = withPageTransition(FaqScreen);
const WrappedPrivacy = withPageTransition(PolicyScreen);
const WrappedTerms = withPageTransition(PolicyScreen);
const WrappedShippingPolicy = withPageTransition(PolicyScreen);
const WrappedReturnsPolicy = withPageTransition(PolicyScreen);
const WrappedBlog = withPageTransition(BlogIndexScreen);
const WrappedBlogPost = withPageTransition(BlogPostScreen);
const WrappedNotFound = withPageTransition(NotFoundScreen);

const ProtectedCart = withAuthGuard(CartScreen);
const ProtectedProfile = withAuthGuard(AccountNavigator);
const ProtectedRedirectMyOrders = withAuthGuard(RedirectMyOrders);
const ProtectedRedirectManageAddress = withAuthGuard(RedirectManageAddress);
const ProtectedRedirectEditProfile = withAuthGuard(RedirectEditProfile);
const ProtectedRedirectSettings = withAuthGuard(RedirectSettings);
const ProtectedNotifications = withAuthGuard(NotificationsScreen);
const ProtectedRedeemRewards = withAuthGuard(RedeemRewardsScreen);
const ProtectedSupport = withAuthGuard(SupportScreen);
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
      web: { minHeight: "100dvh", height: "100%" },
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
