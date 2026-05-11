import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import { useAuth } from "../../context/AuthContext";
import {
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminRole,
  updateDeliveryPartnerRole,
} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { layout, radius, spacing } from "../../theme/tokens";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumChip from "../../components/ui/PremiumChip";
import { ADMIN_SCREEN_COPY } from "../../content/appContent";

export default function AdminUsersScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminUsersStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedUserId, setExpandedUserId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [renderCount, setRenderCount] = useState(40);

  const loadUsers = useCallback(async () => {
    try {
      setError("");
      const response = await fetchAdminUsers(token);
      setUsers(response);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadUsers();
  }, [user, loadUsers]);

  const visibleUsers = useMemo(() => {
    let base = users;
    if (roleFilter === "admins") {
      base = users.filter((item) => item.isAdmin);
    } else if (roleFilter === "customers") {
      base = users.filter((item) => !item.isAdmin);
    } else if (roleFilter === "delivery") {
      base = users.filter((item) => item.isDeliveryPartner);
    }
    if (!search.trim()) return base;
    const query = search.toLowerCase();
    return base.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(query) ||
        String(item.email).toLowerCase().includes(query) ||
        String(item.phone || "").toLowerCase().includes(query)
    );
  }, [users, search, roleFilter]);
  const renderedUsers = useMemo(
    () => visibleUsers.slice(0, renderCount),
    [visibleUsers, renderCount]
  );

  useEffect(() => {
    setRenderCount(40);
  }, [search, roleFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((item) => item.isAdmin).length;
    const deliveryPartners = users.filter((item) => item.isDeliveryPartner).length;
    const customers = total - admins;
    const usersWithAddress = users.filter((item) => Boolean(item.defaultAddress?.line1)).length;
    return { total, admins, customers, usersWithAddress, deliveryPartners };
  }, [users]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.panel}>
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label="Back to home"
                iconLeft="home-outline"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  function MetricCard({ label, value }) {
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    );
  }

  function RoleBadges({ isAdmin, isDeliveryPartner }) {
    return (
      <View style={styles.roleBadgeRow}>
        <PremiumChip label={isAdmin ? "Admin" : "Customer"} tone={isAdmin ? "gold" : "neutral"} size="xs" />
        {isDeliveryPartner ? <PremiumChip label="Delivery" tone="green" size="xs" /> : null}
      </View>
    );
  }

  function FilterPill({ label, active, onPress }) {
    return <PremiumChip label={label} tone={active ? "gold" : "neutral"} size="sm" selected={active} onPress={onPress} />;
  }

  const handleDeliveryPartner = async (id, isDeliveryPartner) => {
    try {
      setBusyUserId(id);
      setError("");
      setSuccess("");
      await updateDeliveryPartnerRole(token, id, isDeliveryPartner);
      setSuccess(isDeliveryPartner ? "User can now use the delivery dashboard." : "Delivery access removed.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to update delivery access.");
    } finally {
      setBusyUserId("");
    }
  };

  const handleRole = async (id, isAdmin) => {
    try {
      setBusyUserId(id);
      setError("");
      setSuccess("");
      await updateAdminRole(token, id, isAdmin);
      setSuccess(`User role updated to ${isAdmin ? "admin" : "customer"}.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to update user role.");
    } finally {
      setBusyUserId("");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete User", "This account will be removed permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setBusyUserId(id);
            setError("");
            setSuccess("");
            await deleteAdminUser(token, id);
            setSuccess("User deleted successfully.");
            await loadUsers();
          } catch (err) {
            setError(err.message || "Unable to delete user.");
          } finally {
            setBusyUserId("");
          }
        },
      },
    ]);
  };

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
      <MotionScrollView
        style={customerScrollFill}
        contentContainerStyle={adminInnerPageScrollContent(insets)}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <SectionReveal preset="fade-up" delay={0}>
          <AdminBackLink navigation={navigation} />
          <AdminPageHeading
            title={ADMIN_SCREEN_COPY.users.title}
            subtitle={ADMIN_SCREEN_COPY.users.subtitle}
          />
          {error ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
            </View>
          ) : null}
          {success ? (
            <View style={styles.bannerSpacer}>
              <PremiumErrorBanner severity="success" message={success} onClose={() => setSuccess("")} compact />
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <MetricCard label="Total" value={stats.total} />
            <MetricCard label="Admins" value={stats.admins} />
            <MetricCard label="Customers" value={stats.customers} />
            <MetricCard label="Address Saved" value={stats.usersWithAddress} />
            <MetricCard label="Delivery" value={stats.deliveryPartners} />
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.searchInputWrap}>
              <PremiumInput
                label="Search users"
                value={search}
                onChangeText={setSearch}
                placeholder="Name, email, or phone"
                iconLeft="search-outline"
                iconRight={search ? "close-circle" : undefined}
                onIconRightPress={search ? () => setSearch("") : undefined}
                autoCapitalize="none"
              />
            </View>
            <PremiumButton
              label={ADMIN_SCREEN_COPY.refreshCta}
              iconLeft="refresh-outline"
              variant="secondary"
              size="sm"
              onPress={loadUsers}
            />
          </View>
          <View style={styles.filtersRow}>
            <FilterPill
              label="All"
              active={roleFilter === "all"}
              onPress={() => setRoleFilter("all")}
            />
            <FilterPill
              label="Admins"
              active={roleFilter === "admins"}
              onPress={() => setRoleFilter("admins")}
            />
            <FilterPill
              label="Customers"
              active={roleFilter === "customers"}
              onPress={() => setRoleFilter("customers")}
            />
            <FilterPill
              label="Delivery"
              active={roleFilter === "delivery"}
              onPress={() => setRoleFilter("delivery")}
            />
          </View>
          </SectionReveal>

          <SectionReveal preset="fade-up" delay={60}>
          <View style={styles.listContent}>
            {visibleUsers.length === 0 ? (
              <PremiumEmptyState
                iconName="people-outline"
                title="No users match"
                description={search.trim() || roleFilter !== "all" ? "Try clearing search or switching the role filter." : "No accounts loaded yet."}
                compact
              />
            ) : null}
            {renderedUsers.map((item) => (
              <PremiumCard key={item._id} padding="md" style={styles.cardWrap}>
                <View style={styles.cardTopRow}>
                  <View style={styles.userMain}>
                    <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{item.name || "Unnamed User"}</Text>
                    <Text style={[styles.cardMeta, { color: c.textSecondary }]}>{item.email}</Text>
                  </View>
                  <RoleBadges isAdmin={Boolean(item.isAdmin)} isDeliveryPartner={Boolean(item.isDeliveryPartner)} />
                </View>
                {item.phone ? <Text style={[styles.cardMeta, { color: c.textSecondary }]}>Phone: {item.phone}</Text> : null}
                <Text style={[styles.cardMeta, { color: c.textSecondary }]}>
                  Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                </Text>

                <View style={styles.actionsWrap}>
                  <PremiumButton
                    label={
                      busyUserId === item._id
                        ? "Updating..."
                        : item.isDeliveryPartner
                          ? "Remove delivery"
                          : "Enable delivery"
                    }
                    iconLeft="bicycle-outline"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleDeliveryPartner(item._id, !item.isDeliveryPartner)}
                    disabled={busyUserId === item._id}
                  />
                  <PremiumButton
                    label={
                      busyUserId === item._id
                        ? "Updating..."
                        : item.isAdmin
                          ? "Make Customer"
                          : "Make Admin"
                    }
                    iconLeft="shield-checkmark-outline"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleRole(item._id, !item.isAdmin)}
                    disabled={busyUserId === item._id}
                  />
                  <PremiumButton
                    label="View Orders"
                    iconLeft="receipt-outline"
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.navigate("AdminOrders", { query: item.email || item.name })}
                  />
                  <PremiumButton
                    label={expandedUserId === item._id ? "Hide Details" : "More Details"}
                    iconLeft={expandedUserId === item._id ? "chevron-up" : "chevron-down"}
                    variant="subtle"
                    size="sm"
                    onPress={() => setExpandedUserId((current) => (current === item._id ? "" : item._id))}
                  />
                  <PremiumButton
                    label={busyUserId === item._id ? "Deleting..." : "Delete User"}
                    iconLeft="trash-outline"
                    variant="danger"
                    size="sm"
                    onPress={() => handleDelete(item._id)}
                    disabled={busyUserId === item._id}
                  />
                </View>

                {expandedUserId === item._id ? (
                  <View style={styles.detailsWrap}>
                    <View style={styles.sectionTitleRow}>
                      <Text style={[styles.sectionTitleText, { color: c.textPrimary }]}>Address</Text>
                    </View>
                    {item.defaultAddress?.line1 ? (
                      <>
                        <Text style={[styles.cardMeta, { color: c.textSecondary }]}>
                          {item.defaultAddress.line1}, {item.defaultAddress.city || ""},{" "}
                          {item.defaultAddress.state || ""} {item.defaultAddress.postalCode || ""}
                        </Text>
                        <Text style={[styles.cardMeta, { color: c.textSecondary }]}>{item.defaultAddress.country || ""}</Text>
                      </>
                    ) : (
                      <Text style={[styles.cardMeta, { color: c.textSecondary }]}>No default address saved.</Text>
                    )}

                    <View style={styles.sectionTitleRow}>
                      <Text style={[styles.sectionTitleText, { color: c.textPrimary }]}>Cart</Text>
                    </View>
                    <Text style={[styles.cardMeta, { color: c.textSecondary }]}>
                      Active cart lines: {Array.isArray(item.cartItems) ? item.cartItems.length : 0}
                    </Text>
                    <Text style={[styles.cardMeta, { color: c.textSecondary }]}>
                      Cart quantity:{" "}
                      {Array.isArray(item.cartItems)
                        ? item.cartItems.reduce((sum, cartItem) => sum + Number(cartItem.quantity || 0), 0)
                        : 0}
                    </Text>

                    <View style={styles.sectionTitleRow}>
                      <Text style={[styles.sectionTitleText, { color: c.textPrimary }]}>Push Tokens</Text>
                    </View>
                    <Text style={[styles.cardMeta, { color: c.textSecondary }]}>
                      Token count: {Array.isArray(item.expoPushTokens) ? item.expoPushTokens.length : 0}
                    </Text>
                  </View>
                ) : null}
              </PremiumCard>
            ))}
            {renderedUsers.length < visibleUsers.length ? (
              <PremiumButton
                label={`Load more (${visibleUsers.length - renderedUsers.length} remaining)`}
                variant="subtle"
                size="md"
                onPress={() => setRenderCount((prev) => prev + 40)}
                fullWidth
              />
            ) : null}
          </View>
          </SectionReveal>
        </View>
        <AppFooter />
      </MotionScrollView>
    </CustomerScreenShell>
  );
}

function createAdminUsersStyles(c, shadowPremium) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth + 72, default: "100%" }),
  },
  panel: {
    ...adminPanel(c, shadowPremium),
  },
  gateCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  bannerSpacer: {
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  metricCard: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  metricValue: {
    color: c.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  cardWrap: {
    width: "100%",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  userMain: {
    flex: 1,
  },
  roleBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: "48%",
  },
  cardTitle: {
    fontWeight: "700",
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  actionsWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    alignItems: "center",
  },
  detailsWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: spacing.xs,
  },
  sectionTitleRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitleText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  });
}
