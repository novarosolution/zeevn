import React from "react";
import HomeStickyMicroBar from "./HomeStickyMicroBar";

/**
 * Naming-aligned wrapper for the mobile sticky cart CTA.
 * Keeps existing behavior while exposing the new component contract.
 */
export default function HomeStickyAddToBagBar(props: any) {
  return <HomeStickyMicroBar {...props} />;
}

