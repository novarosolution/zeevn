import React from "react";
import { useAuth } from "../../context/AuthContext";
import OpsLayout from "./OpsLayout";
import EmptyState from "../ui/EmptyState";

const ACTIVE_ROUTE = "AdminDashboard";

/**
 * Admin tool wrapper: access gate + OpsLayout shell.
 */
export default function OpsAdminScreen({
  navigation,
  activeRoute = ACTIVE_ROUTE,
  sectionTitle,
  children,
  refreshControl,
  headerRight,
}) {
  const { user } = useAuth();

  if (user && !user.isAdmin) {
    return (
      <OpsLayout
        navigation={navigation}
        mode="admin"
        activeRoute={activeRoute}
        sectionTitle="Access"
        headerRight={headerRight}
      >
        <EmptyState
          iconName="shield-outline"
          title="Admin access required"
          description="This account does not have admin privileges."
          ctaLabel="Back to home"
          onCtaPress={() => navigation.navigate("Home")}
        />
      </OpsLayout>
    );
  }

  return (
    <OpsLayout
      navigation={navigation}
      mode="admin"
      activeRoute={activeRoute}
      sectionTitle={sectionTitle}
      refreshControl={refreshControl}
      headerRight={headerRight}
    >
      {children}
    </OpsLayout>
  );
}
