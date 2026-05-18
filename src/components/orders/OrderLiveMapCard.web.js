import React, { lazy, Suspense } from "react";
import { ActivityIndicator, View } from "react-native";

const LiveMap = lazy(() => import("./OrderLiveMapCardLeaflet.web"));

/**
 * Defers Leaflet + react-leaflet until the map card mounts (customer orders / delivery).
 */
export default function OrderLiveMapCardLazy(props) {
  return (
    <Suspense
      fallback={
        <View style={{ minHeight: 200, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      }
    >
      <LiveMap {...props} />
    </Suspense>
  );
}
