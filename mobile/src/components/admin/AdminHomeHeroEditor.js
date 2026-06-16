import React, { useState } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import PremiumButton from "../ui/PremiumButton";
import PremiumInput from "../ui/PremiumInput";
import AdminToggleRow from "./AdminToggleRow";
import { useTheme } from "../../context/ThemeContext";
import { uploadAdminProductImage } from "../../services/adminService";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { fonts, radius, spacing, typography } from "../../theme/tokens";
import { newHeroSlideId } from "../../utils/homeViewMedia";

const MAX_SLIDES = HOME_SCREEN_UI.heroSlider?.maxProductSlides ?? 4;

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
    onHeroSlidesChange(
      heroSlides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))
    );
  };

  const removeSlide = (id) => {
    onHeroSlidesChange(heroSlides.filter((slide) => slide.id !== id));
  };

  const moveSlide = (id, direction) => {
    const idx = heroSlides.findIndex((slide) => slide.id === id);
    if (idx < 0) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= heroSlides.length) return;
    const next = [...heroSlides];
    const [item] = next.splice(idx, 1);
    next.splice(nextIdx, 0, item);
    onHeroSlidesChange(next.map((slide, order) => ({ ...slide, order })));
  };

  const addSlide = () => {
    if (heroSlides.length >= MAX_SLIDES) {
      onError?.(`Maximum ${MAX_SLIDES} slides. Remove one to add another.`);
      return;
    }
    onHeroSlidesChange([
      ...heroSlides,
      {
        id: newHeroSlideId(),
        order: heroSlides.length,
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
      <Text style={styles.blockHint}>
        Up to {MAX_SLIDES} images for the home carousel (web + app). Empty slides are skipped on the
        storefront; product photos are used as fallback.
      </Text>

      {heroSlides.map((slide, index) => (
        <View key={slide.id} style={[styles.card, { borderColor: c.border }]}>
          <View style={styles.cardTop}>
            <SlidePreview slide={slide} styles={styles} />
            <View style={styles.cardMeta}>
              <Text style={[styles.cardLabel, { color: c.textPrimary }]}>Slide {index + 1}</Text>
              <PremiumButton
                label={slide.url ? "Replace image" : "Upload image"}
                size="sm"
                variant="secondary"
                iconLeft="image-outline"
                loading={uploadingKey === slide.id}
                disabled={Boolean(uploadingKey)}
                onPress={() => uploadForSlide(slide)}
              />
              <View style={styles.row}>
                <Pressable onPress={() => moveSlide(slide.id, -1)} style={styles.iconBtn}>
                  <Ionicons name="arrow-up" size={18} color={c.textSecondary} />
                </Pressable>
                <Pressable onPress={() => moveSlide(slide.id, 1)} style={styles.iconBtn}>
                  <Ionicons name="arrow-down" size={18} color={c.textSecondary} />
                </Pressable>
                <Pressable onPress={() => removeSlide(slide.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color="#b45309" />
                </Pressable>
              </View>
            </View>
          </View>
          <PremiumInput
            label="Slide title"
            value={slide.title}
            onChangeText={(value) => updateSlide(slide.id, { title: value })}
          />
          <PremiumInput
            label="Slide subtitle"
            value={slide.subtitle}
            onChangeText={(value) => updateSlide(slide.id, { subtitle: value })}
          />
          <AdminToggleRow
            title="Show on home"
            subtitle="Disabled slides are hidden from the carousel"
            value={slide.enabled !== false}
            onValueChange={(enabled) => updateSlide(slide.id, { enabled })}
            isLast
          />
        </View>
      ))}

      <PremiumButton
        label="Add hero slide"
        variant="outline"
        iconLeft="add"
        onPress={addSlide}
        disabled={heroSlides.length >= MAX_SLIDES}
      />
    </View>
  );
}

function createStyles(c) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
    },
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
    cardTop: {
      flexDirection: "row",
      gap: spacing.md,
    },
    cardMeta: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    cardLabel: {
      fontFamily: fonts.bold,
      fontSize: typography.bodySmall,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      alignItems: "center",
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    previewEmpty: {
      width: 88,
      height: 110,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    previewImage: {
      width: 88,
      height: 110,
      borderRadius: radius.md,
    },
  });
}
