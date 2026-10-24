import React, { useCallback, useEffect, useMemo, useState } from "react";
import AuthGateShell from "../components/AuthGateShell";
import { StoreProfile } from "../components/store/entry";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { resetNavigationToHome } from "../navigation/resetToHome";
import { PROFILE_SCREEN } from "../content/appContent";
import { fetchMyNotifications, fetchMyOrders } from "../services/userService";

export default function ProfileScreen({ navigation }) {
  const { isAuthenticated, token, user, logout, isAuthLoading, refreshProfile } = useAuth();
  const { toastInfo } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loadProfile = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) setLoading(true);
        setError("");
        const [profile, myOrders, myNotifications] = await Promise.all([
          refreshProfile(),
          fetchMyOrders(token),
          fetchMyNotifications(token),
        ]);
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setAvatarUrl((profile.avatar || "").trim());
        setOrders(myOrders);
        setNotifications(myNotifications);
      } catch (err) {
        setError(err.message || "Unable to load profile data.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [refreshProfile, token]
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    loadProfile();
  }, [isAuthLoading, isAuthenticated, loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    try {
      setIsSigningOut(true);
      await logout();
      toastInfo("You've been signed out.", { title: "Signed out" });
      resetNavigationToHome(navigation);
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, logout, navigation, toastInfo]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );
  const displayName = (name || user?.name || "").trim() || PROFILE_SCREEN.fallbackName;
  const phoneText = (phone || user?.phone || "").trim();
  const fullAvatar = (avatarUrl || user?.avatar || "").trim();
  const rewardPoints = Math.max(0, Number(user?.rewardPoints ?? 0));

  if (isAuthLoading) {
    return <AuthGateShell navigation={navigation} />;
  }
  if (!isAuthenticated) {
    return <AuthGateShell signedOut navigation={navigation} />;
  }

  return (
    <StoreProfile
      navigation={navigation}
      user={user}
      displayName={displayName}
      phone={phoneText}
      avatarUrl={fullAvatar}
      rewardPoints={rewardPoints}
      orderCount={orders.length}
      unreadCount={unreadNotifications}
      loading={loading}
      error={error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onSignOut={handleSignOut}
      signingOut={isSigningOut}
    />
  );
}
