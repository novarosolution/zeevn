import React, { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { ADMIN_GATE, ADMIN_SCREEN_COPY } from "../../content/adminContent";
import SectionReveal from "../../components/motion/SectionReveal";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBadge from "../../components/admin/AdminBadge";
import AdminButton from "../../components/admin/AdminButton";
import AdminInput from "../../components/admin/AdminInput";
import AdminSection, { AdminSettingRow } from "../../components/admin/AdminSection";
import AdminSelect from "../../components/admin/AdminSelect";
import AdminSwitch from "../../components/admin/AdminSwitch";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import SkeletonBlock from "../../components/ui/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { fetchAdminStoreOps, updateAdminStoreOps } from "../../services/adminService";
import { refreshAdminDesk } from "../../services/adminDeskStore";
import { adminGatePanel, adminShellContent, useAdminChrome, useAdminCompactLayout } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { customerScrollFill } from "../../theme/screenLayout";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { fonts, spacing } from "../../theme/tokens";
import { formatShortDateTime } from "../../utils/adminFormat";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "UTC", label: "UTC" },
];
const DEFAULT_CLOSED_MESSAGE = "We are not taking orders right now. Please check back soon.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const clone = (value) => JSON.parse(JSON.stringify(value));
const minutesOf = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const formatTimeInput = (text) => {
  const digits = String(text).replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

/** Server shape → form shape (numbers become strings so half-typed values like "12." survive). */
function toDraft(res) {
  return {
    ops: {
      acceptingOrders: res.ops.acceptingOrders,
      closedMessage: res.ops.closedMessage || "",
      reopenAt: res.ops.reopenAt || null,
      autoSchedule: res.ops.autoSchedule,
      timezone: res.ops.timezone,
      hours: clone(res.ops.hours),
      minOrderAmount: String(res.ops.minOrderAmount || 0),
      codEnabled: res.ops.codEnabled,
      onlinePaymentsEnabled: res.ops.onlinePaymentsEnabled,
      maxCodAmount: String(res.ops.maxCodAmount || 0),
    },
    contact: { ...res.contact },
    business: { ...res.business, defaultTaxPercent: String(res.business.defaultTaxPercent || 0) },
  };
}

function toPayload(draft) {
  return {
    ops: {
      ...draft.ops,
      minOrderAmount: Number(draft.ops.minOrderAmount) || 0,
      maxCodAmount: Number(draft.ops.maxCodAmount) || 0,
    },
    contact: draft.contact,
    business: { ...draft.business, defaultTaxPercent: Number(draft.business.defaultTaxPercent) || 0 },
  };
}

/** Field-level problems, keyed so each input can show its own message. Empty object = fine to save. */
function validate(draft) {
  const errors = {};
  const { ops, contact, business } = draft;
  const min = Number(ops.minOrderAmount);
  if (ops.minOrderAmount !== "" && (!Number.isFinite(min) || min < 0 || min > 100000)) errors.minOrder = "Enter an amount between 0 and 1,00,000.";
  const cod = Number(ops.maxCodAmount);
  if (ops.maxCodAmount !== "" && (!Number.isFinite(cod) || cod < 0 || cod > 1000000)) errors.maxCod = "Enter an amount between 0 and 10,00,000.";
  if (!ops.codEnabled && !ops.onlinePaymentsEnabled) errors.payments = "Keep at least one payment method on, or nobody can check out.";
  if (ops.closedMessage.length > 200) errors.closedMessage = "The message is at most 200 characters.";
  errors.hours = {};
  for (const row of ops.hours) {
    if (row.closed) continue;
    if (!HHMM_RE.test(row.open) || !HHMM_RE.test(row.close)) errors.hours[row.day] = "A time must look like 09:00.";
    else if (minutesOf(row.close) <= minutesOf(row.open)) errors.hours[row.day] = "Close must be after open.";
  }
  if (!Object.keys(errors.hours).length) delete errors.hours;
  if (contact.supportEmail && !EMAIL_RE.test(contact.supportEmail)) errors.email = "That email doesn't look right.";
  if (business.gstin && !/^[0-9A-Za-z]{15}$/.test(business.gstin)) errors.gstin = "GSTIN is 15 letters and digits.";
  const tax = Number(business.defaultTaxPercent);
  if (business.defaultTaxPercent !== "" && (!Number.isFinite(tax) || tax < 0 || tax > 28)) errors.tax = "Enter a rate between 0 and 28.";
  return errors;
}

function tzOffsetMinutes(date, timeZone) {
  const label =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value || "GMT";
  const match = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(label);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
}

function zonedInstant(dateKey, hhmm, timeZone) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const [hour, minute] = String(hhmm).split(":").map(Number);
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  const guess = new Date(naiveUtc - tzOffsetMinutes(new Date(naiveUtc), timeZone) * 60000);
  return new Date(naiveUtc - tzOffsetMinutes(guess, timeZone) * 60000);
}

function todayKey(timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function addDateKey(key, days) {
  const [year, month, day] = String(key).split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function reopenPresets(timeZone) {
  return [
    { label: "In 1 hour", at: new Date(Date.now() + 3600 * 1000) },
    { label: "In 3 hours", at: new Date(Date.now() + 3 * 3600 * 1000) },
    { label: "Tomorrow 9 am", at: zonedInstant(addDateKey(todayKey(timeZone || "Asia/Kolkata"), 1), "09:00", timeZone || "Asia/Kolkata") },
  ];
}

function fieldFromServer(message) {
  const text = String(message || "");
  if (/email/i.test(text)) return { email: text };
  if (/GSTIN/i.test(text)) return { gstin: text };
  if (/rate between 0 and 28/i.test(text)) return { tax: text };
  if (/payment method/i.test(text)) return { payments: text };
  if (/time must look|Close must/i.test(text)) return { hoursServer: text };
  if (/200 characters/i.test(text)) return { closedMessage: text };
  if (/Minimum order|1,00,000|100000/i.test(text)) return { minOrder: text };
  if (/cash on delivery|10,00,000|1000000/i.test(text)) return { maxCod: text };
  return {};
}

export default function AdminSettingsScreen({ navigation, route }) {
  const { user } = useAuth();
  const toast = useToast();
  const { colors: c, shadowPremium, isDark } = useTheme();
  const chrome = useAdminChrome();
  const compact = useAdminCompactLayout();
  const { useSidebarLayout } = useKankregLayout();
  const isAdmin = Boolean(user?.isAdmin);
  const styles = useMemo(() => createStyles(chrome, c, shadowPremium), [chrome, c, shadowPremium]);

  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pickDate, setPickDate] = useState("");
  const [pickTime, setPickTime] = useState("09:00");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminStoreOps();
      const next = toDraft(res);
      setSaved(next);
      setDraft(clone(next));
      setStatus(res.status);
      setError("");
    } catch (err) {
      setError(err?.message || "Couldn't load the settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const dirty = useMemo(() => Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved)), [draft, saved]);
  const [serverFields, setServerFields] = useState({});
  const localErrors = useMemo(() => (draft ? validate(draft) : {}), [draft]);
  const errors = useMemo(() => ({ ...localErrors, ...serverFields }), [localErrors, serverFields]);

  const patchOps = (changes) => {
    setServerFields({});
    setDraft((d) => ({ ...d, ops: { ...d.ops, ...changes } }));
  };
  const patchContact = (changes) => {
    setServerFields({});
    setDraft((d) => ({ ...d, contact: { ...d.contact, ...changes } }));
  };
  const patchBusiness = (changes) => {
    setServerFields({});
    setDraft((d) => ({ ...d, business: { ...d.business, ...changes } }));
  };
  const patchHour = (day, changes) => {
    setServerFields({});
    setDraft((d) => ({ ...d, ops: { ...d.ops, hours: d.ops.hours.map((row) => (row.day === day ? { ...row, ...changes } : row)) } }));
  };
  const copyMondayToAll = () =>
    setDraft((d) => {
      const monday = d.ops.hours.find((row) => row.day === 1);
      return { ...d, ops: { ...d.ops, hours: d.ops.hours.map((row) => ({ ...row, open: monday.open, close: monday.close, closed: monday.closed })) } };
    });

  const applyChosenTime = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickDate) || !HHMM_RE.test(pickTime)) {
      setError("Pick a date as YYYY-MM-DD and a time like 09:00.");
      return;
    }
    setError("");
    patchOps({ reopenAt: zonedInstant(pickDate, pickTime, draft?.ops?.timezone || "Asia/Kolkata").toISOString() });
  };

  const save = async () => {
    if (!draft || Object.keys(localErrors).length || saving) return;
    setSaving(true);
    setError("");
    setServerFields({});
    try {
      const res = await updateAdminStoreOps(null, toPayload(draft));
      const next = toDraft(res);
      setSaved(next);
      setDraft(clone(next));
      setStatus(res.status);
      toast.toastSuccess("Settings saved.");
      refreshAdminDesk({ force: true });
    } catch (err) {
      const message = err?.message || "Couldn't save the settings.";
      setError(message);
      setServerFields(fieldFromServer(message));
    } finally {
      setSaving(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage scrollVariant="inner" showFooter={false} style={customerScrollFill}>
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner severity="warning" title={ADMIN_GATE.title} message="This account does not have admin privileges." />
              <AdminButton label={ADMIN_GATE.backHome} icon="home-outline" variant="primary" size="md" onPress={() => navigation.navigate("Home")} style={styles.gateCta} />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  const ops = draft?.ops;
  const liveTone = status ? (status.open ? "green" : status.reason === "paused" ? "red" : "gold") : "neutral";
  const liveLabel = status ? (status.open ? "Open" : "Closed") : "";
  const paused = ops && !ops.acceptingOrders;
  const customerMessage = ops ? `${ops.closedMessage.trim() || DEFAULT_CLOSED_MESSAGE}${ops.reopenAt ? ` Orders reopen ${formatShortDateTime(ops.reopenAt)}.` : ""}` : "";
  const lastPaymentOn = ops && (ops.codEnabled ? !ops.onlinePaymentsEnabled : ops.onlinePaymentsEnabled);

  return (
    <AdminScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <KankregScrollPage scrollVariant="admin" showFooter={false} style={customerScrollFill} keyboardShouldPersistTaps="handled">
          <KankregAdminShell
            navigation={navigation}
            route={route}
            title={ADMIN_SCREEN_COPY.settings.title}
            subtitle={ADMIN_SCREEN_COPY.settings.subtitle}
            headerRight={<AdminButton label="Reload" icon="refresh-outline" variant="soft" size="sm" onPress={load} />}
          >
            <View style={styles.panel}>
              <AdminAlerts error={error} onCloseError={() => setError("")} />

              {loading && !draft ? (
                <View style={{ gap: 14 }}>
                  <SkeletonBlock width="100%" height={180} rounded="lg" />
                  <SkeletonBlock width="100%" height={260} rounded="lg" />
                </View>
              ) : null}

              {draft ? (
                <>
                  {status ? (
                    <View style={[styles.statusCard, { backgroundColor: getAdminTone(liveTone, isDark).bg, borderColor: getAdminTone(liveTone, isDark).border }]}>
                      <AdminBadge label={liveLabel} tone={liveTone} dot />
                      <Text style={styles.statusReason}>{status.message || (status.open ? "Taking orders." : "Checkout is closed.")}</Text>
                    </View>
                  ) : null}

                  <AdminSection
                    icon="storefront-outline"
                    title="Orders"
                    description="Pause the shop when you can't deliver — customers see your message instead of a broken checkout."
                  >
                    <AdminSettingRow
                      title="Accepting orders"
                      description={paused ? "Off stops checkout. Customers see the closed message." : "Customers can check out normally."}
                      right={<AdminSwitch value={ops.acceptingOrders} onChange={(on) => patchOps({ acceptingOrders: on, ...(on ? { reopenAt: null } : null) })} tone={ops.acceptingOrders ? "green" : "red"} accessibilityLabel="Accepting orders" />}
                    />
                    <AdminSettingRow title="What customers see when closed" description="Shown at checkout and on the cart while orders are paused or outside opening hours." last={!paused}>
                      <AdminInput
                        value={ops.closedMessage}
                        onChangeText={(text) => patchOps({ closedMessage: text })}
                        placeholder={DEFAULT_CLOSED_MESSAGE}
                        multiline
                        numberOfLines={2}
                        maxLength={200}
                        autoCapitalize="sentences"
                        error={errors.closedMessage}
                      />
                    </AdminSettingRow>
                    {paused ? (
                      <AdminSettingRow
                        last
                        title="Reopen automatically"
                        description={ops.reopenAt ? `Orders switch back on ${formatShortDateTime(ops.reopenAt)}.` : "Optional — stay paused until you switch it back on, or pick a time."}
                      >
                        <View style={styles.chipRow}>
                          {reopenPresets(ops.timezone).map((preset) => (
                            <AdminButton key={preset.label} label={preset.label} size="xs" variant="soft" onPress={() => patchOps({ reopenAt: preset.at.toISOString() })} />
                          ))}
                          {ops.reopenAt ? <AdminButton label="Stay paused" size="xs" variant="ghost" icon="close" onPress={() => patchOps({ reopenAt: null })} /> : null}
                        </View>
                        <View style={[styles.twoCol, compact && styles.twoColCompact]}>
                          <AdminInput label="Date" value={pickDate} onChangeText={setPickDate} placeholder="YYYY-MM-DD" style={styles.col} />
                          <AdminInput label="Time" value={pickTime} onChangeText={(t) => setPickTime(formatTimeInput(t))} placeholder="09:00" maxLength={5} style={styles.col} />
                        </View>
                        <AdminButton label="Use this time" size="sm" variant="soft" onPress={applyChosenTime} />
                        <View style={[styles.preview, { backgroundColor: getAdminTone("red", isDark).bg, borderColor: getAdminTone("red", isDark).border }]}>
                          <Text style={[styles.previewLabel, { color: getAdminTone("red", isDark).fg }]}>Customers will see</Text>
                          <Text style={styles.previewText}>{customerMessage}</Text>
                        </View>
                      </AdminSettingRow>
                    ) : null}
                  </AdminSection>

                  {/* hours */}
                  <AdminSection
                    icon="time-outline"
                    title="Opening hours"
                    description="Let the shop open and close by itself. Outside these hours checkout shows your closed message. The counter follows these same shop hours — there is no second clock."
                  >
                    <AdminSettingRow
                      title="Follow opening hours"
                      description={ops.autoSchedule ? "Checkout is also closed outside today's open and close." : "Off — the shop is open whenever it isn't paused."}
                      right={<AdminSwitch value={ops.autoSchedule} onChange={(on) => patchOps({ autoSchedule: on })} accessibilityLabel="Follow opening hours" />}
                    />
                    <AdminSettingRow title="Time zone" description="The day and the clock use this zone. Default Asia/Kolkata.">
                      <AdminSelect value={ops.timezone} onChange={(tz) => patchOps({ timezone: tz })} options={TIMEZONES} icon="globe-outline" style={{ maxWidth: 280 }} />
                    </AdminSettingRow>
                    <AdminSettingRow last title="Weekly hours" right={<AdminButton label="Copy Monday to all" size="xs" variant="soft" icon="copy-outline" onPress={copyMondayToAll} />}>
                      <View style={styles.hours}>
                        {DAY_ORDER.map((day) => {
                          const row = ops.hours.find((r) => r.day === day);
                          return (
                            <View key={day} style={[styles.hourRow, compact && styles.hourRowCompact]}>
                              <Text style={styles.dayName}>{DAY_NAMES[day]}</Text>
                              <View style={styles.dayToggle}>
                                <AdminSwitch size="sm" value={Boolean(row.closed)} onChange={(on) => patchHour(day, { closed: on })} tone="red" accessibilityLabel={`${DAY_NAMES[day]} closed`} />
                                <Text style={styles.dayState}>{row.closed ? "Closed" : "Open"}</Text>
                              </View>
                              {row.closed ? (
                                <View style={{ flex: 1 }} />
                              ) : (
                                <View style={styles.times}>
                                  <AdminInput value={row.open} onChangeText={(t) => patchHour(day, { open: formatTimeInput(t) })} placeholder="09:00" maxLength={5} align="right" style={styles.timeField} />
                                  <Text style={styles.to}>to</Text>
                                  <AdminInput value={row.close} onChangeText={(t) => patchHour(day, { close: formatTimeInput(t) })} placeholder="21:00" maxLength={5} align="right" style={styles.timeField} />
                                </View>
                              )}
                              {errors.hours?.[day] ? <Text style={styles.rowError}>{errors.hours[day]}</Text> : null}
                            </View>
                          );
                        })}
                      </View>
                      {errors.hoursServer ? <Text style={styles.rowError}>{errors.hoursServer}</Text> : null}
                    </AdminSettingRow>
                  </AdminSection>

                  {/* checkout rules */}
                  <AdminSection icon="cart-outline" title="Checkout rules" description="What a cart must meet before it can be ordered, and how customers may pay.">
                    <AdminSettingRow title="Minimum order" description="Carts below this items total can't check out. Use 0 for no minimum.">
                      <AdminInput value={ops.minOrderAmount} onChangeText={(t) => patchOps({ minOrderAmount: t })} numeric prefix="₹" placeholder="0" error={errors.minOrder} style={styles.moneyField} />
                    </AdminSettingRow>
                    <AdminSettingRow
                      title="Cash on delivery"
                      description="Customers pay the rider at the door."
                      right={<AdminSwitch value={ops.codEnabled} onChange={(on) => patchOps({ codEnabled: on })} disabled={ops.codEnabled && lastPaymentOn} accessibilityLabel="Cash on delivery" />}
                    >
                      {ops.codEnabled ? (
                        <AdminInput
                          label="Largest cash order"
                          value={ops.maxCodAmount}
                          onChangeText={(t) => patchOps({ maxCodAmount: t })}
                          numeric
                          prefix="₹"
                          placeholder="0"
                          hint="Bigger orders must be paid online. 0 means no limit."
                          error={errors.maxCod}
                          style={styles.moneyField}
                        />
                      ) : null}
                    </AdminSettingRow>
                    <AdminSettingRow
                      last
                      title="Online & UPI payments"
                      description="Customers pay before the order is accepted."
                      right={<AdminSwitch value={ops.onlinePaymentsEnabled} onChange={(on) => patchOps({ onlinePaymentsEnabled: on })} disabled={ops.onlinePaymentsEnabled && lastPaymentOn} accessibilityLabel="Online payments" />}
                    >
                      {errors.payments ? <Text style={styles.rowError}>{errors.payments}</Text> : lastPaymentOn ? <Text style={styles.hintText}>At least one payment method has to stay on.</Text> : null}
                    </AdminSettingRow>
                  </AdminSection>

                  {/* contact */}
                  <AdminSection icon="call-outline" title="Contact & support" description="Where customers reach you. Shown in help screens and on invoices.">
                    <AdminSettingRow title="Support email">
                      <AdminInput value={draft.contact.supportEmail} onChangeText={(t) => patchContact({ supportEmail: t })} placeholder="care@yourshop.com" icon="mail-outline" error={errors.email} inputMode="email" />
                    </AdminSettingRow>
                    <AdminSettingRow title="Phone & WhatsApp">
                      <View style={[styles.twoCol, compact && styles.twoColCompact]}>
                        <AdminInput label="Support phone" value={draft.contact.supportPhone} onChangeText={(t) => patchContact({ supportPhone: t })} placeholder="+91 90000 00000" icon="call-outline" style={styles.col} maxLength={30} />
                        <AdminInput label="WhatsApp" value={draft.contact.whatsapp} onChangeText={(t) => patchContact({ whatsapp: t })} placeholder="+91 90000 00000" icon="logo-whatsapp" style={styles.col} maxLength={30} />
                      </View>
                    </AdminSettingRow>
                    <AdminSettingRow last title="Shop address">
                      <AdminInput value={draft.contact.address} onChangeText={(t) => patchContact({ address: t })} placeholder="Shop name, street, city, pincode" multiline numberOfLines={2} maxLength={240} autoCapitalize="sentences" />
                    </AdminSettingRow>
                  </AdminSection>

                  {/* business */}
                  <AdminSection icon="document-text-outline" title="Business & invoices" description="Printed on every invoice. Leave blank what doesn't apply to you.">
                    <AdminSettingRow title="Registered business name">
                      <AdminInput value={draft.business.legalName} onChangeText={(t) => patchBusiness({ legalName: t })} placeholder="Zeevan Farms Pvt. Ltd." maxLength={120} autoCapitalize="words" />
                    </AdminSettingRow>
                    <AdminSettingRow title="Tax details">
                      <View style={[styles.twoCol, compact && styles.twoColCompact]}>
                        <AdminInput
                          label="GSTIN"
                          value={draft.business.gstin}
                          onChangeText={(t) => patchBusiness({ gstin: t.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15) })}
                          placeholder="24ABCDE1234F1Z5"
                          maxLength={15}
                          error={errors.gstin}
                          style={styles.col}
                        />
                        <AdminInput label="Default tax" value={draft.business.defaultTaxPercent} onChangeText={(t) => patchBusiness({ defaultTaxPercent: t })} numeric suffix="%" placeholder="0" hint="Starting rate for new invoices." error={errors.tax} style={styles.col} />
                      </View>
                    </AdminSettingRow>
                    <AdminSettingRow last title="Invoice footer" description="A thank-you line or return policy printed at the bottom.">
                      <AdminInput value={draft.business.invoiceFooter} onChangeText={(t) => patchBusiness({ invoiceFooter: t })} placeholder="Thank you for shopping with Zeevan." multiline numberOfLines={2} maxLength={300} autoCapitalize="sentences" />
                    </AdminSettingRow>
                  </AdminSection>

                  {/* delivery pointer */}
                  <AdminSection icon="cube-outline" title="Stock & till" description="One shop, two piles. Walk-in bills sell floor stock only. If the phone is offline, the till saves a draft and Store selling manages it.">
                    <AdminSettingRow title="Online vs shop floor" description="Website sales take from online stock. The counter takes from floor stock. Transfer between them so a walk-in never steals a web order." right={<AdminButton label="Inventory" icon="cube-outline" variant="soft" size="sm" onPress={() => navigation.navigate("AdminInventory")} />} />
                    <AdminSettingRow last title="Store selling" description="Manage live shop bills and any sale saved on this phone while offline. Reprint, void, sync, or print the day book. The till still rings the sale." right={<AdminButton label="Open" icon="receipt-outline" variant="soft" size="sm" onPress={() => navigation.navigate("AdminStoreSelling")} />} />
                  </AdminSection>
                  <AdminSection icon="bicycle-outline" title="Delivery" description="Areas, fees, riders and delivery times are managed together on the Zones page.">
                    <AdminSettingRow last title="Zones, fees & riders" description="Draw areas on the map, set delivery fees and free-delivery levels, and choose who delivers where." right={<AdminButton label="Open Zones" icon="map-outline" variant="primary" size="sm" onPress={() => navigation.navigate("AdminDelivery")} />} />
                  </AdminSection>
                </>
              ) : null}
            </View>
          </KankregAdminShell>
        </KankregScrollPage>
      </KeyboardAvoidingView>

      {dirty ? (
        <View style={[styles.saveDock, useSidebarLayout && Platform.OS === "web" && styles.saveDockSidebar]} pointerEvents="box-none">
          <View style={styles.saveBar}>
            <View style={styles.saveCopy}>
              <View style={styles.unsavedDot} />
              <Text style={styles.saveText}>{Object.keys(localErrors).length ? "Fix the highlighted fields to save." : "You have unsaved changes."}</Text>
            </View>
            <AdminButton
              label="Discard"
              variant="ghost"
              size="md"
              onPress={() => {
                setDraft(clone(saved));
                setServerFields({});
                setError("");
              }}
              disabled={saving}
            />
            <AdminButton label="Save changes" icon="checkmark" variant="primary" size="md" loading={saving} disabled={Object.keys(localErrors).length > 0} onPress={save} />
          </View>
        </View>
      ) : null}
    </AdminScreenShell>
  );
}

function createStyles(chrome, c, shadowPremium) {
  return StyleSheet.create({
    screen: { flex: 1, width: "100%", alignSelf: "center", maxWidth: "100%" },
    panel: { ...adminShellContent(), gap: spacing.md, maxWidth: 1080, paddingBottom: 96 },
    gatePanel: adminGatePanel(c, shadowPremium),
    gateCta: { marginTop: spacing.md, alignSelf: "flex-start" },
    statusCard: { padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
    statusReason: { fontSize: 13.5, lineHeight: 20, color: chrome.ink, fontFamily: fonts.medium },
    chipRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
    preview: { padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
    previewLabel: { fontSize: 10.5, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.semibold },
    previewText: { fontSize: 13, lineHeight: 19, color: chrome.ink, fontFamily: fonts.regular },
    hours: { gap: 2 },
    hourRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: chrome.lineSoft },
    hourRowCompact: { rowGap: 6 },
    dayName: { width: 96, fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
    dayToggle: { width: 84, flexDirection: "row", alignItems: "center", gap: 8 },
    dayState: { fontSize: 12.5, color: chrome.inkSoft, fontFamily: fonts.medium },
    times: { flexDirection: "row", alignItems: "center", gap: 8 },
    timeField: { width: 92 },
    to: { fontSize: 12.5, color: chrome.inkFaint, fontFamily: fonts.regular },
    rowError: { fontSize: 11.5, color: chrome.danger, fontFamily: fonts.medium },
    hintText: { fontSize: 12, color: chrome.inkFaint, fontFamily: fonts.regular },
    moneyField: { maxWidth: 240 },
    twoCol: { flexDirection: "row", gap: 12 },
    twoColCompact: { flexDirection: "column" },
    col: { flex: 1, minWidth: 0 },
    saveDock: {
      position: Platform.OS === "web" ? "fixed" : "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      padding: 16,
      zIndex: 20,
    },
    saveDockSidebar: { left: 248 },
    saveBar: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: chrome.card,
      borderWidth: 1,
      borderColor: chrome.goldDeep,
      maxWidth: 680,
      width: "100%",
      ...Platform.select({ web: { boxShadow: "0 18px 44px -12px rgba(20,24,16,0.4), 0 2px 8px rgba(20,24,16,0.08)" }, default: {} }),
    },
    saveCopy: { flex: 1, minWidth: 180, flexDirection: "row", alignItems: "center", gap: 8 },
    unsavedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: chrome.goldDeep },
    saveText: { fontSize: 13.5, color: chrome.ink, fontFamily: fonts.semibold },
  });
}
