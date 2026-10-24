import React, { useState } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import AdminButton from "./AdminButton";
import AdminInput from "./AdminInput";
import AdminToggleRow from "./AdminToggleRow";
import { useTheme } from "../../context/ThemeContext";
import { uploadAdminProductImage } from "../../services/adminService";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { newHeroSlideId } from "../../utils/homeViewMedia";

const MAX_SLIDES = 4;

function SlidePreview({ slide, styles }) {
  if (!slide?.url) {
    return (
      <View style={styles.previewEmpty}>
        <Ionicons name="image-outline" size={28} color="#9a8b7c" />
      </View>
    );
  }
  return <Image source={{ uri: slide.url }} style={styles.previewImage} contentFit="cover" />;
}

export default function AdminHomeHeroEditor({ token, heroSlides, onHeroSlidesChange, onError }) {
  const { colors: c } = useTheme();
  const styles = createStyles(c);
  const [uploadingKey, setUploadingKey] = useState("");

  const pickImage = async (onUrl) => {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        onError?.("Media library permission is required.");
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
      onError?.("Could not read image.");
      return;
    }
    const uploaded = await uploadAdminProductImage(token, {
      imageBase64: asset.base64,
      mimeType: asset.mimeType || "image/jpeg",
    });
    onUrl(uploaded.url);
  };

  const updateSlide = (id, patch) => {
    onHeroSlidesChange(heroSlides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)));
  };

  const removeSlide = (id) => {
    onHeroSlidesChange(heroSlides.filter((slide) => slide.id !== id));
  };

  const addSlide = () => {
    if (heroSlides.length >= MAX_SLIDES) {
      onError?.(`Maximum ${MAX_SLIDES} slides.`);
      return;
    }
    const nextOrder = heroSlides.reduce((max, slide) => Math.max(max, Number(slide.order) || 0), -1) + 1;
    onHeroSlidesChange([
      ...heroSlides,
      {
        id: newHeroSlideId(),
        order: nextOrder,
        mediaType: "image",
        url: "",
        title: "",
        subtitle: "",
        enabled: true,
      },
    ]);
  };

  const uploadForSlide = async (slide) => {
    try {
      setUploadingKey(slide.id);
      onError?.("");
      await pickImage((url) => updateSlide(slide.id, { url, mediaType: "image" }));
    } catch (err) {
      onError?.(err.message || "Upload failed.");
    } finally {
      setUploadingKey("");
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.blockHint}>Up to {MAX_SLIDES} images. A slide with no URL is dropped on save. Disabled slides stay saved and stay off Home.</Text>

      {heroSlides.map((slide, index) => (
        <View key={slide.id} style={[styles.card, { borderColor: c.border }]}>
          <View style={styles.cardTop}>
            <SlidePreview slide={slide} styles={styles} />
            <View style={styles.cardMeta}>
              <Text style={[styles.cardLabel, { color: c.textPrimary }]}>Slide {index + 1}</Text>
              <AdminButton
                label={slide.url ? "Replace image" : "Upload image"}
                size="sm"
                variant="soft"
                icon="image-outline"
                loading={uploadingKey === slide.id}
                disabled={Boolean(uploadingKey)}
                onPress={() => uploadForSlide(slide)}
              />
              <Pressable onPress={() => removeSlide(slide.id)} style={styles.remove} accessibilityRole="button" accessibilityLabel="Remove slide">
                <Ionicons name="trash-outline" size={16} color="#b45309" />
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
          <AdminInput
            label="Order"
            value={String(slide.order ?? index)}
            onChangeText={(value) => updateSlide(slide.id, { order: Number.parseInt(value, 10) || 0 })}
            integer
          />
          <AdminInput
            label="Image URL"
            value={slide.url}
            onChangeText={(value) => updateSlide(slide.id, { url: value, mediaType: "image" })}
            placeholder="https://…"
            autoCapitalize="none"
          />
          <AdminInput label="Title (optional)" value={slide.title} onChangeText={(value) => updateSlide(slide.id, { title: value })} />
          <AdminInput
            label="Subtitle (optional)"
            value={slide.subtitle}
            onChangeText={(value) => updateSlide(slide.id, { subtitle: value })}
            multiline
            numberOfLines={2}
          />
          <AdminToggleRow
            title="Enabled"
            subtitle="Off stays saved and does not show on Home"
            value={slide.enabled !== false}
            onValueChange={(enabled) => updateSlide(slide.id, { enabled })}
            isLast
          />
        </View>
      ))}

      <AdminButton
        label="Add slide"
        variant="soft"
        icon="add-outline"
        onPress={addSlide}
        disabled={heroSlides.length >= MAX_SLIDES}
      />
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    blockHint: {
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      lineHeight: 17,
      color: c.textMuted,
      marginBottom: spacing.xs,
    },
    card: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: c.surface,
    },
    cardTop: { flexDirection: "row", gap: spacing.md },
    cardMeta: { flex: 1, minWidth: 0, gap: spacing.xs },
    cardLabel: { fontFamily: fonts.bold, fontSize: typography.bodySmall },
    remove: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
    removeText: { fontFamily: fonts.medium, fontSize: 12.5, color: "#b45309" },
    previewEmpty: {
      width: 88,
      height: 110,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    previewImage: { width: 88, height: 110, borderRadius: radius.md },
  });
}
