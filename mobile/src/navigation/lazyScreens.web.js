/**
 * Web: eager screen imports — Metro async chunks are unreliable in dev/export.
 * Boot split still applies via screenRegistryCore.web.js (Home + auth only in core).
 */
export * from "./screenRegistryCustomer";
export * from "./screenRegistryHeavy";
