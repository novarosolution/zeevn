import { useEffect, useRef } from "react";

/** Open the full-screen map picker and return the chosen place on `pickedPlace`. */
export function openPickLocation(navigation, opts = {}) {
  navigation.navigate("PickLocation", {
    latitude: opts.latitude,
    longitude: opts.longitude,
    returnTo: opts.returnTo,
    returnParams: opts.returnParams || {},
    applyLive: opts.applyLive !== false,
  });
}

/** Read `pickedPlace` once, then clear it so back/forward does not re-apply. */
export function usePickedPlace(route, navigation, onPlace) {
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;
  const place = route?.params?.pickedPlace;

  useEffect(() => {
    if (!place) return;
    onPlaceRef.current(place);
    navigation.setParams({ pickedPlace: undefined });
  }, [place, navigation]);
}
