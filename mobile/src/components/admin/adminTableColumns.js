import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { formatOrderPublicRef } from "../../content/appContent";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";
import { formatINR } from "../../utils/currency";
import { getOrderItemQty } from "../../utils/adminOrderHelpers";
import { productCoverUri, productStockMeta } from "../../utils/adminProductHelpers";
import {
  ORDER_ADMIN_NEXT_STATUS,
  getAdminNextStatusLabel,
  getOrderStatusLabel,
} from "../../utils/orderStatus";
import AdminStatusPill, { orderStatusTone } from "./AdminStatusPill";
import AdminBadge from "./AdminBadge";
import AdminProductCell from "./AdminProductCell";
import AdminQtyStepper from "./AdminQtyStepper";
import AdminSwitch from "./AdminSwitch";

function AdminTableAction({ label, onPress, decorative = false }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createLinkStyles(chrome), [chrome]);

  if (decorative) {
    return <Text style={styles.link}>{label} →</Text>;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${label} order`}
    >
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

function createLinkStyles(chrome) {
  return StyleSheet.create({
    link: {
      color: chrome.goldDeep,
      fontFamily: fonts.semibold,
      fontSize: 12.5,
    },
  });
}

function paymentLabel(order) {
  const m = String(order.paymentMethod || order.paymentMode || "").toLowerCase();
  if (m.includes("cod") || m.includes("cash")) return "COD";
  if (m.includes("youpi")) return "YouPI";
  if (m.includes("razor")) return "Razorpay";
  return order.paymentMethod || "—";
}

export function buildOrderTableColumns({ onView, rowPressable = false }) {
  return [
    {
      key: "ref",
      label: "Order",
      flex: 1,
      strong: true,
      render: (row) => formatOrderPublicRef(row) || `#${String(row._id || "").slice(-6).toUpperCase()}`,
    },
    {
      key: "customer",
      label: "Customer",
      flex: 1.1,
      render: (row) => row.user?.name || row.userName || row.shippingAddress?.name || "Guest",
    },
    {
      key: "date",
      label: "Date",
      flex: 0.8,
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })
          : "—",
    },
    {
      key: "items",
      label: "Qty",
      width: 56,
      render: (row) => String(getOrderItemQty(row)),
    },
    {
      key: "total",
      label: "Total",
      flex: 0.9,
      strong: true,
      render: (row) => formatINR(row.totalPrice || 0),
    },
    {
      key: "channel",
      label: "Channel",
      flex: 0.7,
      render: (row) => (row.channel === "walk_in" ? "Counter" : "Online"),
    },
    {
      key: "payment",
      label: "Payment",
      flex: 0.8,
      render: (row) => paymentLabel(row),
    },
    {
      key: "status",
      label: "Status",
      flex: 1,
      render: (row) => (
        <AdminStatusPill label={getOrderStatusLabel(row.status)} tone={orderStatusTone(row.status)} />
      ),
    },
    {
      key: "next",
      label: "Next",
      flex: 0.9,
      render: (row) => {
        const next = ORDER_ADMIN_NEXT_STATUS[String(row.status || "")];
        return next ? getAdminNextStatusLabel(row.status) : "—";
      },
    },
    {
      key: "view",
      label: "",
      width: 72,
      align: "right",
      render: (row) =>
        onView ? (
          <AdminTableAction
            label="Manage"
            onPress={() => onView(row)}
            decorative={rowPressable}
          />
        ) : null,
    },
  ];
}

export function buildProductTableColumns({ onEdit, rowPressable = false }) {
  return [
    {
      key: "name",
      label: "Product",
      flex: 1.6,
      render: (row) => <AdminProductCell name={row.name} imageUri={productCoverUri(row)} />,
    },
    { key: "sku", label: "SKU", flex: 0.8, render: (row) => row.sku || "—" },
    { key: "category", label: "Category", flex: 0.9, render: (row) => row.category || "General" },
    {
      key: "price",
      label: "Price",
      flex: 0.7,
      strong: true,
      render: (row) => formatINR(row.price || 0),
    },
    { key: "unit", label: "Unit", flex: 0.6, render: (row) => row.unit || "1 pc" },
    {
      key: "status",
      label: "Status",
      flex: 0.9,
      render: (row) => {
        const meta = productStockMeta(row);
        return <AdminBadge label={meta.label} tone={meta.badge || "neutral"} size="sm" />;
      },
    },
    {
      key: "edit",
      label: "",
      width: 56,
      align: "right",
      render: (row) =>
        onEdit ? (
          <AdminTableAction label="Edit" onPress={() => onEdit(row)} decorative={rowPressable} />
        ) : null,
    },
  ];
}

export function buildInventoryTableColumns({
  onDelta,
  onDeltaFloor,
  onApplyQty,
  onApplyFloor,
  onToggle,
  onDraft,
  onDraftFloor,
  onStockIn,
  draftQty = {},
  draftFloor = {},
  busyId,
  stockPill,
}) {
  return [
    {
      key: "name",
      label: "Product",
      flex: 1.5,
      render: (row) => <AdminProductCell name={row.name} imageUri={productCoverUri(row)} />,
    },
    { key: "sku", label: "SKU", flex: 0.7, render: (row) => row.sku || "—" },
    { key: "category", label: "Category", flex: 0.8, render: (row) => String(row.category || "").trim() || "General" },
    { key: "unit", label: "Unit", flex: 0.6, render: (row) => String(row.unit || "").trim() || "—" },
    {
      key: "qty",
      label: "Online",
      width: 132,
      render: (row) => {
        const dval =
          draftQty[row._id] !== undefined
            ? draftQty[row._id]
            : String(Math.max(0, Number(row.stockQty) || 0));
        return (
          <AdminQtyStepper
            value={dval}
            busy={busyId === row._id}
            onMinus={() => onDelta?.(row, -1)}
            onPlus={() => onDelta?.(row, 1)}
            onChange={(t) => onDraft?.(row, t)}
            onCommit={() => onApplyQty?.(row)}
          />
        );
      },
    },
    {
      key: "floor",
      label: "Floor",
      width: 132,
      render: (row) => {
        const dval =
          draftFloor[row._id] !== undefined
            ? draftFloor[row._id]
            : String(Math.max(0, Number(row.stockCounter) || 0));
        return (
          <AdminQtyStepper
            value={dval}
            busy={busyId === row._id}
            onMinus={() => onDeltaFloor?.(row, -1)}
            onPlus={() => onDeltaFloor?.(row, 1)}
            onChange={(t) => onDraftFloor?.(row, t)}
            onCommit={() => onApplyFloor?.(row)}
          />
        );
      },
    },
    {
      key: "avail",
      label: "On/Off",
      width: 72,
      render: (row) => (
        <AdminSwitch
          value={row.inStock !== false}
          disabled={busyId === row._id}
          accessibilityLabel="On/Off"
          onChange={(next) => onToggle?.(row, next)}
        />
      ),
    },
    {
      key: "status",
      label: "Stock",
      flex: 0.8,
      render: (row) => {
        const pill = stockPill?.(row) || { label: "In stock", tone: "green" };
        return <AdminBadge label={pill.label} tone={pill.tone} size="sm" />;
      },
    },
    {
      key: "bill",
      label: "In",
      width: 64,
      render: (row) => <AdminTableAction label="In" onPress={() => onStockIn?.(row)} />,
    },
  ];
}

export function buildUserTableColumns({ onToggleAdmin, onToggleRider, onOrders, onDelete, busyId }) {
  return [
    {
      key: "name",
      label: "Person",
      flex: 1.2,
      strong: true,
      render: (row) => row.name || "Unnamed",
    },
    { key: "email", label: "Email", flex: 1.3, render: (row) => row.email || "—" },
    {
      key: "role",
      label: "Role",
      flex: 0.9,
      render: (row) => {
        const bits = [row.isAdmin ? "Admin" : "Customer"];
        if (row.isDeliveryPartner) bits.push("Rider");
        return bits.join(" · ");
      },
    },
    {
      key: "joined",
      label: "Joined",
      flex: 0.7,
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—",
    },
    {
      key: "actions",
      label: "",
      flex: 1.4,
      align: "right",
      render: (row) => {
        const busy = busyId === row._id;
        return (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
            <AdminTableAction
              label={row.isDeliveryPartner ? "Unride" : "Rider"}
              onPress={() => !busy && onToggleRider?.(row)}
            />
            <AdminTableAction
              label={row.isAdmin ? "Customer" : "Admin"}
              onPress={() => !busy && onToggleAdmin?.(row)}
            />
            <AdminTableAction label="Orders" onPress={() => onOrders?.(row)} />
            <AdminTableAction label="Delete" onPress={() => !busy && onDelete?.(row)} />
          </View>
        );
      },
    },
  ];
}
