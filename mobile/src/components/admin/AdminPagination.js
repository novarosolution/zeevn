import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";
import AdminButton from "./AdminButton";
import AdminSelect from "./AdminSelect";

/** "Showing 26–50 of 66 orders" with page-size and previous / next controls. */
export default function AdminPagination({ page, pages, total, pageSize, onPage, onPageSize, pageSizes = [25, 50, 100], noun = "orders", style }) {
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createStyles(chrome), [chrome]);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <View style={[styles.row, compact && styles.rowCompact, style]}>
      <Text style={styles.range}>{total === 0 ? `No ${noun}` : `Showing ${from}–${to} of ${total} ${noun}`}</Text>
      <View style={styles.controls}>
        {onPageSize ? (
          <AdminSelect
            compact
            value={pageSize}
            onChange={onPageSize}
            options={pageSizes.map((n) => ({ value: n, label: `${n} per page` }))}
            minMenuWidth={140}
            align="right"
            style={styles.sizeSelect}
          />
        ) : null}
        <AdminButton icon="chevron-back" variant="secondary" size="sm" disabled={page <= 1} onPress={() => onPage?.(page - 1)} title="Previous page" />
        <Text style={styles.page}>
          {page} / {pages}
        </Text>
        <AdminButton icon="chevron-forward" variant="secondary" size="sm" disabled={page >= pages} onPress={() => onPage?.(page + 1)} title="Next page" />
      </View>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingVertical: 4 },
    rowCompact: { flexDirection: "column", alignItems: "stretch" },
    range: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: fonts.medium },
    controls: { flexDirection: "row", alignItems: "center", gap: 8 },
    sizeSelect: { width: 132 },
    page: { minWidth: 44, textAlign: "center", fontSize: 12.5, color: chrome.ink, fontFamily: fonts.semibold },
  });
}
