import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import { deleteAdminUser, fetchAdminUsers, updateAdminRole } from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";

export default function AdminUsersScreen({ navigation }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminUsersStyles(c, shadowPremium), [c, shadowPremium]);
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedUserId, setExpandedUserId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  async function loadUsers() {
    try {
      setError("");
      const response = await fetchAdminUsers(token);
      setUsers(response);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!user.isAdmin) return;
    loadUsers();
  }, [user?.isAdmin]);

  const visibleUsers = useMemo(() => {
    let base = users;
    if (roleFilter === "admins") {
      base = users.filter((item) => item.isAdmin);
    } else if (roleFilter === "customers") {
      base = users.filter((item) => !item.isAdmin);
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

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((item) => item.isAdmin).length;
    const customers = total - admins;
    const usersWithAddress = users.filter((item) => Boolean(item.defaultAddress?.line1)).length;
    return { total, admins, customers, usersWithAddress };
  }, [users]);

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen}>
        <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <Text style={styles.title}>Admin Access Required</Text>
            <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.refreshBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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

  function RoleBadge({ isAdmin }) {
    return (
      <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : null]}>
        <Text style={[styles.roleBadgeText, isAdmin ? styles.roleBadgeTextAdmin : null]}>
          {isAdmin ? "Admin" : "Customer"}
        </Text>
      </View>
    );
  }

  function FilterPill({ label, active, onPress }) {
    return (
      <TouchableOpacity style={[styles.filterPill, active ? styles.filterPillActive : null]} onPress={onPress}>
        <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>{label}</Text>
      </TouchableOpacity>
    );
  }

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
    <CustomerScreenShell style={styles.screen}>
      <ScrollView style={customerScrollFill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <AdminBackLink navigation={navigation} />
          <Text style={styles.title}>Manage Users</Text>
          <Text style={styles.subtitle}>User roles, account overview, and quick actions.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <View style={styles.statsGrid}>
            <MetricCard label="Total" value={stats.total} />
            <MetricCard label="Admins" value={stats.admins} />
            <MetricCard label="Customers" value={stats.customers} />
            <MetricCard label="Address Saved" value={stats.usersWithAddress} />
          </View>

          <View style={styles.actionsRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search name / email / phone..."
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity style={styles.refreshBtn} onPress={loadUsers}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
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
          </View>

          <View style={styles.listContent}>
            {visibleUsers.map((item) => (
              <View key={item._id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.userMain}>
                    <Text style={styles.cardTitle}>{item.name || "Unnamed User"}</Text>
                    <Text style={styles.cardMeta}>{item.email}</Text>
                  </View>
                  <RoleBadge isAdmin={Boolean(item.isAdmin)} />
                </View>
                {item.phone ? <Text style={styles.cardMeta}>Phone: {item.phone}</Text> : null}
                <Text style={styles.cardMeta}>
                  Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                </Text>

                <View style={styles.actionsWrap}>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => handleRole(item._id, !item.isAdmin)}
                    disabled={busyUserId === item._id}
                  >
                    <Ionicons name="shield-checkmark-outline" size={14} color={c.textPrimary} />
                    <Text style={styles.smallBtnText}>
                      {busyUserId === item._id
                        ? "Updating..."
                        : item.isAdmin
                          ? "Make Customer"
                          : "Make Admin"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => navigation.navigate("AdminOrders", { query: item.email || item.name })}
                  >
                    <Ionicons name="receipt-outline" size={14} color={c.textPrimary} />
                    <Text style={styles.smallBtnText}>View Orders</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() =>
                      setExpandedUserId((current) => (current === item._id ? "" : item._id))
                    }
                  >
                    <Ionicons
                      name={expandedUserId === item._id ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={c.textPrimary}
                    />
                    <Text style={styles.smallBtnText}>
                      {expandedUserId === item._id ? "Hide Details" : "More Details"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => handleDelete(item._id)}
                    disabled={busyUserId === item._id}
                  >
                    <Ionicons name="trash-outline" size={14} color={c.primary} />
                    <Text style={styles.dangerBtnText}>
                      {busyUserId === item._id ? "Deleting..." : "Delete User"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {expandedUserId === item._id ? (
                  <View style={styles.detailsWrap}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="location-outline" size={14} color={c.primary} />
                      <Text style={styles.sectionTitleText}>Address</Text>
                    </View>
                    {item.defaultAddress?.line1 ? (
                      <>
                        <Text style={styles.cardMeta}>
                          {item.defaultAddress.line1}, {item.defaultAddress.city || ""},{" "}
                          {item.defaultAddress.state || ""} {item.defaultAddress.postalCode || ""}
                        </Text>
                        <Text style={styles.cardMeta}>{item.defaultAddress.country || ""}</Text>
                      </>
                    ) : (
                      <Text style={styles.cardMeta}>No default address saved.</Text>
                    )}

                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="cart-outline" size={14} color={c.primary} />
                      <Text style={styles.sectionTitleText}>Cart</Text>
                    </View>
                    <Text style={styles.cardMeta}>
                      Active cart lines: {Array.isArray(item.cartItems) ? item.cartItems.length : 0}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Cart quantity:{" "}
                      {Array.isArray(item.cartItems)
                        ? item.cartItems.reduce((sum, cartItem) => sum + Number(cartItem.quantity || 0), 0)
                        : 0}
                    </Text>

                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="notifications-outline" size={14} color={c.primary} />
                      <Text style={styles.sectionTitleText}>Push Tokens</Text>
                    </View>
                    <Text style={styles.cardMeta}>
                      Token count: {Array.isArray(item.expoPushTokens) ? item.expoPushTokens.length : 0}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
            {visibleUsers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No users found with current filters.</Text>
              </View>
            ) : null}
          </View>
        </View>
        <AppFooter />
      </ScrollView>
    </CustomerScreenShell>
  );
}

function createAdminUsersStyles(c, shadowPremium) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  panel: {
    ...adminPanel(c, shadowPremium),
  },
  title: {
    fontSize: typography.h2,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.35,
    color: c.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: c.textSecondary,
    marginBottom: spacing.md,
  },
  successText: {
    color: c.success,
    fontWeight: "600",
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
  errorText: {
    color: c.danger,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: c.surfaceMuted,
    color: c.textPrimary,
    minHeight: 42,
  },
  refreshBtn: {
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.md,
    backgroundColor: c.primarySoft,
    justifyContent: "center",
  },
  refreshBtnText: {
    color: c.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: c.surface,
  },
  filterPillActive: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  filterText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  filterTextActive: {
    color: c.primary,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: c.surfaceMuted,
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
  cardTitle: {
    color: c.textPrimary,
    fontWeight: "700",
  },
  roleBadge: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleBadgeAdmin: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  roleBadgeText: {
    color: c.textPrimary,
    fontSize: 10,
    fontWeight: "700",
  },
  roleBadgeTextAdmin: {
    color: c.primary,
  },
  cardMeta: {
    marginTop: 4,
    color: c.textSecondary,
    fontSize: 12,
  },
  actionsWrap: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallBtnText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: c.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dangerBtnText: {
    color: c.primary,
    fontWeight: "700",
    fontSize: 12,
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
  emptyCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  });
}
