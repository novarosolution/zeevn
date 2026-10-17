import React from "react";
import { FloatingNav } from "./store/entry";

/**
 * Bottom navigation for customer screens.
 * Native: frosted floating pill (Home · Categories · Order Again · Account) + cart FAB — see `store/FloatingNav`.
 * Web has no bottom bar (the entry resolves to an inert stub there).
 */
export default function BottomNavBar() {
  return <FloatingNav />;
}
