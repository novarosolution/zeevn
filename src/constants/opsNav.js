import { ADMIN_MANAGE_SECTIONS } from "./adminNav";

export const OPS_ADMIN_KICKER = "Admin";
export const OPS_DELIVERY_KICKER = "Delivery";

export const OPS_ADMIN_OVERVIEW = {
  route: "AdminDashboard",
  label: "Overview",
  icon: "speedometer-outline",
};

export function getOpsAdminSidebarSections() {
  return [
    { id: "overview", items: [OPS_ADMIN_OVERVIEW] },
    ...ADMIN_MANAGE_SECTIONS.map((sec) => ({
      id: sec.id,
      label: sec.label,
      items: sec.items.map((item) => ({
        route: item.route,
        label: item.title,
        icon: item.icon,
      })),
    })),
  ];
}

export function getOpsAdminFlatRoutes() {
  const routes = [OPS_ADMIN_OVERVIEW.route];
  for (const sec of ADMIN_MANAGE_SECTIONS) {
    for (const item of sec.items) {
      routes.push(item.route);
    }
  }
  return routes;
}

export const OPS_DELIVERY_NAV = [
  { route: "DeliveryDashboard", label: "Dashboard", icon: "bicycle-outline" },
  { route: "Home", label: "Storefront", icon: "storefront-outline" },
];

export function getOpsAdminSectionTitle(route) {
  if (route === OPS_ADMIN_OVERVIEW.route) return OPS_ADMIN_OVERVIEW.label;
  for (const sec of ADMIN_MANAGE_SECTIONS) {
    for (const item of sec.items) {
      if (item.route === route) return item.title;
    }
  }
  return "Admin";
}
