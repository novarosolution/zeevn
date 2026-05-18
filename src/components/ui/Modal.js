import React from "react";
import { Modal as RNModal } from "react-native";

/**
 * Design-system modal primitive (React Native `Modal` passthrough).
 * Prefer {@link ConfirmDialog} for destructive / confirm flows.
 */
export default function Modal(props) {
  return <RNModal {...props} />;
}
