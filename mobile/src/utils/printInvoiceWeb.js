/** Open a print-ready invoice tab on web (full HTML document — no double-wrap). */
export function printInvoiceOnWeb(htmlDocument) {
  if (typeof window === "undefined") {
    throw new Error("Web print is not available in this environment.");
  }

  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    throw new Error("Popup blocked by browser. Allow popups to download invoice.");
  }

  const withPrintHook = htmlDocument.replace(
    "</body>",
    `<script>
      window.onload = function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 280);
      };
    </script></body>`
  );

  popup.document.open();
  popup.document.write(withPrintHook);
  popup.document.close();
}
