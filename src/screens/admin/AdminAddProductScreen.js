import React, { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminPageHeading from "../../components/admin/AdminPageHeading";
import { useAuth } from "../../context/AuthContext";
import {
  createAdminProduct,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../../services/adminService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { adminInnerPageScrollContent, customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { getImageUriCandidates, PRODUCT_HERO_BLURHASH } from "../../utils/image";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import MotionScrollView from "../../components/motion/MotionScrollView";
import SectionReveal from "../../components/motion/SectionReveal";
import PremiumInput from "../../components/ui/PremiumInput";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumChip from "../../components/ui/PremiumChip";
import PremiumSectionHeader from "../../components/ui/PremiumSectionHeader";

function dedupeUrls(urls = []) {
  const seen = new Set();
  return urls.filter((url) => {
    const key = String(url || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const CATEGORY_OPTIONS = [
  "Dairy",
  "Fruits",
  "Vegetables",
  "Snacks",
  "Beverages",
  "Bakery",
  "Personal Care",
  "Household",
  "General",
];

export default function AdminAddProductScreen({ navigation, route }) {
  const { colors: c, shadowPremium } = useTheme();
  const styles = useMemo(() => createAdminAddProductStyles(c, shadowPremium), [c, shadowPremium]);
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const editingProduct = route?.params?.product;

  const initialPhotos = useMemo(() => {
    return dedupeUrls([...(editingProduct?.images || []), editingProduct?.image || ""]);
  }, [editingProduct]);

  const [name, setName] = useState(editingProduct?.name || "");
  const [price, setPrice] = useState(
    editingProduct?.price !== undefined ? String(editingProduct.price) : ""
  );
  const [mrp, setMrp] = useState(
    editingProduct?.mrp !== undefined && editingProduct?.mrp !== null ? String(editingProduct.mrp) : ""
  );
  const [photoUrls, setPhotoUrls] = useState(initialPhotos);
  const [primaryImage, setPrimaryImage] = useState(editingProduct?.image || initialPhotos[0] || "");
  const [manualPhotoUrl, setManualPhotoUrl] = useState("");
  const [description, setDescription] = useState(editingProduct?.description || "");
  const [category, setCategory] = useState(editingProduct?.category || "");
  const [homeSection, setHomeSection] = useState(editingProduct?.homeSection || "Prime Products");
  const [productType, setProductType] = useState(editingProduct?.productType || editingProduct?.category || "");
  const [showOnHome, setShowOnHome] = useState(editingProduct?.showOnHome !== false);
  const [homeOrder, setHomeOrder] = useState(
    editingProduct?.homeOrder !== undefined ? String(editingProduct.homeOrder) : ""
  );
  const [brand, setBrand] = useState(editingProduct?.brand || "");
  const [sku, setSku] = useState(editingProduct?.sku || "");
  const [unit, setUnit] = useState(editingProduct?.unit || "");
  const [eta, setEta] = useState(editingProduct?.eta || "");
  const [isSpecial, setIsSpecial] = useState(Boolean(editingProduct?.isSpecial));
  const [inStock, setInStock] = useState(editingProduct?.inStock !== false);
  const [stockQty, setStockQty] = useState(
    editingProduct?.stockQty !== undefined ? String(editingProduct.stockQty) : ""
  );
  const [ratingAverage, setRatingAverage] = useState(
    editingProduct?.ratingAverage !== undefined ? String(editingProduct.ratingAverage) : ""
  );
  const [reviewCount, setReviewCount] = useState(
    editingProduct?.reviewCount !== undefined ? String(editingProduct.reviewCount) : ""
  );
  const [badgeText, setBadgeText] = useState(editingProduct?.badgeText || "");
  const [lifestyleImage, setLifestyleImage] = useState(editingProduct?.lifestyleImage || "");
  const [processTitle, setProcessTitle] = useState(editingProduct?.processTitle || "");
  const [processStepsText, setProcessStepsText] = useState(
    Array.isArray(editingProduct?.processSteps) ? editingProduct.processSteps.join("\n") : ""
  );
  const [highlightQuote, setHighlightQuote] = useState(editingProduct?.highlightQuote || "");
  const [richProductPage, setRichProductPage] = useState(editingProduct?.richProductPage === true);
  const [variantRows, setVariantRows] = useState(() => {
    const v = editingProduct?.variants;
    if (Array.isArray(v) && v.length) {
      return v.map((row) => ({ label: String(row.label ?? ""), price: String(row.price ?? "") }));
    }
    return [];
  });
  const [uspRows, setUspRows] = useState(() => {
    const u = editingProduct?.usps;
    if (Array.isArray(u) && u.length) {
      return u.map((row) => ({
        icon: String(row.icon ?? "checkmark-circle-outline"),
        title: String(row.title ?? ""),
        description: String(row.description ?? ""),
      }));
    }
    return [];
  });
  const [usageRows, setUsageRows] = useState(() => {
    const u = editingProduct?.usageRituals;
    if (Array.isArray(u) && u.length) {
      return u.map((row) => ({
        icon: String(row.icon ?? "sunny-outline"),
        title: String(row.title ?? ""),
        description: String(row.description ?? ""),
      }));
    }
    return [];
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const title = useMemo(() => (editingProduct ? "Edit Product" : "Add New Product"), [editingProduct]);

  useEffect(() => {
    if (!user) return;
  }, [user]);

  const addPhotoUrl = (url) => {
    const clean = String(url || "").trim();
    if (!clean) return;
    setPhotoUrls((current) => dedupeUrls([...current, clean]));
    setPrimaryImage((current) => current || clean);
  };

  const handlePickAndUpload = async () => {
    try {
      setError("");
      setUploadMessage("");
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setError("Media library permission is required to upload photos.");
          return;
        }
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (picked.canceled) {
        return;
      }

      const asset = picked.assets?.[0];
      if (!asset?.base64) {
        setError("Could not read image. Please try another photo.");
        return;
      }

      setIsUploadingImage(true);
      const uploaded = await uploadAdminProductImage(token, {
        imageBase64: asset.base64,
        mimeType: asset.mimeType || "image/jpeg",
      });

      addPhotoUrl(uploaded.url);
      setUploadMessage("Photo uploaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to upload photo.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removePhoto = (urlToRemove) => {
    setPhotoUrls((current) => {
      const next = current.filter((url) => url !== urlToRemove);
      if (primaryImage === urlToRemove) {
        setPrimaryImage(next[0] || "");
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price.trim()) {
      setError("Product name and price are required.");
      return;
    }

    const parsedStockQty = stockQty.trim() === "" ? 0 : Number(stockQty);
    if (!Number.isFinite(parsedStockQty) || parsedStockQty < 0) {
      setError("Stock quantity must be a valid number (0 or more).");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const images = dedupeUrls(photoUrls);
      const parsedHomeOrder = homeOrder.trim() === "" ? 0 : Number(homeOrder);
      const payload = {
        name: name.trim(),
        price: Number(price),
        image: primaryImage || images[0] || "",
        images,
        description: description.trim(),
        category: category.trim(),
        homeSection: homeSection.trim() || "Prime Products",
        productType: productType.trim() || category.trim() || "General",
        showOnHome,
        homeOrder: Number.isFinite(parsedHomeOrder) ? parsedHomeOrder : 0,
        brand: brand.trim(),
        sku: sku.trim(),
        unit: unit.trim(),
        eta: eta.trim(),
        isSpecial,
        inStock,
        stockQty: Math.max(0, parsedStockQty),
      };

      if (mrp.trim() !== "") {
        const m = Number(mrp);
        if (!Number.isFinite(m) || m <= 0) {
          setError("MRP must be a positive number, or leave blank.");
          setIsSaving(false);
          return;
        }
        payload.mrp = m;
      } else if (editingProduct) {
        payload.mrp = null;
      }

      const processSteps = processStepsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const variantsPayload = variantRows
        .map((r) => ({
          label: String(r.label || "").trim(),
          price: Number(r.price),
        }))
        .filter((r) => r.label && Number.isFinite(r.price) && r.price >= 0);

      const uspsPayload = uspRows
        .map((r) => ({
          icon: String(r.icon || "checkmark-circle-outline").trim() || "checkmark-circle-outline",
          title: String(r.title || "").trim(),
          description: String(r.description || "").trim(),
        }))
        .filter((r) => r.title || r.description);

      const usagePayload = usageRows
        .map((r) => ({
          icon: String(r.icon || "sunny-outline").trim() || "sunny-outline",
          title: String(r.title || "").trim(),
          description: String(r.description || "").trim(),
        }))
        .filter((r) => r.title || r.description);

      const ra = ratingAverage.trim() === "" ? 0 : Number(ratingAverage);
      payload.ratingAverage = Number.isFinite(ra) ? Math.min(5, Math.max(0, ra)) : 0;
      const rc = reviewCount.trim() === "" ? 0 : Number(reviewCount);
      payload.reviewCount = Number.isFinite(rc) ? Math.max(0, Math.floor(rc)) : 0;
      payload.badgeText = badgeText.trim();
      payload.lifestyleImage = lifestyleImage.trim();
      payload.processTitle = processTitle.trim();
      payload.processSteps = processSteps;
      payload.highlightQuote = highlightQuote.trim();
      payload.richProductPage = richProductPage;
      payload.variants = variantsPayload;
      payload.usps = uspsPayload;
      payload.usageRituals = usagePayload;

      if (editingProduct) {
        await updateAdminProduct(token, editingProduct._id, payload);
      } else {
        await createAdminProduct(token, payload);
      }

      navigation.navigate("AdminProducts");
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  if (user && !user.isAdmin) {
    return (
      <CustomerScreenShell style={styles.screen} variant="admin">
        <MotionScrollView
          style={customerScrollFill}
          contentContainerStyle={adminInnerPageScrollContent(insets)}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.panel}>
              <PremiumErrorBanner
                severity="warning"
                title="Admin access required"
                message="This account does not have admin privileges."
              />
              <PremiumButton
                label="Back to home"
                iconLeft="home-outline"
                variant="primary"
                size="md"
                onPress={() => navigation.navigate("Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </MotionScrollView>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen} variant="admin">
    <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <MotionScrollView
      style={customerScrollFill}
      contentContainerStyle={adminInnerPageScrollContent(insets)}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.panel}>
        <AdminBackLink navigation={navigation} target="AdminProducts" label="Products" />
        <AdminPageHeading title={title} subtitle="Create products and choose a cover image." />
        {error ? (
          <View style={styles.fieldGap}>
            <PremiumErrorBanner severity="error" message={error} onClose={() => setError("")} compact />
          </View>
        ) : null}
        {uploadMessage ? (
          <View style={styles.fieldGap}>
            <PremiumErrorBanner severity="success" message={uploadMessage} onClose={() => setUploadMessage("")} compact />
          </View>
        ) : null}

        <View style={styles.fieldGap}>
          <PremiumInput label="Product name" value={name} onChangeText={setName} iconLeft="cube-outline" />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Price (sale)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            iconLeft="pricetag-outline"
          />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="MRP (optional)"
            value={mrp}
            onChangeText={setMrp}
            keyboardType="decimal-pad"
            helperText="Shows strike price and % off"
            iconLeft="trending-up-outline"
          />
        </View>

        <PremiumSectionHeader title="Product photos" compact />
        <PremiumButton
          label={isUploadingImage ? "Uploading…" : "Upload photo"}
          iconLeft="cloud-upload-outline"
          variant="secondary"
          size="sm"
          loading={isUploadingImage}
          disabled={isUploadingImage}
          onPress={handlePickAndUpload}
          style={styles.uploadPhotoBtn}
        />

        <View style={styles.manualUrlRow}>
          <View style={styles.manualUrlInputFlex}>
            <PremiumInput
              label="Or paste image URL"
              value={manualPhotoUrl}
              onChangeText={setManualPhotoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              iconLeft="link-outline"
            />
          </View>
          <PremiumButton
            label="Add"
            variant="ghost"
            size="sm"
            onPress={() => {
              addPhotoUrl(manualPhotoUrl);
              setManualPhotoUrl("");
            }}
            style={styles.addUrlBtnWrap}
          />
        </View>

        {primaryImage ? (
          <View style={styles.coverWrap}>
            <Text style={styles.coverLabel}>Cover Photo</Text>
            <RetryImage sourceUri={primaryImage} style={styles.coverImage} />
          </View>
        ) : null}

        <FlatList
          data={photoUrls}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosList}
          renderItem={({ item }) => (
            <View style={styles.thumbCard}>
              <RetryImage sourceUri={item} style={styles.thumbImage} />
              <View style={styles.thumbActions}>
                <PremiumButton
                  label="Cover"
                  variant={primaryImage === item ? "primary" : "ghost"}
                  size="sm"
                  onPress={() => setPrimaryImage(item)}
                  style={styles.thumbCoverBtn}
                />
                <PremiumButton
                  iconLeft="trash-outline"
                  variant="danger"
                  size="sm"
                  accessibilityLabel="Remove photo"
                  onPress={() => removePhoto(item)}
                  style={styles.thumbDeleteBtn}
                />
              </View>
            </View>
          )}
        />

        <View style={styles.fieldGap}>
          <PremiumInput label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Dairy" iconLeft="folder-outline" />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Home section"
            value={homeSection}
            onChangeText={setHomeSection}
            placeholder="e.g. Best Sellers"
            iconLeft="home-outline"
          />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Product type"
            value={productType}
            onChangeText={setProductType}
            placeholder="e.g. Milk, Chips, Juice"
            iconLeft="pricetags-outline"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput
              label="Home order"
              value={homeOrder}
              onChangeText={setHomeOrder}
              keyboardType="number-pad"
              placeholder="0, 1, 2…"
            />
          </View>
          <PremiumChip
            label={showOnHome ? "Show on Home: ON" : "Show on Home: OFF"}
            tone="gold"
            size="sm"
            selected={showOnHome}
            onPress={() => setShowOnHome((current) => !current)}
            style={styles.halfInputChip}
          />
        </View>
        <View style={styles.categoryHintWrap}>
          <Text style={styles.categoryHintText}>Quick categories:</Text>
          <View style={styles.categoryChipsRow}>
            {CATEGORY_OPTIONS.map((item) => (
              <PremiumChip
                key={item}
                label={item}
                tone="gold"
                size="xs"
                selected={String(category || "").trim().toLowerCase() === item.toLowerCase()}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. Amul" />
          </View>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput label="SKU" value={sku} onChangeText={setSku} placeholder="e.g. MLK-1L-001" autoCapitalize="none" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. 1 kg" />
          </View>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput label="Optional note" value={eta} onChangeText={setEta} placeholder="e.g. batch" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput label="Stock quantity" value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" />
          </View>
          <PremiumChip
            label={inStock ? "In Stock: ON" : "In Stock: OFF"}
            tone="gold"
            size="sm"
            selected={inStock}
            onPress={() => setInStock((current) => !current)}
            style={styles.halfInputChip}
          />
        </View>
        <PremiumChip
          label={isSpecial ? "Special product: ON" : "Special product: OFF"}
          tone="gold"
          size="sm"
          selected={isSpecial}
          onPress={() => setIsSpecial((current) => !current)}
          style={styles.toggleChipFull}
        />

        <PremiumSectionHeader
          title="Rich product page (optional)"
          subtitle="Adds badge, ratings, variants, story, and usage sections when filled."
          compact
        />
        <PremiumChip
          label={richProductPage ? "Use rich layout: ON" : "Use rich layout: OFF"}
          tone="gold"
          size="sm"
          selected={richProductPage}
          onPress={() => setRichProductPage((current) => !current)}
          style={styles.toggleChipFull}
        />
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput
              label="Rating avg (0–5)"
              value={ratingAverage}
              onChangeText={setRatingAverage}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <PremiumInput
              label="Review count"
              value={reviewCount}
              onChangeText={setReviewCount}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput label="Hero badge" value={badgeText} onChangeText={setBadgeText} placeholder="e.g. HAND CHURNED" />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Lifestyle image URL"
            value={lifestyleImage}
            onChangeText={setLifestyleImage}
            autoCapitalize="none"
            iconLeft="image-outline"
          />
        </View>

        <PremiumSectionHeader
          title="Size / price variants"
          subtitle="Leave empty for one price. Each row needs a label and price."
          compact
        />
        {variantRows.map((row, idx) => (
          <View key={`v-${idx}`} style={styles.variantRowWrap}>
            <View style={styles.row}>
              <View style={[styles.fieldGap, styles.halfInput]}>
                <PremiumInput
                  label="Label"
                  value={row.label}
                  onChangeText={(t) =>
                    setVariantRows((rows) => rows.map((r, i) => (i === idx ? { ...r, label: t } : r)))
                  }
                  placeholder="e.g. 500ml"
                />
              </View>
              <View style={[styles.fieldGap, styles.halfInput]}>
                <PremiumInput
                  label="Price"
                  value={row.price}
                  onChangeText={(t) =>
                    setVariantRows((rows) => rows.map((r, i) => (i === idx ? { ...r, price: t } : r)))
                  }
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <PremiumButton
              label="Remove variant"
              variant="danger"
              size="sm"
              onPress={() => setVariantRows((rows) => rows.filter((_, i) => i !== idx))}
              style={styles.removeRowBtn}
            />
          </View>
        ))}
        <PremiumButton
          label="Add variant"
          iconLeft="add-outline"
          variant="ghost"
          size="sm"
          onPress={() => setVariantRows((rows) => [...rows, { label: "", price: "" }])}
          style={styles.addRowBtn}
        />

        <PremiumSectionHeader title="Selling points (USPs)" compact />
        {uspRows.map((row, idx) => (
          <View key={`usp-${idx}`} style={styles.blockCard}>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Ionicons name"
                value={row.icon}
                onChangeText={(t) =>
                  setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
                }
                placeholder="e.g. flask-outline"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Title"
                value={row.title}
                onChangeText={(t) =>
                  setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: t } : r)))
                }
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Description"
                value={row.description}
                onChangeText={(t) =>
                  setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, description: t } : r)))
                }
                multiline
                numberOfLines={3}
              />
            </View>
            <PremiumButton
              label="Remove"
              variant="danger"
              size="sm"
              onPress={() => setUspRows((rows) => rows.filter((_, i) => i !== idx))}
              style={styles.removeRowBtn}
            />
          </View>
        ))}
        <PremiumButton
          label="Add USP"
          iconLeft="add-outline"
          variant="ghost"
          size="sm"
          onPress={() => setUspRows((rows) => [...rows, { icon: "flask-outline", title: "", description: "" }])}
          style={styles.addRowBtn}
        />

        <PremiumSectionHeader title="Process story" compact />
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Process section title"
            value={processTitle}
            onChangeText={setProcessTitle}
            placeholder="e.g. The Vedic Bilona Method"
          />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Process steps"
            value={processStepsText}
            onChangeText={setProcessStepsText}
            placeholder="One per line"
            multiline
            numberOfLines={4}
          />
        </View>
        <View style={styles.fieldGap}>
          <PremiumInput
            label="Highlight quote"
            value={highlightQuote}
            onChangeText={setHighlightQuote}
            multiline
            numberOfLines={2}
          />
        </View>

        <PremiumSectionHeader title="Usage & rituals" compact />
        {usageRows.map((row, idx) => (
          <View key={`use-${idx}`} style={styles.blockCard}>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Ionicons name"
                value={row.icon}
                onChangeText={(t) =>
                  setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
                }
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Title"
                value={row.title}
                onChangeText={(t) =>
                  setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: t } : r)))
                }
              />
            </View>
            <View style={styles.fieldGap}>
              <PremiumInput
                label="Description"
                value={row.description}
                onChangeText={(t) =>
                  setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, description: t } : r)))
                }
                multiline
                numberOfLines={3}
              />
            </View>
            <PremiumButton
              label="Remove"
              variant="danger"
              size="sm"
              onPress={() => setUsageRows((rows) => rows.filter((_, i) => i !== idx))}
              style={styles.removeRowBtn}
            />
          </View>
        ))}
        <PremiumButton
          label="Add usage card"
          iconLeft="add-outline"
          variant="ghost"
          size="sm"
          onPress={() => setUsageRows((rows) => [...rows, { icon: "cafe-outline", title: "", description: "" }])}
          style={styles.addRowBtn}
        />

        <View style={styles.fieldGap}>
          <PremiumInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            iconLeft="document-text-outline"
          />
        </View>

        <PremiumButton
          label={isSaving ? "Saving…" : "Save product"}
          iconLeft="save-outline"
          variant="primary"
          size="lg"
          loading={isSaving}
          disabled={isSaving}
          onPress={handleSubmit}
          fullWidth
          style={styles.saveProductBtn}
        />
      </View>
      <AppFooter />
    </MotionScrollView>
    </KeyboardAvoidingView>
    </CustomerScreenShell>
  );
}

function RetryImage({ sourceUri, style }) {
  const { colors: c } = useTheme();
  const candidates = useMemo(() => getImageUriCandidates(sourceUri), [sourceUri]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sourceUri]);

  const currentUri = candidates[index] || "";
  if (!currentUri) {
    return (
      <View
        style={[
          style,
          { alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceMuted },
        ]}
      >
        <Ionicons name="image-outline" size={16} color={c.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: currentUri }}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
      placeholder={{ blurhash: PRODUCT_HERO_BLURHASH }}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}

function createAdminAddProductStyles(c, shadowPremium) {
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  panel: {
    ...adminPanel(c, shadowPremium),
  },
  gateCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  fieldGap: {
    marginBottom: spacing.sm,
  },
  categoryHintWrap: {
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  categoryHintText: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  categoryChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  uploadPhotoBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  halfInputChip: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 44,
  },
  toggleChipFull: {
    alignSelf: "stretch",
    marginBottom: spacing.sm,
  },
  manualUrlRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end",
    marginBottom: spacing.sm,
  },
  manualUrlInputFlex: {
    flex: 1,
    minWidth: 0,
  },
  addUrlBtnWrap: {
    marginBottom: 6,
  },
  coverWrap: {
    marginBottom: spacing.sm,
  },
  coverLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  coverImage: {
    width: "100%",
    height: 190,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceMuted,
  },
  photosList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumbCard: {
    width: 124,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: 88,
    backgroundColor: c.surfaceMuted,
  },
  retryImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  thumbActions: {
    flexDirection: "row",
    padding: 6,
    gap: 6,
    alignItems: "center",
  },
  thumbCoverBtn: {
    flex: 1,
    minWidth: 0,
  },
  thumbDeleteBtn: {
    flexShrink: 0,
  },
  saveProductBtn: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  blockCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: c.surfaceMuted,
  },
  addRowBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  removeRowBtn: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
  },
  variantRowWrap: {
    marginBottom: spacing.xs,
  },
  });
}
