import React from "react";
import HomeCategoryGrid from "../components/home/HomeCategoryGrid";
import Screen from "../components/ui/Screen";
import { HOME_CATEGORY_QUICK_NAV, HOME_CATEGORY_UI, PLP_UI } from "../content/appContent";

export default function CategoriesScreen({ navigation }) {
  return (
    <Screen navigation={navigation} title={PLP_UI.categoryPageTitle} breadcrumbLabel={PLP_UI.categoryHubBreadcrumb}>
      <HomeCategoryGrid
        categories={HOME_CATEGORY_QUICK_NAV}
        overline={HOME_CATEGORY_UI.overline}
        title={HOME_CATEGORY_UI.title}
        viewAllLabel={HOME_CATEGORY_UI.viewAllLabel}
        onPressViewAll={undefined}
        onPressCategory={(category) =>
          navigation.navigate("Search", {
            q: "",
            category: category?.filter || category?.label || "",
            categoryLabel: category?.label || "",
          })
        }
      />
    </Screen>
  );
}
