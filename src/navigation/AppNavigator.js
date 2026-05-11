import React, { useEffect, useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet, View } from "react-native";
import AppStartupScreen from "../components/AppStartupScreen";
import AuthGateShell from "../components/AuthGateShell";
import WebAppHeader from "../components/WebAppHeader";
import PageTransition from "../components/motion/PageTransition";
import HomeScreen from "../screens/HomeScreen";
import ProductScreen from "../screens/ProductScreen";
import CartScreen from "../screens/CartScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RedeemRewardsScreen from "../screens/RedeemRewardsScreen";
import ManageAddressScreen from "../screens/ManageAddressScreen";
import SupportScreen from "../screens/SupportScreen";
import DeliveryDashboardScreen from "../screens/DeliveryDashboardScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import AdminAddProductScreen from "../screens/admin/AdminAddProductScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminNotificationsScreen from "../screens/admin/AdminNotificationsScreen";
import AdminAnalyticsScreen from "../screens/admin/AdminAnalyticsScreen";
import AdminCouponsScreen from "../screens/admin/AdminCouponsScreen";
import AdminRewardsScreen from "../screens/admin/AdminRewardsScreen";
import AdminSupportScreen from "../screens/admin/AdminSupportScreen";
import AdminHomeViewScreen from "../screens/admin/AdminHomeViewScreen";
import AdminInventoryScreen from "../screens/admin/AdminInventoryScreen";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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
    useEffect(() => {
      if (!isAuthLoading && !isAuthenticated) {
        props.navigation.replace("Login");
      }
    }, [isAuthLoading, isAuthenticated, props.navigation]);
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
        props.navigation.replace("Login");
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

const WrappedLogin = withPageTransition(LoginScreen);
const WrappedRegister = withPageTransition(RegisterScreen);
const WrappedHome = withPageTransition(HomeScreen);
const WrappedProduct = withPageTransition(ProductScreen);

const ProtectedCart = withAuthGuard(CartScreen);
const ProtectedProfile = withAuthGuard(ProfileScreen);
const ProtectedEditProfile = withAuthGuard(EditProfileScreen);
const ProtectedMyOrders = withAuthGuard(MyOrdersScreen);
const ProtectedNotifications = withAuthGuard(NotificationsScreen);
const ProtectedSettings = withAuthGuard(SettingsScreen);
const ProtectedRedeemRewards = withAuthGuard(RedeemRewardsScreen);
const ProtectedManageAddress = withAuthGuard(ManageAddressScreen);
const ProtectedSupport = withAuthGuard(SupportScreen);
/** Auth only — role is checked inside the screen after a fresh profile fetch (avoids stale cache + wrong redirect). */
const ProtectedDeliveryDashboard = withAuthGuard(DeliveryDashboardScreen);
const ProtectedAdminDashboard = withRoleGuard(AdminDashboardScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminProducts = withRoleGuard(AdminProductsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminInventory = withRoleGuard(AdminInventoryScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminAddProduct = withRoleGuard(AdminAddProductScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminOrders = withRoleGuard(AdminOrdersScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminUsers = withRoleGuard(AdminUsersScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminNotifications = withRoleGuard(AdminNotificationsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminAnalytics = withRoleGuard(AdminAnalyticsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminCoupons = withRoleGuard(AdminCouponsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminRewards = withRoleGuard(AdminRewardsScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminSupport = withRoleGuard(AdminSupportScreen, (user) => Boolean(user?.isAdmin));
const ProtectedAdminHomeView = withRoleGuard(AdminHomeViewScreen, (user) => Boolean(user?.isAdmin));

export default function AppNavigator({ navigationRef }) {
  const { isAuthLoading } = useAuth();
  const { colors, isDark } = useTheme();

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
      {Platform.OS === "web" ? (
        <WebAppHeader navigationRef={navigationRef} />
      ) : null}
      <View style={styles.stackFill}>
        {isAuthLoading ? (
          <AppStartupScreen
            colors={colors}
            isDark={isDark}
            useAppFonts
            footnote="Restoring your Zeevan session…"
          />
        ) : (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Group screenOptions={{ presentation: "card" }}>
        <Stack.Screen name="Login" component={WrappedLogin} />
        <Stack.Screen name="Register" component={WrappedRegister} />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen name="Home" component={WrappedHome} />
        <Stack.Screen name="Product" component={WrappedProduct} />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen name="Cart" component={ProtectedCart} />
        <Stack.Screen name="Profile" component={ProtectedProfile} />
        <Stack.Screen name="EditProfile" component={ProtectedEditProfile} />
        <Stack.Screen name="MyOrders" component={ProtectedMyOrders} />
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
        <Stack.Screen name="AdminUsers" component={ProtectedAdminUsers} />
        <Stack.Screen name="AdminNotifications" component={ProtectedAdminNotifications} />
        <Stack.Screen name="AdminAnalytics" component={ProtectedAdminAnalytics} />
        <Stack.Screen name="AdminCoupons" component={ProtectedAdminCoupons} />
        <Stack.Screen name="AdminRewards" component={ProtectedAdminRewards} />
        <Stack.Screen name="AdminSupport" component={ProtectedAdminSupport} />
        <Stack.Screen name="AdminHomeView" component={ProtectedAdminHomeView} />
      </Stack.Group>
    </Stack.Navigator>
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
  },
});
