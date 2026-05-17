/**
 * Profile completeness for account overview meter.
 */
export function computeProfileCompleteness({ user, prefs, hasSavedAddress = false }) {
  const checks = [
    { key: "name", label: "Full name", filled: Boolean(String(user?.name || "").trim()), route: "AccountProfile" },
    { key: "phone", label: "Phone number", filled: Boolean(String(user?.phone || "").trim()), route: "AccountProfile" },
    {
      key: "email",
      label: "Verify email",
      filled:
        user?.emailVerified === true ||
        user?.isEmailVerified === true ||
        user?.email_verified === true,
      route: "AccountProfile",
    },
    { key: "avatar", label: "Profile photo", filled: Boolean(String(user?.avatar || "").trim()), route: "AccountProfile" },
    {
      key: "address",
      label: "Delivery address",
      filled: hasSavedAddress || Boolean(String(user?.defaultAddress?.line1 || "").trim()),
      route: "Addresses",
    },
    {
      key: "display",
      label: "Display name",
      filled: Boolean(String(prefs?.displayName || "").trim()),
      route: "AccountProfile",
      optional: true,
    },
  ];

  const required = checks.filter((c) => !c.optional);
  const filledCount = required.filter((c) => c.filled).length;
  const percent = required.length ? Math.round((filledCount / required.length) * 100) : 0;
  const missing = required.filter((c) => !c.filled);

  return { percent, missing, checks: required };
}
