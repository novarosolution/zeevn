import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts, icon } from "../../theme/tokens";
import OpsPagination from "./OpsPagination";

/**
 * Dense data table — web-first row hover; stacks as labeled rows on native.
 */
export default function OpsDataTable({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  emptyMessage = "No rows to show.",
  onRowPress,
}) {
  const { semanticPalette, TYPE, SPACING, RADII } = useTheme();
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    const rows = [...(data || [])];
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    rows.sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : col.render(a);
      const bv = col.sortValue ? col.sortValue(b) : col.render(b);
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [columns, data, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  if (!sorted.length) {
    return (
      <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkMuted, padding: SPACING.lg }}>
        {emptyMessage}
      </Text>
    );
  }

  const header = (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: semanticPalette.lineSoft,
        backgroundColor: semanticPalette.surface,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
      }}
    >
      {columns.map((col) => (
        <Pressable
          key={col.key}
          disabled={!col.sortable}
          onPress={() => col.sortable && toggleSort(col.key)}
          style={[{ flex: col.flex ?? 1, minWidth: col.minWidth ?? 0 }, col.sortable && Platform.OS === "web" ? { cursor: "pointer" } : null]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: TYPE.micro.fontSize,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: semanticPalette.inkMuted,
              }}
            >
              {col.label}
            </Text>
            {col.sortable && sortKey === col.key ? (
              <Ionicons name={sortDir === "asc" ? "chevron-up" : "chevron-down"} size={12} color={semanticPalette.inkMuted} />
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View
      style={{
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: semanticPalette.line,
        borderRadius: RADII.md,
        overflow: "hidden",
        backgroundColor: semanticPalette.surface,
      }}
    >
      {header}
      {pageRows.map((row, idx) => {
        const rowKey = keyExtractor(row);
        const rowStyle = [
          {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
            borderTopColor: semanticPalette.lineSoft,
            backgroundColor: semanticPalette.surface,
          },
        ];
        const cells = columns.map((col) => (
          <View key={`${rowKey}-${col.key}`} style={{ flex: col.flex ?? 1, minWidth: col.minWidth ?? 0 }}>
            {typeof col.render === "function" ? (
              col.render(row)
            ) : (
              <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
                {String(row[col.key] ?? "")}
              </Text>
            )}
          </View>
        ));
        if (onRowPress) {
          return (
            <Pressable
              key={rowKey}
              onPress={() => onRowPress(row)}
              style={({ hovered, pressed }) => [
                ...rowStyle,
                hovered && Platform.OS === "web" ? { backgroundColor: semanticPalette.surfaceAlt } : null,
                pressed ? { opacity: 0.9 } : null,
              ]}
            >
              {cells}
            </Pressable>
          );
        }
        return (
          <View key={rowKey} style={rowStyle}>
            {cells}
          </View>
        );
      })}
      {pageCount > 1 ? (
        <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
          <OpsPagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            totalLabel={`${sorted.length} rows`}
          />
        </View>
      ) : null}
    </View>
  );
}
