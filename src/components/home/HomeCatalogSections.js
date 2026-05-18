import React from "react";
import { View } from "react-native";
import HomeSectionHeader from "./HomeSectionHeader";
import { HomeCatalogResponsiveGrid } from "./HomeCatalogProductViews";

export default function HomeCatalogSections({
  sections = [],
  styles,
  navigation,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart,
  cardStyle = "compact",
  numColumns = 2,
  gridGap = 12,
  cardWidth = 160,
}) {
  if (!Array.isArray(sections) || sections.length === 0) return null;
  const sectionGap = numColumns <= 2 ? 32 : 40;

  return (
    <View>
      {sections.map((section, index) => (
        <View
          key={`${section.title}-${index}`}
          style={[
            styles?.catalogSurface,
            index < sections.length - 1 ? { marginBottom: sectionGap } : null,
          ]}
        >
          <HomeSectionHeader
            overline="Shop"
            title={section.title}
            count={section.items?.length || 0}
            onSeeAll={() =>
              navigation.navigate("Search", {
                q: "",
                category: "",
                categoryLabel: "",
                section: section.title,
              })
            }
          />
          <HomeCatalogResponsiveGrid
            items={Array.isArray(section.items) ? section.items : []}
            styles={styles}
            navigation={navigation}
            getItemQuantity={getItemQuantity}
            onAddToCart={onAddToCart}
            onRemoveFromCart={onRemoveFromCart}
            isOutOfStock={(item) => item?.inStock === false || Number(item?.stockQty || 0) <= 0}
            cardStyle={cardStyle}
            numColumns={numColumns}
            gridGap={gridGap}
            cardWidth={cardWidth}
            listKeyPrefix={`section-${section.title}-${index}`}
          />
        </View>
      ))}
    </View>
  );
}
