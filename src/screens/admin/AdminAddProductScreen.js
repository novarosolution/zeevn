import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppFooter from "../../components/AppFooter";
import CustomerScreenShell from "../../components/CustomerScreenShell";
import AdminBackLink from "../../components/admin/AdminBackLink";
import { useAuth } from "../../context/AuthContext";
import {
  createAdminProduct,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { adminPanel } from "../../theme/adminLayout";
import { customerScrollFill } from "../../theme/screenLayout";
import { fonts, layout, radius, spacing, typography } from "../../theme/tokens";
import { getImageUriCandidates } from "../../utils/image";

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
  }, [user?.isAdmin, navigation]);

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
      <CustomerScreenShell style={styles.screen}>
        <View style={[styles.panel, { margin: spacing.lg }]}>
          <Text style={styles.title}>Admin Access Required</Text>
          <Text style={styles.subtitle}>This account does not have admin privileges.</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.saveBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </CustomerScreenShell>
    );
  }

  return (
    <CustomerScreenShell style={styles.screen}>
    <ScrollView
      style={customerScrollFill}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.panel}>
        <AdminBackLink navigation={navigation} target="AdminProducts" label="Products" />
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <MaterialCommunityIcons name="package-variant-closed" size={18} color={c.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.subtitle}>Create products with multiple photos and choose a cover image.</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {uploadMessage ? <Text style={styles.successText}>{uploadMessage}</Text> : null}

        <TextInput style={styles.input} placeholder="Product name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="Price (sale)"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="MRP (optional, for strike price & % off)"
          value={mrp}
          onChangeText={setMrp}
          keyboardType="decimal-pad"
        />

        <View style={styles.photoHeader}>
          <Text style={styles.photoHeaderText}>Product Photos</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handlePickAndUpload} disabled={isUploadingImage}>
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={c.onPrimary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={15} color={c.onPrimary} />
                <Text style={styles.uploadBtnText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.manualUrlRow}>
          <TextInput
            style={[styles.input, styles.manualUrlInput]}
            placeholder="Or paste image URL"
            value={manualPhotoUrl}
            onChangeText={setManualPhotoUrl}
          />
          <TouchableOpacity
            style={styles.addUrlBtn}
            onPress={() => {
              addPhotoUrl(manualPhotoUrl);
              setManualPhotoUrl("");
            }}
          >
            <Text style={styles.addUrlBtnText}>Add</Text>
          </TouchableOpacity>
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
                <TouchableOpacity
                  style={[
                    styles.thumbBtn,
                    primaryImage === item ? styles.thumbBtnPrimary : null,
                  ]}
                  onPress={() => setPrimaryImage(item)}
                >
                  <Text
                    style={[
                      styles.thumbBtnText,
                      primaryImage === item ? styles.thumbBtnTextPrimary : null,
                    ]}
                  >
                    Cover
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.thumbDeleteBtn} onPress={() => removePhoto(item)}>
                  <Ionicons name="trash-outline" size={14} color={c.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <TextInput
          style={styles.input}
          placeholder="Category (e.g. Dairy)"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Home Section (e.g. Best Sellers)"
          value={homeSection}
          onChangeText={setHomeSection}
        />
        <TextInput
          style={styles.input}
          placeholder="Product Type (e.g. Milk, Chips, Juice)"
          value={productType}
          onChangeText={setProductType}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Home Order (0,1,2...)"
            value={homeOrder}
            onChangeText={setHomeOrder}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[styles.toggleBtn, styles.halfInput, showOnHome ? styles.toggleBtnActive : null]}
            onPress={() => setShowOnHome((current) => !current)}
          >
            <Text style={[styles.toggleBtnText, showOnHome ? styles.toggleBtnTextActive : null]}>
              {showOnHome ? "Show on Home: ON" : "Show on Home: OFF"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoryHintWrap}>
          <Text style={styles.categoryHintText}>Quick categories:</Text>
          <View style={styles.categoryChipsRow}>
            {CATEGORY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryChip,
                  String(category || "").trim().toLowerCase() === item.toLowerCase()
                    ? styles.categoryChipActive
                    : null,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    String(category || "").trim().toLowerCase() === item.toLowerCase()
                      ? styles.categoryChipTextActive
                      : null,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Brand (e.g. Amul)"
            value={brand}
            onChangeText={setBrand}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="SKU (e.g. MLK-1L-001)"
            value={sku}
            onChangeText={setSku}
          />
        </View>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Unit (e.g. 1 kg)" value={unit} onChangeText={setUnit} />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Optional note (e.g. batch)" value={eta} onChangeText={setEta} />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Stock Quantity"
            value={stockQty}
            onChangeText={setStockQty}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              styles.halfInput,
              inStock ? styles.toggleBtnActive : null,
            ]}
            onPress={() => setInStock((current) => !current)}
          >
            <Text style={[styles.toggleBtnText, inStock ? styles.toggleBtnTextActive : null]}>
              {inStock ? "In Stock: ON" : "In Stock: OFF"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, isSpecial ? styles.toggleBtnActive : null]}
          onPress={() => setIsSpecial((current) => !current)}
        >
          <Text style={[styles.toggleBtnText, isSpecial ? styles.toggleBtnTextActive : null]}>
            {isSpecial ? "Special Product: ON" : "Special Product: OFF"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Rich product page (optional)</Text>
        <Text style={styles.sectionHint}>
          Hero badge, ratings, size variants, USPs, lifestyle image, process story, and usage cards — shown on the
          product screen when filled.
        </Text>
        <TouchableOpacity
          style={[styles.toggleBtn, richProductPage ? styles.toggleBtnActive : null]}
          onPress={() => setRichProductPage((current) => !current)}
        >
          <Text style={[styles.toggleBtnText, richProductPage ? styles.toggleBtnTextActive : null]}>
            {richProductPage ? "Use rich layout: ON" : "Use rich layout: OFF"}
          </Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Rating avg (0–5)"
            value={ratingAverage}
            onChangeText={setRatingAverage}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Review count"
            value={reviewCount}
            onChangeText={setReviewCount}
            keyboardType="number-pad"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Hero badge (e.g. HAND CHURNED)"
          value={badgeText}
          onChangeText={setBadgeText}
        />
        <TextInput
          style={styles.input}
          placeholder="Lifestyle image URL (full-width)"
          value={lifestyleImage}
          onChangeText={setLifestyleImage}
        />

        <Text style={styles.subSectionLabel}>Size / price variants</Text>
        <Text style={styles.sectionHint}>Leave empty to sell a single price. Each row: label (e.g. 500ml) + price.</Text>
        {variantRows.map((row, idx) => (
          <View key={`v-${idx}`} style={styles.variantRowWrap}>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Label"
                value={row.label}
                onChangeText={(t) =>
                  setVariantRows((rows) => rows.map((r, i) => (i === idx ? { ...r, label: t } : r)))
                }
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Price"
                value={row.price}
                onChangeText={(t) =>
                  setVariantRows((rows) => rows.map((r, i) => (i === idx ? { ...r, price: t } : r)))
                }
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity style={styles.removeRowBtn} onPress={() => setVariantRows((rows) => rows.filter((_, i) => i !== idx))}>
              <Text style={styles.removeRowBtnText}>Remove variant</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addRowBtn}
          onPress={() => setVariantRows((rows) => [...rows, { label: "", price: "" }])}
        >
          <Text style={styles.addRowBtnText}>+ Add variant</Text>
        </TouchableOpacity>

        <Text style={styles.subSectionLabel}>Selling points (USPs)</Text>
        {uspRows.map((row, idx) => (
          <View key={`usp-${idx}`} style={styles.blockCard}>
            <TextInput
              style={styles.input}
              placeholder="Ionicons name (e.g. flask-outline)"
              value={row.icon}
              onChangeText={(t) =>
                setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={row.title}
              onChangeText={(t) =>
                setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: t } : r)))
              }
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description"
              value={row.description}
              onChangeText={(t) =>
                setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, description: t } : r)))
              }
              multiline
            />
            <TouchableOpacity
              style={styles.removeRowBtn}
              onPress={() => setUspRows((rows) => rows.filter((_, i) => i !== idx))}
            >
              <Text style={styles.removeRowBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={() => setUspRows((rows) => [...rows, { icon: "flask-outline", title: "", description: "" }])}>
          <Text style={styles.addRowBtnText}>+ Add USP</Text>
        </TouchableOpacity>

        <Text style={styles.subSectionLabel}>Process story</Text>
        <TextInput
          style={styles.input}
          placeholder="Process section title (e.g. The Vedic Bilona Method)"
          value={processTitle}
          onChangeText={setProcessTitle}
        />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Process steps — one per line"
          value={processStepsText}
          onChangeText={setProcessStepsText}
          multiline
        />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Highlight quote"
          value={highlightQuote}
          onChangeText={setHighlightQuote}
          multiline
        />

        <Text style={styles.subSectionLabel}>Usage & rituals</Text>
        {usageRows.map((row, idx) => (
          <View key={`use-${idx}`} style={styles.blockCard}>
            <TextInput
              style={styles.input}
              placeholder="Ionicons name"
              value={row.icon}
              onChangeText={(t) =>
                setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={row.title}
              onChangeText={(t) =>
                setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: t } : r)))
              }
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description"
              value={row.description}
              onChangeText={(t) =>
                setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, description: t } : r)))
              }
              multiline
            />
            <TouchableOpacity
              style={styles.removeRowBtn}
              onPress={() => setUsageRows((rows) => rows.filter((_, i) => i !== idx))}
            >
              <Text style={styles.removeRowBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={() => setUsageRows((rows) => [...rows, { icon: "cafe-outline", title: "", description: "" }])}>
          <Text style={styles.addRowBtnText}>+ Add usage card</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isSaving}>
          <View style={styles.buttonContent}>
            <Ionicons name="save-outline" size={16} color={c.onPrimary} />
            <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Product"}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <AppFooter />
    </ScrollView>
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
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}

function createAdminAddProductStyles(c, shadowPremium) {
  return StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
    alignSelf: "center",
    maxWidth: Platform.select({ web: layout.maxContentWidth, default: "100%" }),
  },
  panel: {
    ...adminPanel(c, shadowPremium),
  },
  title: {
    fontSize: typography.h2,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.35,
    color: c.textPrimary,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primarySoft,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: c.textSecondary,
  },
  successText: {
    color: c.success,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  errorText: {
    color: c.danger,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    marginBottom: spacing.sm,
    backgroundColor: c.surfaceMuted,
    color: c.textPrimary,
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
  categoryChip: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  categoryChipActive: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  categoryChipText: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: c.primary,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  photoHeader: {
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  photoHeaderText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  uploadBtn: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: c.primary,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 9,
  },
  uploadBtnText: {
    color: c.onPrimary,
    fontWeight: "700",
    fontSize: 12,
  },
  manualUrlRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  manualUrlInput: {
    flex: 1,
  },
  addUrlBtn: {
    backgroundColor: c.primarySoft,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addUrlBtnText: {
    color: c.primary,
    fontWeight: "700",
    fontSize: 12,
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
  thumbBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    paddingVertical: 5,
    alignItems: "center",
  },
  thumbBtnPrimary: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  thumbBtnText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  thumbBtnTextPrimary: {
    color: c.primary,
  },
  thumbDeleteBtn: {
    width: 30,
    height: 28,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    marginTop: spacing.xs,
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    color: c.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  toggleBtn: {
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: c.surfaceMuted,
  },
  toggleBtnActive: {
    borderColor: c.primaryBorder,
    backgroundColor: c.primarySoft,
  },
  toggleBtnText: {
    color: c.textPrimary,
    fontWeight: "700",
    fontSize: 12,
  },
  toggleBtnTextActive: {
    color: c.primary,
  },
  sectionHeading: {
    marginTop: spacing.md,
    fontSize: typography.body,
    fontFamily: fonts.extrabold,
    color: c.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  subSectionLabel: {
    marginTop: spacing.sm,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "700",
    color: c.textSecondary,
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
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  addRowBtnText: {
    color: c.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  removeRowBtn: {
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  removeRowBtnText: {
    color: c.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  variantRowWrap: {
    marginBottom: spacing.xs,
  },
  });
}
