import React, { useEffect, useMemo, useState } from "react";
import { ADMIN_GATE } from "../../content/adminContent";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import KankregScrollPage from "../../components/kankreg/KankregScrollPage";
import AdminScreenShell from "../../components/admin/AdminScreenShell";
import KankregAdminShell from "../../components/kankreg/KankregAdminShell";
import { useAuth } from "../../context/AuthContext";
import {
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
  uploadAdminProductImage} from "../../services/adminService";
import { useTheme } from "../../context/ThemeContext";
import { adminGatePanel, adminShellContent, adminTwoColAside, adminTwoColMain, adminTwoColStyle, useAdminCompactLayout } from "../../theme/adminLayout";
import AdminPanel from "../../components/admin/AdminPanel";
import AdminAlerts from "../../components/admin/AdminAlerts";
import AdminBackLink from "../../components/admin/AdminBackLink";
import AdminFilterTabs from "../../components/admin/AdminFilterTabs";
import AdminFormSection from "../../components/admin/AdminFormSection";
import AdminProductFormProgress from "../../components/admin/AdminProductFormProgress";
import AdminProductPageForm from "../../components/admin/AdminProductPageForm";
import AdminProductPreviewCard from "../../components/admin/AdminProductPreviewCard";
import AdminSwitch from "../../components/admin/AdminSwitch";
import AdminToggleRow from "../../components/admin/AdminToggleRow";
import { useAdminConfirm } from "../../components/admin/AdminDialog";
import {
  PRODUCT_FORM_TABS,
  buildFormProgressItems,
  computeProductFormProgress,
} from "../../utils/adminProductHelpers";
import { customerScrollFill } from "../../theme/screenLayout";
import { radius, spacing } from "../../theme/tokens";
import { getImageUriCandidates, PRODUCT_HERO_BLURHASH } from "../../utils/image";
import PremiumErrorBanner from "../../components/ui/PremiumErrorBanner";
import SectionReveal from "../../components/motion/SectionReveal";
import AdminInput from "../../components/admin/AdminInput";
import AdminButton from "../../components/admin/AdminButton";
import { navigateCustomerRoute } from "../../navigation/customerNavigate";

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
  const compact = useAdminCompactLayout();
  const styles = useMemo(() => createAdminAddProductStyles(c, shadowPremium), [c, shadowPremium]);
    const { token, user } = useAuth();
  const editingProduct = route?.params?.product || null;
  const { confirm, dialog } = useAdminConfirm();

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
  const [category, setCategory] = useState(editingProduct?.category || "General");
  const [homeSection, setHomeSection] = useState(editingProduct?.homeSection || "Prime Products");
  const [productType, setProductType] = useState(editingProduct?.productType || editingProduct?.category || "");
  const [showOnHome, setShowOnHome] = useState(editingProduct?.showOnHome !== false);
  const [isPublished, setIsPublished] = useState(editingProduct?.isPublished !== false);
  const [homeOrder, setHomeOrder] = useState(
    editingProduct?.homeOrder !== undefined ? String(editingProduct.homeOrder) : ""
  );
  const [brand, setBrand] = useState(editingProduct?.brand || "");
  const [sku, setSku] = useState(editingProduct?.sku || "");
  const [unit, setUnit] = useState(editingProduct?.unit || "1 pc");
  const [eta, setEta] = useState(editingProduct?.eta || "10 MINS");
  const [isSpecial, setIsSpecial] = useState(Boolean(editingProduct?.isSpecial));
  const [comingSoon, setComingSoon] = useState(Boolean(editingProduct?.comingSoon));
  const [comingSoonNote, setComingSoonNote] = useState(editingProduct?.comingSoonNote || "");
  const [inStock, setInStock] = useState(editingProduct ? editingProduct.inStock !== false : false);
  const [stockQty, setStockQty] = useState(
    editingProduct?.stockQty !== undefined ? String(editingProduct.stockQty) : "0"
  );
  const [stockCounter, setStockCounter] = useState(
    editingProduct?.stockCounter !== undefined ? String(editingProduct.stockCounter) : "0"
  );
  const [reorderMinOnline, setReorderMinOnline] = useState(
    editingProduct?.reorderMinOnline !== undefined ? String(editingProduct.reorderMinOnline) : "0"
  );
  const [reorderMinCounter, setReorderMinCounter] = useState(
    editingProduct?.reorderMinCounter !== undefined ? String(editingProduct.reorderMinCounter) : "0"
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
  const [pageEyebrow, setPageEyebrow] = useState(editingProduct?.pageEyebrow || "");
  const [deliveryTitle, setDeliveryTitle] = useState(editingProduct?.deliveryTitle || "");
  const [deliveryBody, setDeliveryBody] = useState(editingProduct?.deliveryBody || "");
  const [highlightsText, setHighlightsText] = useState(
    Array.isArray(editingProduct?.highlights) ? editingProduct.highlights.join("\n") : ""
  );
  const [storyKick, setStoryKick] = useState(editingProduct?.storyKick || "");
  const [storyTitle, setStoryTitle] = useState(editingProduct?.storyTitle || "");
  const [storyLegend, setStoryLegend] = useState(editingProduct?.storyLegend || "");
  const [reviewsKick, setReviewsKick] = useState(editingProduct?.reviewsKick || "");
  const [reviewsTitle, setReviewsTitle] = useState(editingProduct?.reviewsTitle || "");
  const [nutritionKick, setNutritionKick] = useState(editingProduct?.nutrition?.kick || "");
  const [nutritionTitle, setNutritionTitle] = useState(editingProduct?.nutrition?.title || "");
  const [nutritionTableHead, setNutritionTableHead] = useState(editingProduct?.nutrition?.tableHead || "");
  const [nutritionTableSub, setNutritionTableSub] = useState(editingProduct?.nutrition?.tableSub || "");
  const [nutritionRowsText, setNutritionRowsText] = useState(() => {
    const rows = editingProduct?.nutrition?.rows;
    if (!Array.isArray(rows) || !rows.length) return "";
    return rows.map((r) => `${String(r.label || "").trim()}|${String(r.value || "").trim()}`).join("\n");
  });
  const [nutritionCardTitle, setNutritionCardTitle] = useState(editingProduct?.nutrition?.cardTitle || "");
  const [nutritionCardBody, setNutritionCardBody] = useState(editingProduct?.nutrition?.cardBody || "");
  const [nutritionCardTagsText, setNutritionCardTagsText] = useState(
    Array.isArray(editingProduct?.nutrition?.cardTags) ? editingProduct.nutrition.cardTags.join(", ") : ""
  );
  const [nutritionCardFooter, setNutritionCardFooter] = useState(editingProduct?.nutrition?.cardFooter || "");
  const [variantRows, setVariantRows] = useState(() => {
    const v = editingProduct?.variants;
    if (Array.isArray(v) && v.length) {
      return v.map((row) => ({
        label: String(row.label ?? ""),
        price: String(row.price ?? ""),
        tag: String(row.tag ?? ""),
      }));
    }
    return [];
  });
  const [trustRows, setTrustRows] = useState(() => {
    const t = editingProduct?.trustChips;
    if (Array.isArray(t) && t.length) {
      return t.map((row) => ({
        icon: String(row.icon ?? "shield-checkmark-outline"),
        label: String(row.label ?? ""),
      }));
    }
    return [];
  });
  const [uspRows, setUspRows] = useState(() => {
    const u = editingProduct?.usps;
    if (Array.isArray(u) && u.length) {
      return u.map((row) => ({
        icon: String(row.icon ?? "checkmark-circle-outline"),
        title: String(row.title ?? ""),
        description: String(row.description ?? "")}));
    }
    return [];
  });
  const [usageRows, setUsageRows] = useState(() => {
    const u = editingProduct?.usageRituals;
    if (Array.isArray(u) && u.length) {
      return u.map((row) => ({
        icon: String(row.icon ?? "sunny-outline"),
        title: String(row.title ?? ""),
        description: String(row.description ?? "")}));
    }
    return [];
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basics");

  const formProgress = useMemo(
    () =>
      computeProductFormProgress({
        name,
        price,
        primaryImage,
        photoUrls,
        category,
        homeSection,
        productType,
        isPublished,
        description,
        pageEyebrow,
        richProductPage,
        trustRows,
        variantRows,
        storyTitle,
        uspRows,
        nutritionTitle,
        nutritionRowsText,
        usageRows,
      }),
    [
      name,
      price,
      primaryImage,
      photoUrls,
      category,
      homeSection,
      productType,
      isPublished,
      description,
      pageEyebrow,
      richProductPage,
      trustRows,
      variantRows,
      storyTitle,
      uspRows,
      nutritionTitle,
      nutritionRowsText,
      usageRows,
    ]
  );

  const progressItems = useMemo(() => buildFormProgressItems(formProgress), [formProgress]);

  const pageForm = useMemo(
    () => ({
      richProductPage,
      setRichProductPage,
      pageEyebrow,
      setPageEyebrow,
      description,
      setDescription,
      deliveryTitle,
      setDeliveryTitle,
      deliveryBody,
      setDeliveryBody,
      highlightsText,
      setHighlightsText,
      trustRows,
      setTrustRows,
      ratingAverage,
      setRatingAverage,
      reviewCount,
      setReviewCount,
      badgeText,
      setBadgeText,
      lifestyleImage,
      setLifestyleImage,
      variantRows,
      setVariantRows,
      storyKick,
      setStoryKick,
      storyTitle,
      setStoryTitle,
      storyLegend,
      setStoryLegend,
      uspRows,
      setUspRows,
      processTitle,
      setProcessTitle,
      processStepsText,
      setProcessStepsText,
      highlightQuote,
      setHighlightQuote,
      nutritionKick,
      setNutritionKick,
      nutritionTitle,
      setNutritionTitle,
      nutritionTableHead,
      setNutritionTableHead,
      nutritionTableSub,
      setNutritionTableSub,
      nutritionRowsText,
      setNutritionRowsText,
      nutritionCardTitle,
      setNutritionCardTitle,
      nutritionCardBody,
      setNutritionCardBody,
      nutritionCardTagsText,
      setNutritionCardTagsText,
      nutritionCardFooter,
      setNutritionCardFooter,
      reviewsKick,
      setReviewsKick,
      reviewsTitle,
      setReviewsTitle,
      usageRows,
      setUsageRows,
    }),
    [
      richProductPage,
      pageEyebrow,
      description,
      deliveryTitle,
      deliveryBody,
      highlightsText,
      trustRows,
      ratingAverage,
      reviewCount,
      badgeText,
      lifestyleImage,
      variantRows,
      storyKick,
      storyTitle,
      storyLegend,
      uspRows,
      processTitle,
      processStepsText,
      highlightQuote,
      nutritionKick,
      nutritionTitle,
      nutritionTableHead,
      nutritionTableSub,
      nutritionRowsText,
      nutritionCardTitle,
      nutritionCardBody,
      nutritionCardTagsText,
      nutritionCardFooter,
      reviewsKick,
      reviewsTitle,
      usageRows,
    ]
  );

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
        base64: true});

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
        mimeType: asset.mimeType || "image/jpeg"});

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

  const onStockQtyChange = (text) => {
    setStockQty(text);
    const n = Number.parseInt(String(text).trim(), 10);
    if (!Number.isFinite(n)) return;
    setInStock(n > 0);
  };

  const onStockSwitch = (on) => {
    if (on) {
      setInStock(true);
      const n = Number.parseInt(String(stockQty).trim(), 10);
      if (!Number.isFinite(n) || n < 1) setStockQty("1");
      return;
    }
    setInStock(false);
  };

  const handleDelete = async () => {
    if (!editingProduct?._id && !editingProduct?.id) return;
    const label = String(name || editingProduct.name || "this jar").trim() || "this jar";
    const ok = await confirm({ title: `Delete ${label}?`, tone: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      setError("");
      await deleteAdminProduct(token, editingProduct._id || editingProduct.id);
      navigation.navigate("AdminProducts");
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const parsedPrice = Number(price);
    if (price.trim() === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Price is required and must be at least 0.");
      return;
    }

    const parsedStockQty = stockQty.trim() === "" ? 0 : Number(stockQty);
    if (!Number.isFinite(parsedStockQty) || parsedStockQty < 0) {
      setError("Stock count must be 0 or more.");
      return;
    }

    if (mrp.trim() !== "") {
      const m = Number(mrp);
      if (!Number.isFinite(m) || m < 0) {
        setError("MRP must be 0 or more, or leave blank.");
        return;
      }
    }

    try {
      setIsSaving(true);
      setError("");

      const images = dedupeUrls(photoUrls);
      const parsedHomeOrder = homeOrder.trim() === "" ? 0 : Number(homeOrder);
      const payload = {
        name: name.trim(),
        price: parsedPrice,
        image: primaryImage || images[0] || "",
        images,
        description: description.trim(),
        category: category.trim() || "General",
        homeSection: homeSection.trim() || "Prime Products",
        productType: productType.trim() || category.trim() || "General",
        showOnHome,
        isPublished,
        homeOrder: Number.isFinite(parsedHomeOrder) ? parsedHomeOrder : 0,
        brand: brand.trim(),
        sku: sku.trim(),
        unit: unit.trim() || "1 pc",
        eta: eta.trim() || "10 MINS",
        isSpecial,
        comingSoon,
        comingSoonNote: comingSoonNote.trim(),
        inStock,
        stockQty: Math.max(0, Math.floor(parsedStockQty)),
        stockCounter: Math.max(0, Math.floor(Number(stockCounter) || 0)),
        reorderMinOnline: Math.max(0, Math.floor(Number(reorderMinOnline) || 0)),
        reorderMinCounter: Math.max(0, Math.floor(Number(reorderMinCounter) || 0)),
      };

      if (mrp.trim() !== "") {
        payload.mrp = Number(mrp);
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
          tag: String(r.tag || "").trim(),
        }))
        .filter((r) => r.label && Number.isFinite(r.price) && r.price >= 0);

      const trustPayload = trustRows
        .map((r) => ({
          icon: String(r.icon || "shield-checkmark-outline").trim() || "shield-checkmark-outline",
          label: String(r.label || "").trim(),
        }))
        .filter((r) => r.label);

      const highlightsPayload = highlightsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const nutritionRowsPayload = nutritionRowsText
        .split("\n")
        .map((line) => {
          const [label, value] = line.split("|").map((s) => s.trim());
          return { label: label || "", value: value || "" };
        })
        .filter((r) => r.label && r.value);

      const nutritionCardTagsPayload = nutritionCardTagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const uspsPayload = uspRows
        .map((r) => ({
          icon: String(r.icon || "checkmark-circle-outline").trim() || "checkmark-circle-outline",
          title: String(r.title || "").trim(),
          description: String(r.description || "").trim()}))
        .filter((r) => r.title || r.description);

      const usagePayload = usageRows
        .map((r) => ({
          icon: String(r.icon || "sunny-outline").trim() || "sunny-outline",
          title: String(r.title || "").trim(),
          description: String(r.description || "").trim()}))
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
      payload.pageEyebrow = pageEyebrow.trim();
      payload.trustChips = trustPayload;
      payload.highlights = highlightsPayload;
      payload.deliveryTitle = deliveryTitle.trim();
      payload.deliveryBody = deliveryBody.trim();
      payload.storyKick = storyKick.trim();
      payload.storyTitle = storyTitle.trim();
      payload.storyLegend = storyLegend.trim();
      payload.reviewsKick = reviewsKick.trim();
      payload.reviewsTitle = reviewsTitle.trim();
      payload.nutrition = {
        kick: nutritionKick.trim(),
        title: nutritionTitle.trim(),
        tableHead: nutritionTableHead.trim(),
        tableSub: nutritionTableSub.trim(),
        rows: nutritionRowsPayload,
        cardTitle: nutritionCardTitle.trim(),
        cardBody: nutritionCardBody.trim(),
        cardTags: nutritionCardTagsPayload,
        cardFooter: nutritionCardFooter.trim(),
      };

      if (editingProduct) {
        await updateAdminProduct(token, editingProduct._id || editingProduct.id, payload);
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
      <AdminScreenShell style={styles.screen}>
        <KankregScrollPage
        scrollVariant="inner"
        showFooter={false}
          style={customerScrollFill}
          showsVerticalScrollIndicator={false}
        >
          <SectionReveal delay={40} preset="fade-up">
            <View style={styles.gatePanel}>
              <PremiumErrorBanner
                severity="warning"
                title={ADMIN_GATE.title}
                message="This account does not have admin privileges."
              />
              <AdminButton
                label={ADMIN_GATE.backHome}
                icon="home-outline"
                variant="primary"
                size="md"
                onPress={() => navigateCustomerRoute(navigation, "Home")}
                style={styles.gateCta}
              />
            </View>
          </SectionReveal>
        </KankregScrollPage>
      </AdminScreenShell>
    );
  }

  return (
    <AdminScreenShell style={styles.screen}>
      <KankregAdminShell
        navigation={navigation}
        route={route}
        title={editingProduct ? "Edit product" : "Add product"}
        subtitle={
          editingProduct
            ? `Updating ${editingProduct.name || "catalog item"}`
            : "Name, price, stock, then listing"
        }
        headerRight={
          <>
            {editingProduct ? (
              <AdminButton label="Delete" variant="danger" size="sm" onPress={handleDelete} />
            ) : null}
            <AdminButton label="Cancel" variant="ghost" size="sm" onPress={() => navigation.goBack()} />
            <AdminButton
              label={isSaving ? "Saving…" : "Save"}
              variant="primary"
              size="sm"
              loading={isSaving}
              disabled={isSaving}
              onPress={handleSubmit}
            />
          </>
        }
      >
        {compact ? (
          <View style={styles.stickyTabs}>
            <AdminAlerts error={error} onCloseError={() => setError("")} />
            <AdminFilterTabs style={styles.formTabsSticky} value={activeTab} onChange={setActiveTab} items={PRODUCT_FORM_TABS} />
          </View>
        ) : null}
    <KeyboardAvoidingView style={customerScrollFill} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <KankregScrollPage
        scrollVariant="admin"
        showFooter={false}
      style={customerScrollFill}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[adminTwoColStyle(compact), styles.panel, compact && styles.panelPhonePad]}>
        <View style={adminTwoColMain(compact)}>
        {compact ? null : <AdminAlerts error={error} onCloseError={() => setError("")} />}
        <AdminBackLink navigation={navigation} label="All products" target="AdminProducts" style={styles.backLink} />
        {compact ? null : (
          <AdminProductFormProgress
            items={progressItems}
            activeKey={activeTab}
            onSelect={setActiveTab}
          />
        )}
        {compact ? null : (
          <AdminFilterTabs style={styles.formTabs} value={activeTab} onChange={setActiveTab} items={PRODUCT_FORM_TABS} />
        )}

        {activeTab === "basics" ? (
        <AdminPanel title="Basics" meta="Required to publish">
        {uploadMessage ? (
          <View style={styles.fieldGap}>
            <PremiumErrorBanner severity="success" message={uploadMessage} onClose={() => setUploadMessage("")} compact />
          </View>
        ) : null}

        <View style={styles.fieldGap}>
          <AdminInput label="Product name" value={name} onChangeText={setName} icon="cube-outline" />
        </View>
        <View style={styles.fieldGap}>
          <AdminInput
            label="Price (sale)"
            value={price}
            onChangeText={setPrice}
            numeric
            icon="pricetag-outline"
          />
        </View>
        <View style={styles.fieldGap}>
          <AdminInput
            label="MRP (optional)"
            value={mrp}
            onChangeText={setMrp}
            numeric
            hint="Shop shows a strike-through MRP only when it is greater than price"
            icon="trending-up-outline"
          />
        </View>
        <View style={styles.fieldGap}>
          <AdminInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Short paragraph for the shop"
            icon="document-text-outline"
          />
        </View>

        <AdminFormSection
          title="Photos & cover"
          subtitle="Upload or paste URLs — first photo becomes cover unless you pick another"
          icon="images-outline"
          defaultOpen
          complete={Boolean(primaryImage || photoUrls.length)}
        >
        <AdminButton
          label={isUploadingImage ? "Uploading…" : "Upload photo"}
          icon="cloud-upload-outline"
          variant="secondary"
          size="sm"
          loading={isUploadingImage}
          disabled={isUploadingImage}
          onPress={handlePickAndUpload}
          style={styles.uploadPhotoBtn}
        />

        <View style={styles.manualUrlRow}>
          <View style={styles.manualUrlInputFlex}>
            <AdminInput
              label="Or paste image URL"
              value={manualPhotoUrl}
              onChangeText={setManualPhotoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              icon="link-outline"
            />
          </View>
          <AdminButton
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
                <AdminButton
                  label="Cover"
                  variant={primaryImage === item ? "primary" : "ghost"}
                  size="sm"
                  onPress={() => setPrimaryImage(item)}
                  style={styles.thumbCoverBtn}
                />
                <AdminButton
                  icon="trash-outline"
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
        </AdminFormSection>

        <AdminFormSection
          title="Catalog details"
          subtitle="Category, brand, SKU, pack size & stock"
          icon="pricetag-outline"
          defaultOpen
          complete={Boolean(category?.trim() && (brand?.trim() || unit?.trim()))}
        >
        <View style={styles.fieldGap}>
          <AdminInput label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Dairy" icon="folder-outline" />
        </View>
        <View style={styles.categoryHintWrap}>
          <Text style={styles.categoryHintText}>Quick categories:</Text>
          <View style={styles.categoryChipsRow}>
            {CATEGORY_OPTIONS.map((item) => {
              const on = String(category || "").trim().toLowerCase() === item.toLowerCase();
              return (
                <AdminButton
                  key={item}
                  label={item}
                  size="xs"
                  variant={on ? "gold" : "soft"}
                  onPress={() => setCategory(item)}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <AdminInput label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. Amul" />
          </View>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <AdminInput label="SKU" value={sku} onChangeText={setSku} placeholder="e.g. MLK-1L-001" autoCapitalize="none" />
          </View>
        </View>
        <View style={styles.fieldGap}>
          <AdminInput label="Unit" value={unit} onChangeText={setUnit} placeholder="1 pc" />
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <AdminInput
              label="Online stock"
              value={stockQty}
              onChangeText={onStockQtyChange}
              integer
            />
          </View>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <AdminInput
              label="Floor stock"
              value={stockCounter}
              onChangeText={setStockCounter}
              integer
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <AdminInput
              label="Min online"
              value={reorderMinOnline}
              onChangeText={setReorderMinOnline}
              integer
            />
          </View>
          <View style={[styles.fieldGap, styles.halfInput]}>
            <AdminInput
              label="Min floor"
              value={reorderMinCounter}
              onChangeText={setReorderMinCounter}
              integer
            />
          </View>
        </View>
        <View style={[styles.stockSwitch, { alignSelf: "flex-start" }]}>
          <Text style={styles.stockSwitchLabel}>{inStock ? "In stock" : "Out of stock"}</Text>
          <AdminSwitch value={inStock} onChange={onStockSwitch} accessibilityLabel="In stock" />
        </View>
        </AdminFormSection>
        </AdminPanel>
        ) : null}

        {activeTab === "listing" ? (
        <AdminPanel title="Store listing" meta="Shop, home & launch">
        <AdminFormSection
          title="Placement"
          subtitle="Where this product appears in the storefront"
          icon="storefront-outline"
          defaultOpen
        >
        <View style={styles.fieldGap}>
          <AdminInput
            label="Home section"
            value={homeSection}
            onChangeText={setHomeSection}
            placeholder="e.g. Best Sellers"
            icon="home-outline"
          />
        </View>
        <View style={styles.fieldGap}>
          <AdminInput
            label="Product type"
            value={productType}
            onChangeText={setProductType}
            placeholder="e.g. Milk, Chips, Juice"
            icon="pricetags-outline"
          />
        </View>
        <View style={styles.fieldGap}>
          <AdminInput
            label="Home order"
            value={homeOrder}
            onChangeText={setHomeOrder}
            integer
            placeholder="0, 1, 2…"
            hint="Lower numbers appear first on the home grid"
          />
        </View>
        </AdminFormSection>

        <AdminFormSection
          title="Customer visibility"
          subtitle="Published products appear in the shop. Home toggle controls the home grid."
          icon="eye-outline"
          defaultOpen
        >
        <View style={styles.toggleGroup}>
          <AdminToggleRow
            title="Published in store"
            subtitle="Draft products are hidden from customers"
            value={isPublished}
            onValueChange={setIsPublished}
          />
          <AdminToggleRow
            title="Show on Home"
            subtitle="Include in the home page product grid"
            value={showOnHome}
            onValueChange={setShowOnHome}
          />
          <AdminToggleRow
            title="Special product"
            subtitle="Highlight badge on cards (limited offers, bestsellers)"
            value={isSpecial}
            onValueChange={setIsSpecial}
            isLast
          />
        </View>
        </AdminFormSection>

        <AdminFormSection
          title="Launch visibility"
          subtitle="Coming soon items appear with a launch banner in shop and home"
          icon="rocket-outline"
          complete={comingSoon ? true : false}
        >
        <View style={styles.toggleGroup}>
          <AdminToggleRow
            title="Coming soon"
            subtitle="Show launch state instead of buy now"
            value={comingSoon}
            onValueChange={setComingSoon}
            isLast
          />
        </View>
        {comingSoon && !isPublished ? (
          <View style={styles.fieldGap}>
            <PremiumErrorBanner
              severity="warning"
              message="Turn on Published in store above — draft products are hidden from customers."
              compact
            />
          </View>
        ) : null}
        <View style={styles.fieldGap}>
          <AdminInput
            label="Launch note (optional)"
            value={comingSoonNote}
            onChangeText={setComingSoonNote}
            placeholder="Festive launch · November"
            hint="A coming-soon jar can stay visible and cannot be purchased"
            icon="sparkles-outline"
          />
        </View>
        </AdminFormSection>
        <View style={styles.fieldGap}>
          <AdminInput
            label="ETA"
            value={eta}
            onChangeText={setEta}
            placeholder="10 MINS"
            hint="Shown on the shop card. Default 10 MINS"
          />
        </View>
        </AdminPanel>
        ) : null}

        {activeTab === "page" ? (
        <AdminPanel title="Product page" meta="Rich content on the customer PDP">
        <AdminProductPageForm form={pageForm} fieldStyles={styles} />
        </AdminPanel>
        ) : null}

        {compact ? null : (
        <AdminButton
          label={isSaving ? "Saving…" : "Save"}
          icon="save-outline"
          variant="primary"
          size="md"
          loading={isSaving}
          disabled={isSaving}
          onPress={handleSubmit}
          fullWidth
          style={styles.saveProductBtn}
        />
        )}
        </View>
        {!compact ? (
          <View style={adminTwoColAside(compact)}>
            <AdminPanel title="Store preview">
              <AdminProductPreviewCard
                name={name}
                price={price}
                mrp={mrp}
                category={category}
                primaryImage={primaryImage}
                ImageComponent={RetryImage}
                isPublished={isPublished}
                comingSoon={comingSoon}
                comingSoonNote={comingSoonNote}
                showOnHome={showOnHome}
              />
            </AdminPanel>
          </View>
        ) : null}
      </View>
</KankregScrollPage>
    </KeyboardAvoidingView>
      {compact ? (
        <View style={styles.stickySave}>
          <AdminButton
            label={isSaving ? "Saving…" : "Save"}
            icon="save-outline"
            variant="primary"
            size="md"
            loading={isSaving}
            disabled={isSaving}
            onPress={handleSubmit}
            fullWidth
          />
        </View>
      ) : null}
      {dialog}
      </KankregAdminShell>
    </AdminScreenShell>
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
    flex: 1},
    panel: adminShellContent(),
    panelPhonePad: { paddingBottom: 88 },
    gatePanel: adminGatePanel(c, shadowPremium),
  gateCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start"},
  backLink: { marginBottom: spacing.sm },
  formTabs: { marginBottom: spacing.md },
  formTabsSticky: { marginBottom: 0 },
  stickyTabs: {
    paddingBottom: spacing.xs,
    backgroundColor: c.surface,
    ...Platform.select({
      web: { position: "sticky", top: 0, zIndex: 12 },
      default: {},
    }),
  },
  stockSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingTop: 18,
  },
  stockSwitchLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  compactPreviewPanel: { marginBottom: spacing.md },
  toggleGroup: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: c.surfaceMuted,
    marginBottom: spacing.sm,
  },
  pageHint: {
    color: c.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  stickySave: {
    position: Platform.OS === "web" ? "sticky" : "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    ...Platform.select({
      web: { zIndex: 20 },
      default: {},
    }),
  },
  fieldGap: {
    marginBottom: spacing.sm},
  categoryHintWrap: {
    marginTop: -4,
    marginBottom: spacing.sm},
  categoryHintText: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6},
  categoryChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs},
  uploadPhotoBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm},
  halfInputChip: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 44},
  toggleChipFull: {
    alignSelf: "stretch",
    marginBottom: spacing.sm},
  manualUrlRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end",
    marginBottom: spacing.sm},
  manualUrlInputFlex: {
    flex: 1,
    minWidth: 0},
  addUrlBtnWrap: {
    marginBottom: 6},
  coverWrap: {
    marginBottom: spacing.sm},
  coverLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6},
  coverImage: {
    width: "100%",
    height: 190,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceMuted},
  photosList: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm},
  thumbCard: {
    width: 124,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
    overflow: "hidden"},
  thumbImage: {
    width: "100%",
    height: 88,
    backgroundColor: c.surfaceMuted},
  retryImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted},
  thumbActions: {
    flexDirection: "row",
    padding: 6,
    gap: 6,
    alignItems: "center"},
  thumbCoverBtn: {
    flex: 1,
    minWidth: 0},
  thumbDeleteBtn: {
    flexShrink: 0},
  saveProductBtn: {
    marginTop: spacing.md},
  saveProductBtnCompact: {
    marginBottom: 72,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm},
  halfInput: {
    flex: 1},
  blockCard: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: c.surfaceMuted},
  addRowBtn: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm},
  removeRowBtn: {
    alignSelf: "flex-end",
    marginTop: spacing.xs},
  variantRowWrap: {
    marginBottom: spacing.xs},
  previewCard: {
    alignItems: "stretch",
    gap: spacing.sm},
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted},
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center"},
  previewName: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: "700"},
  previewPrice: {
    color: c.primaryDark,
    fontSize: 16,
    fontWeight: "700"},
  previewMrp: {
    color: c.textMuted,
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "line-through"},
  previewMeta: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1},
  previewChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  previewHint: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: spacing.xs}});
}
