import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AccountLayout from "../../components/account/AccountLayout";
import ProfileDeleteAccountModal from "../../components/account/profile/ProfileDeleteAccountModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import ProgressRing from "../../components/ui/ProgressRing";
import PremiumSwitch from "../../components/ui/PremiumSwitch";
import SectionHeader from "../../components/ui/SectionHeader";
import Toast from "../../components/ui/Toast";
import AccountSaveButton from "../../components/account/interactions/AccountSaveButton";
import BrassCheckPulse from "../../components/account/interactions/BrassCheckPulse";
import EmailVerifyBanner from "../../components/account/EmailVerifyBanner";
import ProfileConflictModal from "../../components/account/profile/ProfileConflictModal";
import { pickAvatarPhotoOption } from "../../components/account/profile/AvatarPhotoOptionsSheet";
import FormAlert from "../../components/ui/FormAlert";
import { hapticAvatarSuccess, hapticSaveError, hapticSaveSuccess } from "../../utils/accountHaptics";
import { validateAvatarAsset } from "../../utils/avatarUploadValidation";
import {
  clearPendingProfileSave,
  loadPendingProfileSave,
  queuePendingProfileSave,
  shouldQueueProfileSave,
} from "../../utils/profileOfflineQueue";
import { headingA11yProps } from "../../utils/a11y";
import NetInfo from "@react-native-community/netinfo";
import { ACCOUNT_PROFILE_SCREEN, fillPlaceholders } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FONT_DISPLAY_SEMI } from "../../theme/customerAlchemy";
import { fonts } from "../../theme/tokens";
import { clearBiometricCredentials, getBiometricLabel, isBiometricLoginAvailable } from "../../utils/biometricAuth";
import {
  DEMO_SAVED_CARDS_KEY,
  loadProfilePrefs,
  saveProfilePrefs,
} from "../../utils/accountProfilePrefs";
import {
  changePasswordRequest,
  fetchActiveSessions,
  fetchMyOrders,
  fetchUserProfile,
  requestAccountDeletion,
  requestEmailChange,
  requestPhoneOtp,
  revokeSessionRequest,
  sendVerificationEmailRequest,
  updateUserProfile,
  uploadUserAvatar,
  verifyPhoneOtp,
} from "../../services/userService";
import { resetNavigationToHome } from "../../navigation/resetToHome";
import AccountSignOutDialog from "../../components/account/shared/AccountSignOutDialog";
import useModalA11y from "../../hooks/useModalA11y";

const copy = ACCOUNT_PROFILE_SCREEN;

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function formatMemberSince(date) {
  if (!date) return { month: "—", year: "—" };
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return { month: "—", year: "—" };
  return {
    month: d.toLocaleString(undefined, { month: "long" }),
    year: String(d.getFullYear()),
  };
}

function formatPasswordAgo(iso) {
  if (!iso) return copy.security.passwordNever;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return copy.security.passwordNever;
  const months = Math.max(0, Math.floor((Date.now() - d.getTime()) / (30 * 24 * 60 * 60 * 1000)));
  if (months < 1) return "Last changed recently";
  if (months === 1) return fillPlaceholders(copy.security.passwordLastChangedTemplate, { time: "1 month ago" });
  return fillPlaceholders(copy.security.passwordLastChangedTemplate, { time: `${months} months ago` });
}

function isVerified(user, field) {
  if (field === "email") {
    return user?.emailVerified === true || user?.isEmailVerified === true || user?.email_verified === true;
  }
  return user?.phoneVerified === true || user?.isPhoneVerified === true || user?.phone_verified === true;
}

function buildSnapshot({ name, displayName, phone, dob, gender }) {
  return JSON.stringify({
    name: String(name || "").trim(),
    displayName: String(displayName || "").trim(),
    phone: String(phone || "").trim(),
    dob: String(dob || "").trim(),
    gender: String(gender || "").trim(),
  });
}

function SecurityRow({ label, detail, detailColor, children, first }) {
  const { semanticPalette, SPACING } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: SPACING.md,
        paddingVertical: 16,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: semanticPalette.lineSoft,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.ink }}>{label}</Text>
        {detail ? (
          <Text
            style={{
              marginTop: 4,
              fontFamily: fonts.regular,
              fontSize: 12,
              color: detailColor || semanticPalette.inkMuted,
            }}
          >
            {detail}
          </Text>
        ) : null}
      </View>
      <View style={{ flexShrink: 0 }}>{children}</View>
    </View>
  );
}

function PreferenceRow({ label, value, onPress }) {
  const { semanticPalette, SPACING } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: semanticPalette.lineSoft,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.ink }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: semanticPalette.inkSoft }}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={semanticPalette.inkMuted} />
      </View>
    </Pressable>
  );
}

function FieldLink({ children, onPress }) {
  const { semanticPalette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [{ alignSelf: "flex-start", marginTop: 6, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 13,
          lineHeight: 18,
          color: semanticPalette.accent,
          textDecorationLine: "underline",
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export default function AccountProfileScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isPhone = width < 768;
  const showPhoneSignOut = isPhone;

  const { token: authToken, user: authUser, updateStoredUser: persistUser, logout: authLogout, setMode: setThemeMode, mode: themeMode } =
    useAuth();
  const { semanticPalette, TYPE, SPACING, SHADOWS, RADII } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState(copy.fields.gender.options[0]);
  const [prefs, setPrefs] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [cards, setCards] = useState([]);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccessPulse, setAvatarSuccessPulse] = useState(false);
  const [profileVersion, setProfileVersion] = useState(1);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const avatarBackupRef = useRef("");

  const [twoFactor, setTwoFactor] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const [units, setUnits] = useState(copy.preferences.unitsOptions[0]);

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editNameDraft, setEditNameDraft] = useState("");
  const [genderOpen, setGenderOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [emailNew, setEmailNew] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [phoneChangeOpen, setPhoneChangeOpen] = useState(false);
  const [phoneNew, setPhoneNew] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const passwordModalRef = useRef(null);
  const sessionsModalRef = useRef(null);
  const [nameHover, setNameHover] = useState(false);

  const initialSnapshotRef = useRef("");
  const pendingNavActionRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
  }, []);

  useEffect(() => {
    if (route?.params?.openDeleteAccount) {
      setDeleteOpen(true);
      navigation.setParams?.({ openDeleteAccount: undefined });
    }
  }, [navigation, route?.params?.openDeleteAccount]);

  const currentSnapshot = useMemo(
    () => buildSnapshot({ name: fullName, displayName, phone, dob, gender }),
    [fullName, displayName, phone, dob, gender]
  );
  const isDirty = Boolean(initialSnapshotRef.current && currentSnapshot !== initialSnapshotRef.current);

  const loadSessions = useCallback(async () => {
    if (!authToken) return;
    try {
      setSessionsLoading(true);
      const data = await fetchActiveSessions(authToken);
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [authToken]);

  const loadAll = useCallback(async () => {
    if (!authToken) return;
    try {
      setLoading(true);
      const [profile, orders, storedPrefs, rawCards] = await Promise.all([
        fetchUserProfile(authToken),
        fetchMyOrders(authToken).catch(() => []),
        loadProfilePrefs(),
        AsyncStorage.getItem(DEMO_SAVED_CARDS_KEY),
      ]);

      const nextName = String(profile.name || "");
      const nextPhone = String(profile.phone || "");
      setFullName(nextName);
      setPhone(nextPhone);
      setEmail(String(profile.email || ""));
      setDisplayName(String(storedPrefs.displayName || ""));
      setDob(String(storedPrefs.dob || ""));
      setGender(storedPrefs.gender || copy.fields.gender.options[0]);
      setPrefs(storedPrefs);
      setTwoFactor(Boolean(storedPrefs.twoFactorEnabled));
      setUnits(storedPrefs.units || copy.preferences.unitsOptions[0]);
      setAvatarUrl(String(profile.avatar || "").trim());
      setAvatarPreview("");
      setProfileVersion(Number(profile.profileVersion || 1));
      setOrderCount(Array.isArray(orders) ? orders.length : 0);

      const addr = profile.defaultAddress;
      const list = [];
      if (addr?.line1) {
        list.push({
          id: "default",
          label: "HOME",
          lines: [addr.line1, [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")].filter(Boolean),
          isDefault: true,
        });
      }
      setAddresses(list);

      let parsedCards = [];
      try {
        parsedCards = JSON.parse(rawCards || "[]");
      } catch {
        parsedCards = [];
      }
      if (!Array.isArray(parsedCards)) parsedCards = [];
      setCards(
        parsedCards.map((c, i) => ({
          id: String(c.id || i),
          brand: c.brand || "Card",
          last4: c.last4 || "0000",
          expiry: c.expiry || "12/27",
          isDefault: i === 0,
        }))
      );

      initialSnapshotRef.current = buildSnapshot({
        name: nextName,
        displayName: storedPrefs.displayName,
        phone: nextPhone,
        dob: storedPrefs.dob,
        gender: storedPrefs.gender,
      });

      await persistUser(profile);

      const bio = await isBiometricLoginAvailable();
      setBiometricOn(bio);
      setBiometricLabel(await getBiometricLabel());
      loadSessions();
    } catch {
      showToast(copy.toasts.networkError);
    } finally {
      setLoading(false);
    }
  }, [authToken, loadSessions, persistUser, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  useEffect(() => {
    const syncPending = async () => {
      const pending = await loadPendingProfileSave();
      if (!pending || !authToken) return;
      try {
        const updated = await updateUserProfile(authToken, pending);
        await persistUser(updated);
        await clearPendingProfileSave();
        showToast(copy.offlineSyncToast);
        loadAll();
      } catch {
        /* retry later */
      }
    };
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncPending();
    });
    return () => unsub();
  }, [authToken, loadAll, persistUser, showToast]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!isDirty) return;
      e.preventDefault();
      pendingNavActionRef.current = e.data.action;
      setDiscardOpen(true);
    });
    return unsub;
  }, [isDirty, navigation]);

  const handleDiscard = () => {
    const snap = JSON.parse(initialSnapshotRef.current || "{}");
    setFullName(snap.name || "");
    setDisplayName(snap.displayName || "");
    setPhone(snap.phone || "");
    setDob(snap.dob || "");
    setGender(snap.gender || copy.fields.gender.options[0]);
    setDiscardOpen(false);
    if (pendingNavActionRef.current) {
      navigation.dispatch(pendingNavActionRef.current);
      pendingNavActionRef.current = null;
    }
  };

  const handleSave = async (options = {}) => {
    const { skipVersionCheck = false } = options;
    if (!authToken || !isDirty) return;
    setFormError("");
    if (!String(fullName).trim()) {
      Alert.alert(copy.fields.fullName.label, "Enter your full name.");
      return;
    }
    if (String(phone).trim().length > 0 && String(phone).trim().length < 10) {
      Alert.alert(copy.fields.phone.label, "Enter a valid phone number.");
      return;
    }
    const payload = {
      name: fullName.trim(),
      phone: phone.trim(),
      profileVersion: skipVersionCheck ? undefined : profileVersion,
    };
    if (await shouldQueueProfileSave()) {
      await queuePendingProfileSave(payload);
      showToast(copy.offlineSaveToast);
      return;
    }
    try {
      setSaving(true);
      const updated = await updateUserProfile(authToken, payload);
      await persistUser(updated);
      const nextPrefs = {
        ...(prefs || {}),
        displayName: displayName.trim(),
        dob: dob.trim(),
        gender,
        twoFactorEnabled: twoFactor,
        units,
      };
      await saveProfilePrefs(nextPrefs);
      setPrefs(nextPrefs);
      initialSnapshotRef.current = currentSnapshot;
      hapticSaveSuccess();
    } catch (err) {
      if (err?.status === 409 && err?.code === "PROFILE_VERSION_CONFLICT") {
        setConflictOpen(true);
        return;
      }
      hapticSaveError();
      setFormError(copy.toasts.saveError);
    } finally {
      setSaving(false);
    }
  };

  const launchAvatarPicker = async (useCamera = false) => {
    if (!authToken) return;
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(copy.avatar.changePhoto, "Photo library access is required.");
          return;
        }
      }
      const picked = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.65,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.65,
            base64: true,
          });
      if (picked.canceled) return;
      const asset = picked.assets?.[0];
      const validation = validateAvatarAsset(asset);
      if (!validation.ok) {
        showToast(validation.message);
        return;
      }
      if (!asset?.base64) {
        showToast(copy.toasts.saveError);
        return;
      }
      avatarBackupRef.current = avatarUrl;
      if (asset.uri) setAvatarPreview(asset.uri);
      setAvatarSuccessPulse(false);
      setAvatarUploading(true);
      const updated = await uploadUserAvatar(authToken, {
        imageBase64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
      });
      const next = String(updated.avatar || "").trim();
      setAvatarUrl(next);
      setAvatarPreview("");
      await persistUser(updated);
      setAvatarSuccessPulse(true);
      hapticAvatarSuccess();
      setTimeout(() => setAvatarSuccessPulse(false), 1200);
    } catch {
      setAvatarPreview("");
      setAvatarUrl(avatarBackupRef.current);
      hapticSaveError();
      showToast(copy.toasts.saveError);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePickAvatar = () => {
    pickAvatarPhotoOption({
      onTakePhoto: () => launchAvatarPicker(true),
      onChooseLibrary: () => launchAvatarPicker(false),
      onRemove: () => {
        Alert.alert(copy.avatarOptions.removeConfirmTitle, copy.avatarOptions.removeConfirmBody, [
          { text: copy.deleteFlow.cancelCta, style: "cancel" },
          { text: copy.avatarOptions.removeConfirmCta, style: "destructive", onPress: handleRemoveAvatar },
        ]);
      },
    });
  };

  const handleRemoveAvatar = async () => {
    if (!authToken) return;
    try {
      setAvatarUploading(true);
      avatarBackupRef.current = avatarUrl;
      const updated = await updateUserProfile(authToken, { avatar: "" });
      setAvatarUrl("");
      setAvatarPreview("");
      await persistUser(updated);
      showToast(copy.toasts.photoRemoved);
    } catch {
      showToast(copy.toasts.saveError);
    } finally {
      setAvatarUploading(false);
    }
  };

  const memberLine = useMemo(() => {
    const { month, year } = formatMemberSince(authUser?.createdAt);
    return fillPlaceholders(copy.identity.memberSinceTemplate, {
      month,
      year,
      orderCount: String(orderCount),
    });
  }, [authUser?.createdAt, orderCount]);

  const displayAvatar = avatarPreview || avatarUrl;
  const emailVerified = isVerified(authUser, "email");
  const phoneVerified = isVerified(authUser, "phone");

  const themeIndex = themeMode === "dark" ? 1 : themeMode === "system" ? 2 : 0;

  const confirmSignOut = async () => {
    setSignOutBusy(true);
    try {
      await authLogout();
      resetNavigationToHome(navigation.getParent?.() || navigation);
    } finally {
      setSignOutBusy(false);
      setSignOutOpen(false);
    }
  };

  useEffect(() => {
    if (sessionsOpen) loadSessions();
  }, [sessionsOpen, loadSessions]);

  const handleSendVerification = async () => {
    if (!authToken) return;
    try {
      await sendVerificationEmailRequest(authToken);
      showToast(copy.toasts.verifySent);
    } catch (err) {
      if (err?.devLink) {
        try {
          await Clipboard.setStringAsync(String(err.devLink));
          showToast(copy.toasts.verifyDevLink);
        } catch {
          showToast(String(err.devLink));
        }
        return;
      }
      showToast(err?.message || copy.toasts.saveError);
    }
  };

  const handleChangePassword = async () => {
    if (!authToken) return;
    if (passwordNew !== passwordConfirm) {
      Alert.alert(copy.passwordChange.confirmLabel, copy.passwordChange.mismatch);
      return;
    }
    try {
      setPasswordBusy(true);
      await changePasswordRequest(authToken, { currentPassword: passwordCurrent, newPassword: passwordNew });
      setPasswordModalOpen(false);
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
      await saveProfilePrefs({ ...(prefs || {}), passwordChangedAt: new Date().toISOString() });
      showToast(copy.passwordChange.success);
    } catch (err) {
      showToast(err?.status === 401 ? copy.passwordChange.wrongPassword : err?.message || copy.toasts.saveError);
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!authToken) return;
    try {
      await requestEmailChange(authToken, { newEmail: emailNew, currentPassword: emailPassword });
      setEmailChangeOpen(false);
      setEmailNew("");
      setEmailPassword("");
      showToast(copy.emailChange.success);
    } catch (err) {
      showToast(err?.message || copy.toasts.saveError);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!authToken) return;
    try {
      await requestPhoneOtp(authToken, { newPhone: phoneNew });
      setPhoneOtpSent(true);
      showToast(copy.phoneChange.sendOtp);
    } catch (err) {
      showToast(err?.message || copy.toasts.saveError);
    }
  };

  const handleVerifyPhone = async () => {
    if (!authToken) return;
    try {
      const updated = await verifyPhoneOtp(authToken, { newPhone: phoneNew, otp: phoneOtp });
      await persistUser(updated);
      setPhone(String(updated.phone || ""));
      setPhoneChangeOpen(false);
      setPhoneNew("");
      setPhoneOtp("");
      setPhoneOtpSent(false);
      showToast(copy.phoneChange.success);
    } catch (err) {
      showToast(err?.message || copy.toasts.saveError);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!authToken) return;
    try {
      await revokeSessionRequest(authToken, sessionId);
      await loadSessions();
    } catch (err) {
      showToast(err?.message || copy.toasts.saveError);
    }
  };

  useModalA11y({ visible: passwordModalOpen, onClose: () => setPasswordModalOpen(false), containerRef: passwordModalRef });
  useModalA11y({ visible: sessionsOpen, onClose: () => setSessionsOpen(false), containerRef: sessionsModalRef });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: { gap: SPACING.xl, width: "100%" },
        cardGap: { gap: SPACING.lg },
        identityRow: {
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "flex-start",
          gap: 24,
        },
        avatarWrap: {
          width: 96,
          height: 96,
          borderRadius: 48,
          borderWidth: 1,
          borderColor: semanticPalette.accent,
          overflow: "hidden",
          backgroundColor: semanticPalette.accentSoft,
          ...SHADOWS.soft,
        },
        cameraBtn: {
          position: "absolute",
          right: -4,
          bottom: -4,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: semanticPalette.accent,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: semanticPalette.surface,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        },
        formGrid: {
          flexDirection: isDesktop ? "row" : "column",
          flexWrap: "wrap",
          gap: SPACING.lg,
        },
        formCol: { flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 240 : undefined, width: isDesktop ? undefined : "100%" },
        helper: {
          marginTop: 4,
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 16,
          color: semanticPalette.inkMuted,
        },
        formFooter: {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: SPACING.sm,
          flexWrap: "wrap",
        },
        horizontalScroll: { marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg },
        miniCard: { width: 200, marginRight: SPACING.md },
        dashedCard: {
          width: 200,
          marginRight: SPACING.md,
          minHeight: 120,
          borderRadius: RADII.md,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: semanticPalette.accent,
          alignItems: "center",
          justifyContent: "center",
          padding: SPACING.md,
        },
        tagPill: {
          alignSelf: "flex-start",
          marginBottom: SPACING.sm,
        },
        segmentRow: { flexDirection: "row", gap: 8, marginTop: 8 },
        segment: {
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          alignItems: "center",
        },
      }),
    [RADII.md, SHADOWS.soft, SPACING, isDesktop, semanticPalette.accent, semanticPalette.accentSoft, semanticPalette.inkMuted, semanticPalette.lineSoft, semanticPalette.surface]
  );

  return (
    <AccountLayout navigation={navigation} activeSection="profile" hidePageHeader>
      <Toast visible={toast.visible} message={toast.message} onDismiss={() => setToast({ visible: false, message: "" })} />

      <ProfileConflictModal
        visible={conflictOpen}
        busy={saving}
        onCancel={() => setConflictOpen(false)}
        onRefresh={() => {
          setConflictOpen(false);
          loadAll();
        }}
        onOverwrite={async () => {
          setConflictOpen(false);
          await handleSave({ skipVersionCheck: true });
        }}
      />

      {!emailVerified ? (
        <EmailVerifyBanner onSendVerification={handleSendVerification} />
      ) : null}

      {formError ? <FormAlert message={formError} /> : null}

      <ProfileDeleteAccountModal
        visible={deleteOpen}
        busy={deleteBusy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async ({ reason, feedback }) => {
          if (!authToken) return;
          setDeleteBusy(true);
          try {
            await requestAccountDeletion(authToken, { reason, feedback });
            setDeleteOpen(false);
            showToast(copy.toasts.deletionRequested);
            await authLogout();
            resetNavigationToHome(navigation.getParent?.() || navigation);
          } catch (err) {
            showToast(err?.message || copy.toasts.saveError);
          } finally {
            setDeleteBusy(false);
          }
        }}
      />

      <Modal visible={discardOpen} transparent animationType="fade" onRequestClose={() => setDiscardOpen(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}>
          <Card padding="lg" style={{ maxWidth: 400, alignSelf: "center", width: "100%" }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>
              {copy.discardModal.title}
            </Text>
            <Text style={{ marginTop: SPACING.sm, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
              {copy.discardModal.body}
            </Text>
            <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
              <Button label={copy.discardModal.stay} variant="secondary" size="md" style={{ flex: 1 }} onPress={() => setDiscardOpen(false)} />
              <Button label={copy.discardModal.leave} variant="ghost" size="md" style={{ flex: 1 }} onPress={handleDiscard} />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={editNameOpen} transparent animationType="fade" onRequestClose={() => setEditNameOpen(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}>
          <Card padding="lg" style={{ maxWidth: 400, alignSelf: "center", width: "100%" }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.identity.editName}</Text>
            <View style={{ marginTop: SPACING.md }}>
              <Input label={copy.fields.fullName.label} value={editNameDraft} onChangeText={setEditNameDraft} />
            </View>
            <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg }}>
              <Button label={copy.buttons.discard} variant="ghost" size="md" style={{ flex: 1 }} onPress={() => setEditNameOpen(false)} />
              <Button
                label="Save"
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                onPress={() => {
                  setFullName(editNameDraft);
                  setEditNameOpen(false);
                }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={genderOpen} transparent animationType="fade" onRequestClose={() => setGenderOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(14,14,14,0.35)" }}>
          <Card padding="lg" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, marginBottom: SPACING.md }}>{copy.fields.gender.label}</Text>
            {copy.fields.gender.options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  setGender(opt);
                  setGenderOpen(false);
                }}
                style={{ paddingVertical: SPACING.md }}
              >
                <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{opt}</Text>
              </Pressable>
            ))}
          </Card>
        </View>
      </Modal>

      <Modal visible={passwordModalOpen} transparent animationType="fade" onRequestClose={() => setPasswordModalOpen(false)}>
        <View ref={passwordModalRef} style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}>
          <Card padding="lg" style={{ maxWidth: 400, alignSelf: "center", width: "100%" }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.security.changePasswordTitle}</Text>
            <Text style={{ marginTop: SPACING.sm, fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>
              {copy.security.changePasswordBody}
            </Text>
            <View style={{ marginTop: SPACING.lg, gap: SPACING.sm }}>
              <Input label={copy.passwordChange.currentLabel} value={passwordCurrent} onChangeText={setPasswordCurrent} secureTextEntry passwordToggle required />
              <Input label={copy.passwordChange.newLabel} value={passwordNew} onChangeText={setPasswordNew} secureTextEntry passwordToggle required />
              <Input label={copy.passwordChange.confirmLabel} value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry passwordToggle required />
              <Button label={copy.passwordChange.submit} variant="primary" size="md" fullWidth loading={passwordBusy} onPress={handleChangePassword} />
              <Button label={copy.deleteFlow.cancelCta} variant="ghost" size="md" fullWidth onPress={() => setPasswordModalOpen(false)} />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={sessionsOpen} transparent animationType="fade" onRequestClose={() => setSessionsOpen(false)}>
        <View ref={sessionsModalRef} style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}>
          <Card padding="lg" style={{ maxWidth: 420, alignSelf: "center", width: "100%" }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.security.sessionsTitle}</Text>
            {sessionsLoading ? (
              <Text style={{ marginTop: SPACING.md, fontFamily: fonts.regular, color: semanticPalette.inkMuted }}>Loading…</Text>
            ) : (
              sessions.map((session) => (
                <View
                  key={session.sessionId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: SPACING.md,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: semanticPalette.lineSoft,
                    gap: SPACING.sm,
                    flexWrap: "wrap",
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>{session.deviceName}</Text>
                      {session.current ? <Badge variant="brass" size="sm">{copy.security.thisDevice}</Badge> : null}
                    </View>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted, marginTop: 2, flexShrink: 1 }}>
                      {session.location}
                      {session.lastActiveAt ? ` · ${new Date(session.lastActiveAt).toLocaleString()}` : ""}
                    </Text>
                  </View>
                  {!session.current ? (
                    <Button label={copy.security.revokeSession} variant="ghost" size="sm" onPress={() => handleRevokeSession(session.sessionId)} />
                  ) : null}
                </View>
              ))
            )}
            <Button label="Done" variant="secondary" size="md" fullWidth style={{ marginTop: SPACING.md }} onPress={() => setSessionsOpen(false)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={emailChangeOpen} transparent animationType="fade" onRequestClose={() => setEmailChangeOpen(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}>
          <Card padding="lg" style={{ maxWidth: 400, alignSelf: "center", width: "100%", gap: SPACING.sm }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.emailChange.title}</Text>
            <Input label={copy.emailChange.newLabel} value={emailNew} onChangeText={setEmailNew} keyboardType="email-address" autoCapitalize="none" required />
            <Input label={copy.emailChange.currentPasswordLabel} value={emailPassword} onChangeText={setEmailPassword} secureTextEntry passwordToggle required />
            <Button label={copy.emailChange.submit} variant="primary" size="md" fullWidth onPress={handleRequestEmailChange} />
            <Button label={copy.deleteFlow.cancelCta} variant="ghost" size="md" fullWidth onPress={() => setEmailChangeOpen(false)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={phoneChangeOpen} transparent animationType="fade" onRequestClose={() => setPhoneChangeOpen(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: SPACING.lg, backgroundColor: "rgba(14,14,14,0.42)" }}>
          <Card padding="lg" style={{ maxWidth: 400, alignSelf: "center", width: "100%", gap: SPACING.sm }}>
            <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: TYPE.h3.fontSize, color: semanticPalette.ink }}>{copy.phoneChange.title}</Text>
            <Input label={copy.phoneChange.newLabel} value={phoneNew} onChangeText={setPhoneNew} keyboardType="phone-pad" required />
            {phoneOtpSent ? <Input label={copy.phoneChange.otpLabel} value={phoneOtp} onChangeText={setPhoneOtp} keyboardType="number-pad" required /> : null}
            <Button
              label={phoneOtpSent ? copy.phoneChange.verify : copy.phoneChange.sendOtp}
              variant="primary"
              size="md"
              fullWidth
              onPress={phoneOtpSent ? handleVerifyPhone : handleSendPhoneOtp}
            />
            <Button label={copy.deleteFlow.cancelCta} variant="ghost" size="md" fullWidth onPress={() => setPhoneChangeOpen(false)} />
          </Card>
        </View>
      </Modal>

      <AccountSignOutDialog visible={signOutOpen} busy={signOutBusy} onCancel={() => !signOutBusy && setSignOutOpen(false)} onConfirm={confirmSignOut} />

      <View style={styles.stack}>
        <Card padding="lg">
          <View style={styles.identityRow}>
            <View style={{ position: "relative" }}>
              <View style={styles.avatarWrap}>
                {displayAvatar ? (
                  <Image
                    source={{ uri: displayAvatar }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                    accessibilityLabel={`${fullName || authUser?.name || "User"}'s profile photo`}
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: 36, color: semanticPalette.accent }}>
                      {initialsFromName(fullName || authUser?.name)}
                    </Text>
                  </View>
                )}
                {avatarUploading ? (
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: "rgba(255,255,255,0.55)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ProgressRing size={36} accentColor={semanticPalette.accent} spinning />
                  </View>
                ) : null}
                <BrassCheckPulse active={avatarSuccessPulse} size={96} />
              </View>
              <Pressable
                onPress={handlePickAvatar}
                accessibilityLabel={copy.avatar.changePhoto}
                style={styles.cameraBtn}
              >
                <Ionicons name="camera" size={16} color={semanticPalette.inkInverse} />
              </Pressable>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: TYPE.micro.fontSize,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: semanticPalette.inkMuted,
                  marginBottom: 4,
                }}
              >
                {copy.pageTitle}
              </Text>
              <Pressable
                onPress={() => {
                  setEditNameDraft(fullName);
                  setEditNameOpen(true);
                }}
                onHoverIn={() => Platform.OS === "web" && setNameHover(true)}
                onHoverOut={() => Platform.OS === "web" && setNameHover(false)}
                style={styles.nameRow}
              >
                <Text style={{ fontFamily: FONT_DISPLAY_SEMI, fontSize: 24, lineHeight: 30, color: semanticPalette.ink }}>
                  {fullName || authUser?.name || "—"}
                </Text>
                {(nameHover || isPhone) && (
                  <Ionicons name="pencil" size={16} color={semanticPalette.accent} accessibilityLabel={copy.identity.editName} />
                )}
              </Pressable>

              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>{email}</Text>
                {emailVerified ? (
                  <Badge variant="brass" size="sm">
                    {copy.identity.verified}
                  </Badge>
                ) : (
                  <FieldLink onPress={handleSendVerification}>
                    {copy.identity.unverified} — {copy.identity.verify}
                  </FieldLink>
                )}
              </View>
              <FieldLink onPress={() => setEmailChangeOpen(true)}>{copy.fields.email.changeLink}</FieldLink>

              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: TYPE.body.fontSize, color: semanticPalette.inkSoft }}>{phone || "—"}</Text>
                {phone && !phoneVerified ? (
                  <FieldLink onPress={() => setPhoneChangeOpen(true)}>{copy.identity.verify}</FieldLink>
                ) : null}
                {phone && phoneVerified ? (
                  <Badge variant="brass" size="sm">
                    {copy.identity.verified}
                  </Badge>
                ) : null}
              </View>
              <FieldLink onPress={() => setPhoneChangeOpen(true)}>{copy.phoneChange.title}</FieldLink>

              <Text style={{ marginTop: 8, fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted }}>{memberLine}</Text>
            </View>
          </View>
        </Card>

        <View>
          <SectionHeader overline={copy.sections.personalDetails.overline} title={copy.sections.personalDetails.title} />
          <Card padding="lg" contentStyle={styles.cardGap}>
            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <Input
                  label={copy.fields.fullName.label}
                  placeholder={copy.fields.fullName.placeholder}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                  required
                />
              </View>
              <View style={styles.formCol}>
                <Input
                  label={copy.fields.displayName.label}
                  placeholder={copy.fields.displayName.placeholder}
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!loading}
                />
                <Text style={styles.helper}>{copy.fields.displayName.helper}</Text>
              </View>
              <View style={styles.formCol}>
                <Input
                  label={copy.fields.dob.label}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  editable={!loading}
                  {...Platform.select({
                    web: { inputMode: "text" },
                    default: {},
                  })}
                />
                <Text style={styles.helper}>{copy.fields.dob.helper}</Text>
              </View>
              <View style={styles.formCol}>
                <Pressable onPress={() => setGenderOpen(true)}>
                  <Input label={copy.fields.gender.label} value={gender} editable={false} iconRight="chevron-down" />
                </Pressable>
              </View>
            </View>
            <View style={styles.formFooter}>
              {isDirty ? (
                <Button label={copy.buttons.discard} variant="ghost" size="md" onPress={handleDiscard} disabled={saving} />
              ) : null}
              <AccountSaveButton
                dirty={isDirty && !loading}
                saving={saving}
                saveLabel={copy.buttons.save}
                savingLabel={copy.buttons.saving}
                savedLabel={copy.buttons.saved}
                onPress={handleSave}
              />
            </View>
          </Card>
        </View>

        <View>
          <SectionHeader overline={copy.sections.security.overline} title={copy.sections.security.title} />
          <Card padding="lg">
            <SecurityRow
              first
              label="Password"
              detail={formatPasswordAgo(prefs?.passwordChangedAt)}
              children={
                <Button label={copy.buttons.changePassword} variant="secondary" size="sm" onPress={() => setPasswordModalOpen(true)} />
              }
            />
            <SecurityRow
              label="Two-factor authentication"
              detail={twoFactor ? copy.security.twoFactorEnabled : copy.security.twoFactorDisabled}
              detailColor={twoFactor ? semanticPalette.success : semanticPalette.inkSoft}
              children={
                <View style={{ alignItems: "flex-end", gap: 8 }}>
                  <PremiumSwitch
                    value={twoFactor}
                    onValueChange={(v) => {
                      setTwoFactor(v);
                      saveProfilePrefs({ ...(prefs || {}), twoFactorEnabled: v });
                    }}
                  />
                  {twoFactor ? (
                    <Button
                      label={copy.security.twoFactorManage}
                      variant="ghost"
                      size="sm"
                      onPress={() => showToast(copy.toasts.verifySoon)}
                    />
                  ) : null}
                </View>
              }
            />
            {Platform.OS !== "web" ? (
              <SecurityRow
                label={copy.security.biometricLabel}
                detail={biometricLabel}
                children={
                  <PremiumSwitch
                    value={biometricOn}
                    onValueChange={async (v) => {
                      if (!v) {
                        await clearBiometricCredentials();
                        setBiometricOn(false);
                        return;
                      }
                      showToast(copy.toasts.verifySoon);
                    }}
                  />
                }
              />
            ) : null}
            <Pressable onPress={() => setSessionsOpen(true)}>
              <SecurityRow
                label="Active sessions"
                detail={fillPlaceholders(copy.security.activeSessionsTemplate, {
                  count: String(Math.max(1, sessions.length || 1)),
                })}
                children={<Ionicons name="chevron-forward" size={20} color={semanticPalette.inkMuted} />}
              />
            </Pressable>
            <Pressable onPress={() => navigation.navigate(ACCOUNT_NESTED.AccountActivity)}>
              <SecurityRow
                label={copy.security.activityLink}
                children={<Ionicons name="chevron-forward" size={20} color={semanticPalette.inkMuted} />}
              />
            </Pressable>
          </Card>
        </View>

        <View>
          <SectionHeader
            overline={copy.sections.addresses.overline}
            title={copy.sections.addresses.title}
            actionLabel={copy.sections.addresses.trailing}
            onActionPress={() => navigation.navigate(ACCOUNT_NESTED.Addresses)}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingBottom: 4 }}>
            {addresses.length === 0 ? (
              <Card padding="md" style={styles.miniCard}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>{copy.empty.noAddresses.title}</Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted }}>{copy.empty.noAddresses.body}</Text>
                <Button
                  label={copy.empty.noAddresses.cta}
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: SPACING.sm }}
                  onPress={() => navigation.navigate(ACCOUNT_NESTED.Addresses)}
                />
              </Card>
            ) : (
              addresses.map((addr) => (
                <Card key={addr.id} padding="md" style={styles.miniCard}>
                  <View style={styles.tagPill}>
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 10,
                        letterSpacing: 1.2,
                        color: semanticPalette.accent,
                      }}
                    >
                      {addr.label}
                    </Text>
                  </View>
                  {addr.lines.map((line) => (
                    <Text key={line} style={{ fontFamily: fonts.regular, fontSize: TYPE.small.fontSize, color: semanticPalette.ink, marginTop: 2 }}>
                      {line}
                    </Text>
                  ))}
                  {addr.isDefault ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: semanticPalette.accent }} />
                      <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: semanticPalette.accent }}>Default</Text>
                    </View>
                  ) : null}
                </Card>
              ))
            )}
            <Pressable style={styles.dashedCard} onPress={() => navigation.navigate(ACCOUNT_NESTED.Addresses)} accessibilityRole="button">
              <Ionicons name="add" size={24} color={semanticPalette.accent} />
              <Text style={{ marginTop: 8, fontFamily: fonts.medium, fontSize: 12, color: semanticPalette.accent }}>+ Add new address</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View>
          <SectionHeader
            overline={copy.sections.payment.overline}
            title={copy.sections.payment.title}
            actionLabel={copy.sections.payment.trailing}
            onActionPress={() => navigation.navigate(ACCOUNT_NESTED.Payment)}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingBottom: 4 }}>
            {cards.length === 0 ? (
              <Card padding="md" style={styles.miniCard}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>{copy.empty.noPayment.title}</Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted }}>{copy.empty.noPayment.body}</Text>
                <Button
                  label={copy.empty.noPayment.cta}
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: SPACING.sm }}
                  onPress={() => navigation.navigate(ACCOUNT_NESTED.Payment)}
                />
              </Card>
            ) : (
              cards.map((card) => (
                <Card key={card.id} padding="md" style={styles.miniCard}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="card-outline" size={20} color={semanticPalette.ink} />
                    <Text style={{ fontFamily: fonts.semibold, fontSize: TYPE.body.fontSize, color: semanticPalette.ink }}>{card.brand}</Text>
                  </View>
                  <Text style={{ marginTop: 8, fontFamily: fonts.medium, fontSize: TYPE.small.fontSize, color: semanticPalette.ink }}>
                    •••• {card.last4}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: semanticPalette.inkMuted }}>{card.expiry}</Text>
                  {card.isDefault ? (
                    <View style={{ marginTop: SPACING.sm }}>
                      <Badge variant="brass" size="sm">
                        Default
                      </Badge>
                    </View>
                  ) : null}
                </Card>
              ))
            )}
            <Pressable style={styles.dashedCard} onPress={() => navigation.navigate(ACCOUNT_NESTED.Payment)} accessibilityRole="button">
              <Ionicons name="add" size={24} color={semanticPalette.accent} />
              <Text style={{ marginTop: 8, fontFamily: fonts.medium, fontSize: 12, color: semanticPalette.accent }}>+ Add new method</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View>
          <SectionHeader overline={copy.sections.preferences.overline} title={copy.sections.preferences.title} />
          <Card padding="lg">
            <PreferenceRow
              label={copy.preferences.languageLabel}
              value={prefs?.language || "English"}
              onPress={() => Alert.alert(copy.preferences.languageLabel, "Language picker coming soon.")}
            />
            <PreferenceRow
              label={copy.preferences.currencyLabel}
              value={prefs?.currency || "INR (₹)"}
              onPress={() => Alert.alert(copy.preferences.currencyLabel, "Currency picker coming soon.")}
            />
            <PreferenceRow
              label={copy.preferences.timezoneLabel}
              value={prefs?.timezone || "Asia/Kolkata"}
              onPress={() => Alert.alert(copy.preferences.timezoneLabel, "Time zone picker coming soon.")}
            />
            <View style={{ paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: semanticPalette.lineSoft }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: semanticPalette.ink }}>{copy.preferences.themeLabel}</Text>
              <View style={styles.segmentRow}>
                {copy.preferences.themeOptions.map((opt, idx) => {
                  const active = themeIndex === idx;
                  const modeVal = idx === 1 ? "dark" : idx === 2 ? "system" : "light";
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setThemeMode(modeVal)}
                      style={[
                        styles.segment,
                        {
                          borderColor: active ? semanticPalette.ink : semanticPalette.line,
                          backgroundColor: active ? semanticPalette.ink : semanticPalette.surface,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.medium,
                          fontSize: 12,
                          color: active ? semanticPalette.inkInverse : semanticPalette.ink,
                        }}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <PreferenceRow
              label={copy.preferences.unitsLabel}
              value={units}
              onPress={() => {
                const next = units === copy.preferences.unitsOptions[0] ? copy.preferences.unitsOptions[1] : copy.preferences.unitsOptions[0];
                setUnits(next);
                saveProfilePrefs({ ...(prefs || {}), units: next });
              }}
            />
          </Card>
        </View>

        <View>
          <SectionHeader overline={copy.sections.dataPrivacy.overline} title={copy.sections.dataPrivacy.title} />
          <Card padding="lg" contentStyle={{ gap: SPACING.sm }}>
            <Button label={copy.buttons.downloadData} variant="secondary" size="md" fullWidth onPress={() => showToast(copy.toasts.dataExportRequested)} />
            <Button
              label={copy.buttons.privacyPrefs}
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => navigation.navigate(ACCOUNT_NESTED.NotificationPrefs)}
            />
            <Button label={copy.buttons.deleteAccount} variant="secondary" size="md" fullWidth onPress={() => setDeleteOpen(true)} />
          </Card>
        </View>

        {showPhoneSignOut ? (
          <Button label={copy.buttons.signOut} variant="secondary" size="lg" fullWidth onPress={() => setSignOutOpen(true)} />
        ) : null}
      </View>
    </AccountLayout>
  );
}
