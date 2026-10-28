import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/** One CSV cell. A leading = + - @ is prefixed with ' so Excel cannot run a customer-typed value as a formula. */
function csvCell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function csvFilename(name) {
  return `zeevan-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
}

/** Download on web, share sheet on phones. The BOM keeps ₹ and non-English names readable in Excel. */
export async function saveCsv(filename, csv, dialogTitle = "Export CSV") {
  const body = `﻿${csv}`;

  if (Platform.OS === "web") {
    if (typeof document === "undefined") return;
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error("Cache directory is not available.");
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, body, { encoding: "utf8" });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle });
}
