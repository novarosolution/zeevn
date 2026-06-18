import React from "react";
import { View } from "react-native";

/**
 * Web lean home — heavy marketing sections load only when leanHome is disabled.
 * Default `leanHome: true` keeps the initial bundle small (FCP/LCP/TBT).
 */
export function WebTimelineSection() {
  return null;
}

export function WebProcessSection() {
  return null;
}

export function WebAboutSection() {
  return null;
}

export function WebCommunitySection() {
  return null;
}

/** Full sections for non-lean web builds — loaded on demand from the home screen. */
export async function loadFullHomeWebSections() {
  return import("./homeWebSections.full.web.js");
}
