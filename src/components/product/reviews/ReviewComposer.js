import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../ui/Button";
import ComposerStarRating from "./ComposerStarRating";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import { useTheme } from "../../../context/ThemeContext";
import { PRODUCT_SCREEN } from "../../../content/appContent";
import { uploadReviewPhoto } from "../../../services/productService";

const COPY = PRODUCT_SCREEN.reviews;
const MAX_PHOTOS = 4;
const TITLE_MAX = 80;
const BODY_MAX = 600;

function ReviewComposerBase({
  productId,
  token,
  isAuthenticated,
  onNavigateLogin,
  onSubmit,
  busy = false,
  defaultOpen = false,
}) {
  const { semanticPalette, SPACING } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stars: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: SPACING.md },
        photoRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: SPACING.md },
        slot: {
          width: 64,
          height: 64,
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: semanticPalette.line,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: semanticPalette.surfaceAlt,
          overflow: "hidden",
        },
        slotImage: { width: "100%", height: "100%" },
        footer: { flexDirection: "row", justifyContent: "flex-end", gap: SPACING.sm, marginTop: SPACING.md },
        charCount: {
          alignSelf: "flex-end",
          fontFamily: "System",
          fontSize: 11,
          color: semanticPalette.inkMuted,
          marginTop: 4,
        },
      }),
    [SPACING, semanticPalette]
  );

  const reset = useCallback(() => {
    setRating(0);
    setTitle("");
    setBody("");
    setPhotos([]);
    setLocalError("");
    setOpen(false);
  }, []);

  const handleOpen = () => {
    if (!isAuthenticated) {
      onNavigateLogin?.();
      return;
    }
    setOpen(true);
  };

  const pickPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    setLocalError("");
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setLocalError(COPY.photoPermissionError);
          return;
        }
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.55,
        base64: true,
      });
      if (picked.canceled) return;
      const asset = picked.assets?.[0];
      if (!asset?.base64) {
        setLocalError(COPY.photoReadError);
        return;
      }
      setUploading(true);
      const uploaded = await uploadReviewPhoto(token, productId, {
        imageBase64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
      });
      if (uploaded.url) setPhotos((prev) => [...prev, uploaded.url].slice(0, MAX_PHOTOS));
    } catch (err) {
      setLocalError(err.message || COPY.photoUploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setLocalError("");
    if (rating < 1) {
      setLocalError(PRODUCT_SCREEN.reviewRatingError);
      return;
    }
    try {
      await onSubmit?.({ rating, title: title.trim(), comment: body.trim(), photos });
      reset();
    } catch (err) {
      setLocalError(err.message || PRODUCT_SCREEN.reviewSubmitErrorFallback);
    }
  };

  if (!open) {
    return (
      <Button
        label={COPY.writeReview}
        variant="secondary"
        fullWidth
        onPress={handleOpen}
        accessibilityLabel={COPY.writeReviewA11y}
      />
    );
  }

  const formA11y =
    Platform.OS === "web"
      ? { role: "form", "aria-label": COPY.writeReviewA11y }
      : { accessibilityLabel: COPY.writeReviewA11y };

  return (
    <View style={{ width: "100%" }} {...formA11y}>
    <Card padding={20} style={{ width: "100%" }}>
      <ComposerStarRating rating={rating} onChange={setRating} />

      <Input
        label={COPY.titleLabel}
        value={title}
        onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
        placeholder={COPY.titlePlaceholder}
        maxLength={TITLE_MAX}
      />
      <Text style={styles.charCount}>
        {fillCount(COPY.titleCharCount, title.length, TITLE_MAX)}
      </Text>

      <View style={{ marginTop: SPACING.md }}>
        <Input
          label={COPY.bodyLabel}
          value={body}
          onChangeText={(t) => setBody(t.slice(0, BODY_MAX))}
          placeholder={COPY.bodyPlaceholder}
          multiline
          maxLength={BODY_MAX}
        />
        <Text style={styles.charCount}>
          {fillCount(COPY.bodyCharCount, body.length, BODY_MAX)}
        </Text>
      </View>

      <View style={styles.photoRow}>
        {photos.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={styles.slot}>
            <Image source={{ uri }} style={styles.slotImage} contentFit="cover" />
            <Pressable
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "rgba(14,23,41,0.65)",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setPhotos((p) => p.filter((_, i) => i !== idx))}
              accessibilityLabel={COPY.removePhotoA11y}
            >
              <Ionicons name="close" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS ? (
          <Pressable style={styles.slot} onPress={pickPhoto} disabled={uploading}>
            <Ionicons name="add" size={22} color={semanticPalette.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      {localError ? (
        <Text
          style={{ marginTop: SPACING.sm, fontSize: 13, color: semanticPalette.sale }}
          accessibilityLiveRegion="polite"
          {...(Platform.OS === "web" ? { role: "alert" } : {})}
        >
          {localError}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Button label={COPY.cancel} variant="ghost" onPress={reset} disabled={busy || uploading} />
        <Button
          label={busy ? COPY.submitting : COPY.submit}
          variant="primary"
          loading={busy || uploading}
          onPress={handleSubmit}
        />
      </View>
    </Card>
    </View>
  );
}

function fillCount(template, current, max) {
  return String(template || "").replace("{current}", String(current)).replace("{max}", String(max));
}

const ReviewComposer = memo(ReviewComposerBase);

export default ReviewComposer;
