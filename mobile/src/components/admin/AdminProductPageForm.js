import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AdminFilterTabs from "./AdminFilterTabs";
import AdminFormSection from "./AdminFormSection";
import AdminRepeatBlock from "./AdminRepeatBlock";
import AdminToggleRow from "./AdminToggleRow";
import PremiumButton from "../ui/PremiumButton";
import PremiumChip from "../ui/PremiumChip";
import PremiumInput from "../ui/PremiumInput";
import { PRODUCT_PAGE_TABS, COMMON_IONICONS } from "../../utils/adminProductHelpers";
import { spacing } from "../../theme/tokens";

function IconQuickPick({ value, onChange, style }) {
  return (
    <View style={[stylesIcon.row, style]}>
      {COMMON_IONICONS.map((icon) => (
        <PremiumChip
          key={icon}
          label={icon.replace("-outline", "").replace(/-/g, " ")}
          tone="gold"
          size="xs"
          selected={value === icon}
          onPress={() => onChange(icon)}
        />
      ))}
    </View>
  );
}

const stylesIcon = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
});

export default function AdminProductPageForm({ form, fieldStyles }) {
  const [pageTab, setPageTab] = useState("hero");
  const fs = fieldStyles || {};

  const {
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
  } = form;

  const heroComplete = Boolean(
    description?.trim() || pageEyebrow?.trim() || trustRows?.some((r) => r?.label?.trim())
  );
  const storyComplete = Boolean(
    storyTitle?.trim() || uspRows?.some((r) => r?.title?.trim()) || processTitle?.trim()
  );
  const nutritionComplete = Boolean(nutritionTitle?.trim() || nutritionRowsText?.trim());
  const usageComplete = Boolean(usageRows?.some((r) => r?.title?.trim()));

  return (
    <>
      <View style={fs.toggleGroup}>
        <AdminToggleRow
          title="Rich product page"
          subtitle="Enables story, process, nutrition & usage blocks on the customer PDP"
          value={richProductPage}
          onValueChange={setRichProductPage}
          isLast
        />
      </View>

      <AdminFilterTabs style={fs.formTabs} value={pageTab} onChange={setPageTab} items={PRODUCT_PAGE_TABS} />

      {pageTab === "hero" ? (
        <>
          <AdminFormSection
            title="Hero & purchase area"
            subtitle="Eyebrow, lead copy, delivery note & bullet highlights"
            icon="bag-handle-outline"
            defaultOpen
            complete={heroComplete}
          >
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Page eyebrow"
                value={pageEyebrow}
                onChangeText={setPageEyebrow}
                placeholder="e.g. The Benchmark of Purity"
                helperText="Small label above the product title"
              />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Lead description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholder="Short paragraph under the price"
                iconLeft="document-text-outline"
              />
            </View>
            <View style={fs.row}>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput
                  label="Delivery title"
                  value={deliveryTitle}
                  onChangeText={setDeliveryTitle}
                  placeholder="e.g. Free delivery"
                />
              </View>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput
                  label="Delivery note"
                  value={deliveryBody}
                  onChangeText={setDeliveryBody}
                  placeholder="COD, returns, freshness…"
                />
              </View>
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Highlights"
                value={highlightsText}
                onChangeText={setHighlightsText}
                placeholder="One checkmark bullet per line"
                multiline
                numberOfLines={4}
                helperText="Each line becomes a ✓ under the buy box"
              />
            </View>
          </AdminFormSection>

          <AdminFormSection
            title="Trust chips"
            subtitle="Pill badges under the buy buttons — tap a preset icon or type your own"
            icon="shield-checkmark-outline"
            complete={trustRows?.some((r) => r?.label?.trim()) ? true : false}
          >
            {trustRows.map((row, idx) => (
              <AdminRepeatBlock
                key={`trust-${idx}`}
                index={idx}
                title={`Trust chip ${idx + 1}`}
                onRemove={() => setTrustRows((rows) => rows.filter((_, i) => i !== idx))}
              >
                <IconQuickPick
                  value={row.icon}
                  onChange={(icon) =>
                    setTrustRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon } : r)))
                  }
                />
                <View style={fs.fieldGap}>
                  <PremiumInput
                    label="Ionicons name"
                    value={row.icon}
                    onChangeText={(t) =>
                      setTrustRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
                    }
                    placeholder="shield-checkmark-outline"
                    autoCapitalize="none"
                  />
                </View>
                <View style={fs.fieldGap}>
                  <PremiumInput
                    label="Label"
                    value={row.label}
                    onChangeText={(t) =>
                      setTrustRows((rows) => rows.map((r, i) => (i === idx ? { ...r, label: t } : r)))
                    }
                    placeholder="e.g. 100% Pure"
                  />
                </View>
              </AdminRepeatBlock>
            ))}
            <PremiumButton
              label="Add trust chip"
              iconLeft="add-outline"
              variant="ghost"
              size="sm"
              onPress={() => setTrustRows((rows) => [...rows, { icon: "shield-checkmark-outline", label: "" }])}
              style={fs.addRowBtn}
            />
          </AdminFormSection>

          <AdminFormSection
            title="Size options"
            subtitle="Label and price only. Stock stays on the jar, not on a size."
            icon="resize-outline"
            complete={variantRows?.some((r) => r?.label?.trim()) ? true : false}
          >
            {variantRows.map((row, idx) => (
              <AdminRepeatBlock
                key={`v-${idx}`}
                index={idx}
                title={`Variant ${idx + 1}`}
                subtitle={row.label || "Size or pack label"}
                onRemove={() => setVariantRows((rows) => rows.filter((_, i) => i !== idx))}
              >
                <View style={fs.row}>
                  <View style={[fs.fieldGap, fs.halfInput]}>
                    <PremiumInput
                      label="Label"
                      value={row.label}
                      onChangeText={(t) =>
                        setVariantRows((rows) => rows.map((r, i) => (i === idx ? { ...r, label: t } : r)))
                      }
                      placeholder="e.g. 500ml"
                    />
                  </View>
                  <View style={[fs.fieldGap, fs.halfInput]}>
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
                <View style={fs.fieldGap}>
                  <PremiumInput
                    label="Tag (optional)"
                    value={row.tag}
                    onChangeText={(t) =>
                      setVariantRows((rows) => rows.map((r, i) => (i === idx ? { ...r, tag: t } : r)))
                    }
                    placeholder="e.g. Best Value"
                  />
                </View>
              </AdminRepeatBlock>
            ))}
            <PremiumButton
              label="Add variant"
              iconLeft="add-outline"
              variant="ghost"
              size="sm"
              onPress={() => setVariantRows((rows) => [...rows, { label: "", price: "", tag: "" }])}
              style={fs.addRowBtn}
            />
          </AdminFormSection>

          <AdminFormSection
            title="Social proof & hero media"
            subtitle="Rating, badge ribbon & lifestyle image"
            icon="star-outline"
            complete={Boolean(ratingAverage?.trim() || badgeText?.trim() || lifestyleImage?.trim())}
          >
            <View style={fs.row}>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput
                  label="Rating avg (0–5)"
                  value={ratingAverage}
                  onChangeText={setRatingAverage}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput
                  label="Review count"
                  value={reviewCount}
                  onChangeText={setReviewCount}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput label="Hero badge" value={badgeText} onChangeText={setBadgeText} placeholder="e.g. HAND CHURNED" />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Lifestyle image URL"
                value={lifestyleImage}
                onChangeText={setLifestyleImage}
                autoCapitalize="none"
                iconLeft="image-outline"
              />
            </View>
          </AdminFormSection>
        </>
      ) : null}

      {pageTab === "story" ? (
        <>
          <AdminFormSection
            title="Brand story"
            subtitle="Full-width block below the hero purchase area"
            icon="book-outline"
            defaultOpen
            complete={storyComplete}
          >
            <View style={fs.fieldGap}>
              <PremiumInput label="Section kick" value={storyKick} onChangeText={setStoryKick} placeholder="e.g. Our Legacy of Purity" />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput label="Section title" value={storyTitle} onChangeText={setStoryTitle} placeholder="Crafted the ancient way…" />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Story body"
                value={storyLegend}
                onChangeText={setStoryLegend}
                multiline
                numberOfLines={5}
                placeholder="Longer brand story paragraph"
              />
            </View>
          </AdminFormSection>

          <AdminFormSection
            title="Feature cards (USPs)"
            subtitle="Three-up icon cards — great for purity, process, sourcing"
            icon="grid-outline"
            complete={uspRows?.some((r) => r?.title?.trim()) ? true : false}
          >
            {uspRows.map((row, idx) => (
              <AdminRepeatBlock
                key={`usp-${idx}`}
                index={idx}
                title={`USP ${idx + 1}`}
                onRemove={() => setUspRows((rows) => rows.filter((_, i) => i !== idx))}
              >
                <IconQuickPick
                  value={row.icon}
                  onChange={(icon) =>
                    setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon } : r)))
                  }
                />
                <View style={fs.fieldGap}>
                  <PremiumInput
                    label="Ionicons name"
                    value={row.icon}
                    onChangeText={(t) =>
                      setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
                    }
                    autoCapitalize="none"
                  />
                </View>
                <View style={fs.fieldGap}>
                  <PremiumInput
                    label="Title"
                    value={row.title}
                    onChangeText={(t) =>
                      setUspRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: t } : r)))
                    }
                  />
                </View>
                <View style={fs.fieldGap}>
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
              </AdminRepeatBlock>
            ))}
            <PremiumButton
              label="Add USP card"
              iconLeft="add-outline"
              variant="ghost"
              size="sm"
              onPress={() => setUspRows((rows) => [...rows, { icon: "flask-outline", title: "", description: "" }])}
              style={fs.addRowBtn}
            />
          </AdminFormSection>

          <AdminFormSection
            title="Process story"
            subtitle="Step list + pull quote for your making method"
            icon="git-branch-outline"
            complete={Boolean(processTitle?.trim() || processStepsText?.trim())}
          >
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Process section title"
                value={processTitle}
                onChangeText={setProcessTitle}
                placeholder="e.g. The Vedic Bilona Method"
              />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Process steps"
                value={processStepsText}
                onChangeText={setProcessStepsText}
                placeholder="One step per line"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Highlight quote"
                value={highlightQuote}
                onChangeText={setHighlightQuote}
                multiline
                numberOfLines={2}
              />
            </View>
          </AdminFormSection>
        </>
      ) : null}

      {pageTab === "nutrition" ? (
        <>
          <AdminFormSection
            title="Nutrition table"
            subtitle="Headings + rows — use label|value per line"
            icon="nutrition-outline"
            defaultOpen
            complete={nutritionComplete}
          >
            <View style={fs.row}>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput label="Nutrition kick" value={nutritionKick} onChangeText={setNutritionKick} placeholder="Nutrition" />
              </View>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput label="Nutrition title" value={nutritionTitle} onChangeText={setNutritionTitle} placeholder="Nutritional Facts" />
              </View>
            </View>
            <View style={fs.row}>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput label="Table header" value={nutritionTableHead} onChangeText={setNutritionTableHead} placeholder="Per 100 g" />
              </View>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput label="Table subhead" value={nutritionTableSub} onChangeText={setNutritionTableSub} placeholder="Approximate values" />
              </View>
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Nutrition rows"
                value={nutritionRowsText}
                onChangeText={setNutritionRowsText}
                placeholder="Energy|896.22 kcal — one row per line"
                multiline
                numberOfLines={6}
                helperText="Format: Label|Value — one row per line"
              />
            </View>
          </AdminFormSection>

          <AdminFormSection
            title="Packaging info card"
            subtitle="Net qty, storage, tags & FSSAI footer"
            icon="cube-outline"
            complete={Boolean(nutritionCardTitle?.trim() || nutritionCardBody?.trim())}
          >
            <View style={fs.fieldGap}>
              <PremiumInput label="Info card title" value={nutritionCardTitle} onChangeText={setNutritionCardTitle} placeholder="From our farm to your table" />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Info card body"
                value={nutritionCardBody}
                onChangeText={setNutritionCardBody}
                multiline
                numberOfLines={3}
                placeholder="Net quantity, storage, best before…"
              />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Info card tags"
                value={nutritionCardTagsText}
                onChangeText={setNutritionCardTagsText}
                placeholder="Comma-separated, e.g. Bilona Process, Ethically Sourced"
              />
            </View>
            <View style={fs.fieldGap}>
              <PremiumInput
                label="Info card footer"
                value={nutritionCardFooter}
                onChangeText={setNutritionCardFooter}
                placeholder="FSSAI licence, packed by…"
                multiline
                numberOfLines={2}
              />
            </View>
          </AdminFormSection>

          <AdminFormSection
            title="Reviews section headings"
            subtitle="Kick + title above customer reviews block"
            icon="chatbubbles-outline"
            complete={Boolean(reviewsKick?.trim() || reviewsTitle?.trim())}
          >
            <View style={fs.row}>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput label="Reviews kick" value={reviewsKick} onChangeText={setReviewsKick} placeholder="Customer Reviews" />
              </View>
              <View style={[fs.fieldGap, fs.halfInput]}>
                <PremiumInput label="Reviews title" value={reviewsTitle} onChangeText={setReviewsTitle} placeholder="What families are saying" />
              </View>
            </View>
          </AdminFormSection>
        </>
      ) : null}

      {pageTab === "usage" ? (
        <AdminFormSection
          title="Usage & rituals"
          subtitle="How to use cards — icon, title & short description"
          icon="cafe-outline"
          defaultOpen
          complete={usageComplete}
        >
          {usageRows.map((row, idx) => (
            <AdminRepeatBlock
              key={`use-${idx}`}
              index={idx}
              title={`Usage card ${idx + 1}`}
              onRemove={() => setUsageRows((rows) => rows.filter((_, i) => i !== idx))}
            >
              <IconQuickPick
                value={row.icon}
                onChange={(icon) =>
                  setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon } : r)))
                }
              />
              <View style={fs.fieldGap}>
                <PremiumInput
                  label="Ionicons name"
                  value={row.icon}
                  onChangeText={(t) =>
                    setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, icon: t } : r)))
                  }
                  autoCapitalize="none"
                />
              </View>
              <View style={fs.fieldGap}>
                <PremiumInput
                  label="Title"
                  value={row.title}
                  onChangeText={(t) =>
                    setUsageRows((rows) => rows.map((r, i) => (i === idx ? { ...r, title: t } : r)))
                  }
                />
              </View>
              <View style={fs.fieldGap}>
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
            </AdminRepeatBlock>
          ))}
          <PremiumButton
            label="Add usage card"
            iconLeft="add-outline"
            variant="ghost"
            size="sm"
            onPress={() => setUsageRows((rows) => [...rows, { icon: "cafe-outline", title: "", description: "" }])}
            style={fs.addRowBtn}
          />
        </AdminFormSection>
      ) : null}

      {!heroComplete && !storyComplete && !nutritionComplete && !usageComplete ? (
        <Text style={fs.pageHint}>
          Product page content is optional. Fill Hero first — story, nutrition & usage unlock a premium PDP.
        </Text>
      ) : null}
    </>
  );
}
