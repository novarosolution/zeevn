import React, { memo } from "react";
import { View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import HighlightQuoteBand from "./rich/HighlightQuoteBand";
import USPsGrid from "./rich/USPsGrid";
import LifestyleBleed from "./rich/LifestyleBleed";
import ProcessSteps from "./rich/ProcessSteps";
import UsageRituals from "./rich/UsageRituals";
import SourcingBlock, { hasSourcingData } from "./rich/SourcingBlock";

export function hasRichProductContent(item) {
  if (!item) return false;
  if (item.richProductPage) return true;
  return Boolean(
    item.badgeText ||
      item.lifestyleImage ||
      item.highlightQuote ||
      (Array.isArray(item.usps) && item.usps.length) ||
      (Array.isArray(item.processSteps) && item.processSteps.length) ||
      (Array.isArray(item.usageRituals) && item.usageRituals.length) ||
      hasSourcingData(item.sourcing)
  );
}

function ProductRichDetailsBase({ product }) {
  const { SPACING } = useTheme();
  const gutter = SPACING.lg;

  const quote = String(product?.highlightQuote || "").trim();
  const attribution = String(product?.highlightQuoteAttribution || "").trim();
  const usps = Array.isArray(product?.usps) ? product.usps : [];
  const lifestyleUri = String(product?.lifestyleImage || "").trim();
  const lifestyleCaption = String(product?.lifestyleCaption || "").trim();
  const processSteps = Array.isArray(product?.processSteps) ? product.processSteps : [];
  const processTitle = String(product?.processTitle || "").trim();
  const processImage = String(product?.processImage || "").trim();
  const usageRituals = Array.isArray(product?.usageRituals) ? product.usageRituals : [];
  const sourcing = product?.sourcing;

  return (
    <View style={{ width: "100%", gap: 0 }}>
      {quote ? <HighlightQuoteBand quote={quote} attribution={attribution} gutter={gutter} /> : null}
      {usps.length > 0 ? <USPsGrid usps={usps} gutter={gutter} /> : null}
      {lifestyleUri ? <LifestyleBleed imageUri={lifestyleUri} caption={lifestyleCaption} gutter={gutter} /> : null}
      {processSteps.length > 0 ? (
        <ProcessSteps steps={processSteps} processTitle={processTitle} processImageUri={processImage} gutter={gutter} />
      ) : null}
      {usageRituals.length > 0 ? <UsageRituals rituals={usageRituals} gutter={gutter} /> : null}
      {hasSourcingData(sourcing) ? <SourcingBlock sourcing={sourcing} gutter={gutter} /> : null}
    </View>
  );
}

const ProductRichDetails = memo(ProductRichDetailsBase);

export default ProductRichDetails;
