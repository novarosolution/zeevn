import { Platform } from "react-native";
import { printInvoiceOnWeb } from "./printInvoiceWeb";

/** Print or share a full HTML document — web print dialog, phone PDF share. */
export async function printAdminHtml(html) {
  if (Platform.OS === "web") {
    printInvoiceOnWeb(html);
    return;
  }
  const Print = await import("expo-print");
  const Sharing = await import("expo-sharing");
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { UTI: ".pdf", mimeType: "application/pdf" });
  }
}
