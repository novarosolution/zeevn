import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import SectionReveal from "../../components/motion/SectionReveal";
import { useAuth } from "../../context/AuthContext";
import {
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminRole,
  updateDeliveryPartnerRole} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import {
  adminBadgeClusterStyle,
  adminCardActionsStyle,
  adminMetricCardStyle,
  adminGatePanel,
  adminShellContent,
  adminRecordHeaderRowStyle,
  adminRecordMainColStyle,
  adminStatsGridStyle,
  adminToolbarPrimary,
  adminToolbarRow,
  useAdminCompactLayout,
} from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { layout, radius, spacing } from "../../theme/tokens";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import PremiumEmptyState from "../../components/ui/PremiumEmptyState";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumCard from "../../components/ui/PremiumCard";
import PremiumChip from "../../components/ui/PremiumChip";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminStatusPill from "../../components/admin/AdminStatusPill";
import AdminKpiCard, { AdminKpiGrid } from "../../components/admin/AdminKpiCard";
import AdminToolbar, { AdminToolbarSlot } from "../../components/admin/AdminToolbar";
import { FONT_HEADING } from "../../theme/typographyRoles";

export default function AdminUsersScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const compactAdmin = useAdminCompactLayout();
  const styles = useMemo(
    () => createAdminUsersStyles(c, shadowPremium, compactAdmin),
    [c, shadowPremium, compactAdmin]
  );
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
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage
        scrollVariant="inner"
        showFooter={false}
          style={customerScrollFill}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner
                severity="warning"
                title={ADMIN_GATE.title}
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label={ADMIN_GATE.backHome}
                iconLeft="home-outline"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
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
        }},
    ]);
  };

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
        style={customerScrollFill}
        showsVerticalScrollIndicator={false}
      >
        <KankregAdminShell
          navigation={navigation}
          route={route}
          title={ADMIN_SCREEN_COPY.users.title}
          subtitle={ADMIN_SCREEN_COPY.users.subtitle}
        >
        <View style={styles.panel}>
          <SectionReveal preset="fade-up" delay={0}>
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

          <AdminPanel
            title="People pulse"
            icon="people-outline"
            meta="Tap to filter"
            description="Admins, customers, and delivery partners — tap a tile to filter."
          >
            <AdminKpiGrid compact={compactAdmin}>
              <AdminKpiCard label="Total" value={String(stats.total)} onPress={() => setRoleFilter("all")} />
              <AdminKpiCard label="Admins" value={String(stats.admins)} onPress={() => setRoleFilter("admins")} />
              <AdminKpiCard label="Customers" value={String(stats.customers)} onPress={() => setRoleFilter("customers")} />
              <AdminKpiCard label="Address saved" value={String(stats.usersWithAddress)} />
              <AdminKpiCard
                label="Delivery"
                value={String(stats.deliveryPartners)}
                onPress={() => setRoleFilter("delivery")}
              />
            </AdminKpiGrid>
          </AdminPanel>

          <AdminPanel
            title="Directory"
            icon="search-outline"
            meta={`${visibleUsers.length} shown`}
            description="Search by name, email, or phone. Assign admin or delivery roles from the list."
          >
            <AdminToolbar>
              <AdminToolbarSlot flex>
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
              </AdminToolbarSlot>
              <PremiumButton label="Refresh" iconLeft="refresh-outline" variant="secondary" size="sm" onPress={loadUsers} />
            </AdminToolbar>
            <View style={styles.filtersRow}>
              <FilterPill label="All" active={roleFilter === "all"} onPress={() => setRoleFilter("all")} />
              <FilterPill label="Admins" active={roleFilter === "admins"} onPress={() => setRoleFilter("admins")} />
              <FilterPill label="Customers" active={roleFilter === "customers"} onPress={() => setRoleFilter("customers")} />
              <FilterPill label="Delivery" active={roleFilter === "delivery"} onPress={() => setRoleFilter("delivery")} />
            </View>
          </AdminPanel>
          </SectionReveal>

          <SectionReveal preset="fade-up" delay={60}>
          <View style={styles.listContent}>
            {visibleUsers.length > 0 && !compactAdmin ? (
              <AdminPanel noPadding style={styles.tablePanel}>
                <AdminDataTable
                  rows={renderedUsers}
                  keyExtractor={(row) => row._id}
                  columns={[
                    {
                      key: "user",
                      label: "User",
                      flex: 1.5,
                      render: (row) => (
                        <View style={styles.userCell}>
                          <View style={styles.userAv}>
                            <Text style={styles.userAvText}>
                              {String(row.name || row.email || "?").charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.userName} numberOfLines={1}>
                              {row.name || "Unnamed"}
                            </Text>
                            <Text style={styles.userEmail} numberOfLines={1}>
                              {row.email}
                            </Text>
                          </View>
                        </View>
                      ),
                    },
                    {
                      key: "role",
                      label: "Role",
                      flex: 0.8,
                      render: (row) =>
                        row.isAdmin ? "Admin" : row.isDeliveryPartner ? "Delivery" : "Customer",
                    },
                    { key: "orders", label: "Orders", width: 64, render: () => "—" },
                    { key: "spent", label: "Spent", width: 72, render: () => "—" },
                    {
                      key: "joined",
                      label: "Joined",
                      flex: 0.8,
                      render: (row) =>
                        row.createdAt ? new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—",
                    },
                    {
                      key: "status",
                      label: "Status",
                      flex: 0.7,
                      render: () => <AdminStatusPill label="Active" tone="ok" />,
                    },
                  ]}
                />
              </AdminPanel>
            ) : null}
            {visibleUsers.length === 0 ? (
              <PremiumEmptyState
                iconName="people-outline"
                title={ADMIN_SCREEN_COPY.users.empty}
                description={search.trim() || roleFilter !== "all" ? "Try clearing search or switching the role filter." : "No accounts loaded yet."}
                compact
              />
            ) : null}
            {compactAdmin
              ? renderedUsers.map((item) => (
              <PremiumCard key={item._id} padding="md" style={styles.cardWrap}>
                <View style={styles.cardTopRow}>
                  <View style={styles.userMain}>
                    <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>
                      {item.name || "Unnamed User"}
                    </Text>
                    <Text style={[styles.cardMeta, { color: c.textSecondary }]} numberOfLines={2}>
                      {item.email}
                    </Text>
                  </View>
                  <View style={styles.roleBadgeRow}>
                    <RoleBadges isAdmin={Boolean(item.isAdmin)} isDeliveryPartner={Boolean(item.isDeliveryPartner)} />
                  </View>
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
            ))
              : null}
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
        </KankregAdminShell>
</KankregScrollPage>
    </AdminScreenShell>
  );
}

function createAdminUsersStyles(c, shadowPremium, compact = false) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: "100%"},
    panel: adminShellContent(),
    gatePanel: adminGatePanel(c, shadowPremium),
  gateCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start"},
  bannerSpacer: {
    marginBottom: spacing.sm},
  tablePanel: {
    marginBottom: spacing.md,
    paddingHorizontal: 0,
    paddingBottom: 4,
  },
  userCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAv: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvText: {
    fontFamily: FONT_HEADING,
    fontSize: 13,
    color: "#fff",
  },
  userName: {
    color: c.textPrimary,
    fontWeight: "600",
    fontSize: 12.5,
  },
  userEmail: {
    color: c.textMuted,
    fontSize: 11,
  },
  statsGrid: adminStatsGridStyle(compact),
  metricCard: {
    ...adminMetricCardStyle(compact),
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.sm,
    alignItems: "center"},
  metricValue: {
    color: c.primary,
    fontSize: 18,
    fontWeight: "800"},
  metricLabel: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "700"},
  actionsRow: {
    ...adminToolbarRow,
    marginBottom: spacing.sm},
  searchInputWrap: {
    ...adminToolbarPrimary},
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm},
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl},
  cardWrap: {
    width: "100%"},
  cardTopRow: adminRecordHeaderRowStyle(compact),
  userMain: adminRecordMainColStyle(compact),
  roleBadgeRow: adminBadgeClusterStyle(compact),
  cardTitle: {
    fontWeight: "700"},
  cardMeta: {
    marginTop: 4,
    fontSize: 12},
  actionsWrap: {
    marginTop: spacing.sm,
    ...adminCardActionsStyle(compact),
  },
  detailsWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: spacing.xs},
  sectionTitleRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 6},
  sectionTitleText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: "800"}});
}
