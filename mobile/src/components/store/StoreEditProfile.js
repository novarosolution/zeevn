import React, { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from "react-native-reanimated";
import { useStoreTheme } from "../../theme/storefront";
import { hapticSuccess } from "../../utils/haptics";
import PressableScale from "./PressableScale";
import StoreBanner from "./StoreBanner";
import StoreField from "./StoreField";
import { Bone, ShimmerProvider } from "./StoreSkeleton";
import StoreScreen from "./StoreScreen";
import { Avatar, Button, Card, Group, Rise, Row } from "./StoreKit";

const AVATAR = 112;

function PhotoPicker({ name, uri, uploading, onPick, onRemove }) {
  const { c, shadow, type } = useStoreTheme();
  const pop = useSharedValue(1);
  const prev = useRef(uri);

  // A little spring when a new photo lands.
  useEffect(() => {
    if (uri && uri !== prev.current) {
      pop.value = withSequence(withSpring(1.08, { damping: 8, stiffness: 380 }), withSpring(1, { damping: 12, stiffness: 260 }));
    }
    prev.current = uri;
  }, [uri, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.hero}>
      <Animated.View style={[styles.avatarWrap, popStyle]}>
        <PressableScale
          onPress={onPick}
          disabled={uploading}
          scaleTo={0.96}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          style={[styles.avatarRing, shadow.card, { borderColor: c.card, backgroundColor: c.card }]}
        >
          <Avatar name={name} uri={uri} size={AVATAR - 8} />
          {uploading ? (
            <View style={[styles.overlay, { backgroundColor: "rgba(20, 24, 14, 0.5)" }]}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </PressableScale>
        <PressableScale
          onPress={onPick}
          disabled={uploading}
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Choose a new photo"
          style={[styles.camera, shadow.soft, { backgroundColor: c.brand, borderColor: c.page }]}
        >
          <Ionicons name="camera" size={17} color={c.onBrand} />
        </PressableScale>
      </Animated.View>
      {uri ? (
        <PressableScale onPress={onRemove} disabled={uploading} scaleTo={0.96} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.remove}>
          <Text style={type.ui(14, "bold", c.danger)}>Remove photo</Text>
        </PressableScale>
      ) : (
        <Text style={type.ui(13.5, "medium", c.inkMute)}>Tap to add a photo</Text>
      )}
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <ShimmerProvider>
      <View style={styles.skeleton}>
        <Bone width={AVATAR} height={AVATAR} radius={AVATAR / 2} />
        <Bone width="100%" height={58} radius={20} />
        <Bone width="100%" height={58} radius={20} />
        <Bone width="100%" height={54} radius={27} />
      </View>
    </ShimmerProvider>
  );
}

/** Native profile editor: photo, name and phone, address shortcut and save. */
export default function StoreEditProfile({
  navigation,
  loading,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  name,
  onName,
  phone,
  onPhone,
  fieldErrors,
  avatarUrl,
  avatarUploading,
  onPickAvatar,
  onRemoveAvatar,
  hasAddress,
  saving,
  onSave,
  account,
}) {
  const { c, type } = useStoreTheme();
  const lastSuccess = useRef("");

  useEffect(() => {
    if (success && success !== lastSuccess.current) hapticSuccess();
    lastSuccess.current = success;
  }, [success]);

  return (
    <StoreScreen title="Edit profile" navigation={navigation}>
      {error ? <StoreBanner message={error} onClose={onDismissError} /> : null}
      {success ? <StoreBanner tone="success" message={success} onClose={onDismissSuccess} /> : null}

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <Rise index={0}>
            <PhotoPicker name={name} uri={avatarUrl} uploading={avatarUploading} onPick={onPickAvatar} onRemove={onRemoveAvatar} />
          </Rise>

          <Rise index={1}>
            <Card style={styles.fields}>
              <StoreField
                label="Full name"
                icon="person-outline"
                value={name}
                onChangeText={onName}
                error={fieldErrors.name}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
              <StoreField
                label="Phone number"
                icon="call-outline"
                value={phone}
                onChangeText={onPhone}
                error={fieldErrors.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </Card>
          </Rise>

          <Rise index={2}>
            <Group>
              <Row
                icon="location-outline"
                title={hasAddress ? "Delivery address" : "Add delivery address"}
                subtitle={hasAddress ? "Saved — tap to manage" : "Where should we deliver?"}
                onPress={() => navigation.navigate("ManageAddress")}
              />
            </Group>
          </Rise>

          <Rise index={3}>
            <Button label="Save changes" icon="checkmark-circle-outline" onPress={onSave} loading={saving} />
            {account ? <Text style={[type.ui(12.5, "medium", c.inkMute), styles.account]}>Signed in as {account}</Text> : null}
          </Rise>
        </>
      )}
    </StoreScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 14, paddingTop: 4 },
  avatarWrap: { width: AVATAR, height: AVATAR },
  avatarRing: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, borderWidth: 4, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  camera: { position: "absolute", right: -2, bottom: 2, width: 38, height: 38, borderRadius: 19, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  remove: { paddingVertical: 4, paddingHorizontal: 10 },
  fields: { gap: 12 },
  account: { textAlign: "center", marginTop: 14 },
  skeleton: { alignItems: "center", gap: 14 },
});
