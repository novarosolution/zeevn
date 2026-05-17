import React, { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AccountLayout from "../../components/account/AccountLayout";
import AccountGrid from "../../components/account/shared/AccountGrid";
import DashedAddCard from "../../components/account/shared/DashedAddCard";
import AddressCard from "../../components/account/addresses/AddressCard";
import AddressFormModal from "../../components/account/addresses/AddressFormModal";
import DeleteAddressModal from "../../components/account/addresses/DeleteAddressModal";
import EmptyState from "../../components/ui/EmptyState";
import { ADDRESSES_SCREEN } from "../../content/appContent";
import { ACCOUNT_NESTED } from "../../navigation/accountRoutes";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  createAddressId,
  loadSavedAddresses,
  saveSavedAddresses,
} from "../../utils/savedAddresses";

const copy = ADDRESSES_SCREEN;

export default function AccountAddressesScreen({ navigation }) {
  const { token, user, updateStoredUser } = useAuth();
  const { SPACING } = useTheme();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const profileSeed = useMemo(
    () => ({
      fullName: String(user?.name || "").trim(),
      phone: String(user?.phone || "").replace(/\D/g, "").slice(-10),
    }),
    [user?.name, user?.phone]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await loadSavedAddresses(token);
      setAddresses(list);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAdd = () => {
    setFormMode("add");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (addr) => {
    setFormMode("edit");
    setEditing(addr);
    setFormOpen(true);
  };

  const persist = async (next) => {
    const saved = await saveSavedAddresses(next, { token, updateStoredUser });
    setAddresses(saved);
    return saved;
  };

  const handleSave = async (formValues) => {
    if (!token) return;
    const required =
      formValues.fullName?.trim() &&
      formValues.phone?.trim() &&
      formValues.line1?.trim() &&
      formValues.city?.trim() &&
      formValues.state?.trim() &&
      formValues.postalCode?.trim();
    if (!required) {
      Alert.alert("Missing fields", copy.errors.missingFields);
      return;
    }
    try {
      setSaving(true);
      let next;
      if (formMode === "edit" && editing?.id) {
        next = addresses.map((a) => {
          if (a.id === editing.id) {
            return {
              ...a,
              ...formValues,
              isDefault: Boolean(formValues.makeDefault),
            };
          }
          return formValues.makeDefault ? { ...a, isDefault: false } : a;
        });
      } else {
        const entry = {
          id: createAddressId(),
          ...formValues,
          isDefault: Boolean(formValues.makeDefault) || addresses.length === 0,
        };
        next =
          entry.isDefault
            ? [...addresses.map((a) => ({ ...a, isDefault: false })), entry]
            : [...addresses, entry];
      }
      await persist(next);
      setFormOpen(false);
      setEditing(null);
    } catch {
      Alert.alert("Unable to save", copy.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    if (!token) return;
    try {
      setSaving(true);
      const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
      await persist(next);
    } catch {
      Alert.alert("Unable to save", copy.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !token) return;
    try {
      setDeleteBusy(true);
      const next = addresses.filter((a) => a.id !== deleteTarget.id);
      if (deleteTarget.isDefault && next.length) {
        next[0] = { ...next[0], isDefault: true };
      }
      await persist(next);
      setDeleteTarget(null);
    } catch {
      Alert.alert("Unable to delete", copy.errors.delete);
    } finally {
      setDeleteBusy(false);
    }
  };

  const hasAddresses = addresses.length > 0;

  return (
    <AccountLayout
      navigation={navigation}
      activeKey={ACCOUNT_NESTED.Addresses}
      activeSection="addresses"
      pageTitle={copy.pageTitle}
      pageSubtitle={copy.pageSubtitle}
    >
      <AddressFormModal
        visible={formOpen}
        mode={formMode}
        initial={editing}
        profileSeed={profileSeed}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        onSave={handleSave}
      />

      <DeleteAddressModal
        visible={Boolean(deleteTarget)}
        address={deleteTarget}
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <DashedAddCard label={copy.addCardLabel} onPress={openAdd} accessibilityLabel={copy.addCardA11y} />

      {!loading && !hasAddresses ? (
        <EmptyState
          iconName="location-outline"
          title={copy.empty.title}
          description={copy.empty.description}
          ctaLabel={copy.empty.cta}
          onCtaPress={openAdd}
          style={{ marginTop: SPACING.lg }}
        />
      ) : null}

      {hasAddresses ? (
        <View style={{ marginTop: SPACING.lg }}>
          <AccountGrid gap={SPACING.md}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => openEdit(addr)}
                onDelete={() => setDeleteTarget(addr)}
                onSetDefault={() => handleSetDefault(addr.id)}
              />
            ))}
          </AccountGrid>
        </View>
      ) : null}
    </AccountLayout>
  );
}
