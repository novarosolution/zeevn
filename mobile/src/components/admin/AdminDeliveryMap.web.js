import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import L from "leaflet";
import "../../styles/leafletWeb.css";
import { Circle, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

const FALLBACK = [23.2156, 72.6369];
const DEFAULT_HEIGHT = 460;

const COLORS = {
  zone: "#244424",
  zoneFill: "#5C6834",
  paused: "#8A8478",
  selected: "#C9A227",
  editing: "#B8442F",
  shop: "#A06C24",
};

/** Re-measures the map whenever its container changes size (drawers, tabs and window resizes all do that). */
function MapReady() {
  const map = useMap();
  useEffect(() => {
    const kick = () => map.invalidateSize({ animate: false });
    kick();
    const frame = requestAnimationFrame(kick);
    const t1 = setTimeout(kick, 80);
    const t2 = setTimeout(kick, 400);
    window.addEventListener("resize", kick);
    let observer = null;
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(kick);
      observer.observe(map.getContainer());
    }
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", kick);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

function ClickCatch({ onClick, mode }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = mode === "draw" || mode === "pin" || mode === "test" ? "crosshair" : "grab";
  }, [map, mode]);
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Fits the view to `bounds` ([[south, west], [north, east]]) whenever `fitKey` changes — not on every render. */
function FitTo({ bounds, fitKey }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    // No zoom animation: it relies on CSS transitions, which stall in background tabs and leave the map half-zoomed.
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

/** Pans/zooms to `point` ({ lat, lng }) whenever `focusKey` changes — used to jump to a rider or a shop. */
function FlyTo({ point, focusKey }) {
  const map = useMap();
  useEffect(() => {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map]);
  return null;
}

function ringOf(zone) {
  return (zone.polygon || [])
    .map((p) => [Number(p.lat ?? p.latitude), Number(p.lng ?? p.longitude)])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
}

function pointIcon(n) {
  return L.divIcon({
    className: "admin-zone-pt",
    html: `<div style="width:24px;height:24px;border-radius:12px;background:${COLORS.editing};color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:700 11px/1 system-ui,sans-serif;cursor:grab;box-shadow:0 2px 6px rgba(0,0,0,.3)">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function shopIcon(selected) {
  const border = selected ? "#C9A227" : "#8A8478";
  const size = selected ? 36 : 28;
  return L.divIcon({
    className: "admin-store-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:${size / 2}px;background:#fff;border:2px solid ${border};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);font-size:${selected ? 16 : 13}px;line-height:1;">🏪</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function riderIcon(rider, selected) {
  const online = Boolean(rider.online);
  const initials = String(rider.name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const ring = selected ? "#C9A227" : online ? "#2FA36B" : "#A8A29E";
  const size = selected ? 38 : 32;
  const fade = online ? "1" : "0.45";
  const ago = !online && rider.lastSeenLabel ? String(rider.lastSeenLabel).replace(/^last seen /i, "") : "";
  const label = ago
    ? `<span style="position:absolute;left:50%;top:100%;transform:translate(-50%,3px);padding:1px 5px;border-radius:6px;background:rgba(255,252,247,.94);color:#5C564E;font:600 9px/1.2 system-ui,sans-serif;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.12)">${ago}</span>`
    : "";
  return L.divIcon({
    className: "admin-rider-pin",
    html: `<div style="position:relative;width:${size}px;height:${size}px;opacity:${fade};border-radius:${size / 2}px;background:#fff;border:3px solid ${ring};display:flex;align-items:center;justify-content:center;font:700 ${selected ? 12 : 11}px/1 system-ui,sans-serif;color:#1A1C14;box-shadow:0 3px 10px rgba(0,0,0,.28)">${initials}<span style="position:absolute;right:-3px;bottom:-3px;width:10px;height:10px;border-radius:5px;background:${online ? "#2FA36B" : "#A8A29E"};border:2px solid #fff"></span>${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ORDER_COLORS = { flagged: "#B8442F", pending: "#C9A227", ready: "#1F6F5B", onroute: "#3D6B8C", packing: "#5C6834" };

function orderDotIcon(order) {
  const color = order.assigned === true
    ? ORDER_COLORS.onroute
    : order.assigned === false
      ? ORDER_COLORS.pending
      : order.flagged
        ? ORDER_COLORS.flagged
        : order.status === "pending"
          ? ORDER_COLORS.pending
          : order.status === "ready_for_pickup"
            ? ORDER_COLORS.ready
            : order.status === "out_for_delivery" || order.status === "shipped"
              ? ORDER_COLORS.onroute
              : ORDER_COLORS.packing;
  return L.divIcon({
    className: "admin-order-dot",
    html: `<div style="width:14px;height:14px;border-radius:7px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function realLatLng(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a) <= 0.2 || Math.abs(b) <= 0.2) return null;
  return [a, b];
}

function testIcon(covered) {
  const color = covered ? "#2FA36B" : "#B8442F";
  return L.divIcon({
    className: "admin-test-pin",
    html: `<div style="width:26px;height:26px;border-radius:13px 13px 13px 2px;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.35)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

const mute = { interactive: false };

/**
 * Coverage map for the admin Zones desk.
 * `mode`: "select" (click a zone to pick it) · "draw" (click adds area points, points can be dragged or tapped to
 * remove) · "pin" (click moves the selected shop) · "test" (click drops a test address).
 */
export default function AdminDeliveryMap({
  store,
  stores = [],
  radiusKm = 25,
  zones = [],
  draft = [],
  hint = "",
  mode = "select",
  editingId,
  selectedZoneId,
  riders = [],
  selectedRiderId,
  orders = [],
  testPoint = null,
  layers = { zones: true, riders: true, orders: true },
  fitKey = 0,
  focusPoint = null,
  focusKey = 0,
  height = DEFAULT_HEIGHT,
  onMapClick,
  onRemovePoint,
  onMovePoint,
  onSelectZone,
  onSelectRider,
  onSelectOrder,
}) {
  const pins = stores.length ? stores : store ? [store] : [];
  const lat = Number(store?.latitude);
  const lng = Number(store?.longitude);
  const center = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : FALLBACK;
  const draftPos = draft.map((p) => [p.lat, p.lng]);
  const selectable = mode === "select";

  // What to frame when `fitKey` changes: the chosen zone, otherwise shops / riders / orders.
  const bounds = useMemo(() => {
    const points = [];
    if (editingId !== undefined && draft.length >= 3) {
      // Editing: frame the working area, not the saved outline.
      draft.forEach((p) => points.push([p.lat, p.lng]));
    }
    const picked = zones.find((z) => String(z._id) === String(selectedZoneId || editingId));
    if (!points.length && picked && ringOf(picked).length >= 3) points.push(...ringOf(picked));
    if (!points.length && layers.zones !== false) {
      zones.forEach((z) => points.push(...ringOf(z)));
    }
    if (!points.length || layers.zones === false) {
      pins.forEach((s) => {
        const pt = realLatLng(s.latitude, s.longitude);
        if (pt) points.push(pt);
      });
      if (layers.riders !== false) {
        riders.forEach((r) => {
          const pt = realLatLng(r.location?.latitude, r.location?.longitude);
          if (pt) points.push(pt);
        });
      }
      if (layers.orders !== false) {
        orders.forEach((o) => {
          const pt = realLatLng(o.lat, o.lng);
          if (pt) points.push(pt);
        });
      }
    }
    if (!points.length) return null;
    return L.latLngBounds(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="auto">
      <MapContainer
        className="admin-delivery-map"
        center={center}
        zoom={13}
        style={{ height, width: "100%", "--admin-map-h": `${height}px` }}
        scrollWheelZoom
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapReady />
        <FitTo bounds={bounds} fitKey={fitKey} />
        <FlyTo point={focusPoint} focusKey={focusKey} />
        <ClickCatch onClick={onMapClick} mode={mode} />

        {pins.map((s) => {
          const shopPt = realLatLng(s.latitude, s.longitude);
          if (!shopPt) return null;
          const [slat, slng] = shopPt;
          const selected = store && String(s._id || "") === String(store._id || "");
          const r = Number(selected ? radiusKm : s.maxRadiusKm);
          const strong = selected || pins.length === 1;
          return (
            <React.Fragment key={String(s._id || `${slat},${slng}`)}>
              <Marker position={[slat, slng]} icon={shopIcon(strong)} interactive={false} />
              {r > 0 && s.isActive !== false ? (
                <Circle
                  center={[slat, slng]}
                  radius={r * 1000}
                  pathOptions={{
                    color: strong ? COLORS.shop : COLORS.paused,
                    weight: strong ? 2 : 1,
                    fillColor: "#DCAC74",
                    fillOpacity: strong ? 0.08 : 0.04,
                    dashArray: "6 6",
                    ...mute,
                  }}
                  interactive={false}
                />
              ) : null}
            </React.Fragment>
          );
        })}

        {layers.zones
          ? zones.map((z) => {
              const ring = ringOf(z);
              if (ring.length < 3) return null;
              const editing = editingId && String(z._id) === String(editingId);
              const picked = !editing && selectedZoneId && String(z._id) === String(selectedZoneId);
              const off = z.isActive === false;
              const color = editing ? COLORS.editing : picked ? COLORS.selected : off ? COLORS.paused : COLORS.zone;
              return (
                <Polygon
                  key={String(z._id || z.name)}
                  positions={ring}
                  pathOptions={{
                    color,
                    weight: editing || picked ? 3 : 2,
                    dashArray: off ? "5 6" : undefined,
                    fillColor: editing ? COLORS.editing : picked ? COLORS.selected : off ? COLORS.paused : COLORS.zoneFill,
                    fillOpacity: editing ? 0.06 : picked ? 0.22 : off ? 0.06 : 0.16,
                    ...(selectable ? null : mute),
                  }}
                  interactive={selectable}
                  eventHandlers={selectable ? { click: () => onSelectZone?.(String(z._id)) } : undefined}
                >
                  {selectable ? (
                    <Tooltip sticky direction="top">
                      {z.name}
                      {off ? " (paused)" : ""}
                    </Tooltip>
                  ) : null}
                </Polygon>
              );
            })
          : null}

        {draftPos.length >= 2 ? <Polyline positions={draftPos} pathOptions={{ color: COLORS.editing, weight: 3, ...mute }} interactive={false} /> : null}
        {draftPos.length >= 3 ? (
          <Polygon positions={draftPos} pathOptions={{ color: COLORS.editing, weight: 2, fillColor: COLORS.editing, fillOpacity: 0.14, ...mute }} interactive={false} />
        ) : null}
        {draftPos.map((pos, i) => (
          <Marker
            key={`v-${i}`}
            position={pos}
            icon={pointIcon(i + 1)}
            draggable={Boolean(onMovePoint)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                onRemovePoint?.(i);
              },
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onMovePoint?.(i, { lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        ))}

        {layers.orders
          ? orders.map((order) => {
              const pt = realLatLng(order.lat, order.lng);
              if (!pt) return null;
              return (
                <Marker
                  key={`o-${order._id}`}
                  position={pt}
                  icon={orderDotIcon(order)}
                  eventHandlers={{ click: () => onSelectOrder?.(order) }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    {order.label}
                  </Tooltip>
                </Marker>
              );
            })
          : null}

        {layers.riders
          ? riders.map((rider) => {
              const pt = realLatLng(rider.location?.latitude, rider.location?.longitude);
              if (!pt) return null;
              return (
                <Marker
                  key={`r-${rider._id}`}
                  position={pt}
                  icon={riderIcon(rider, String(rider._id) === String(selectedRiderId))}
                  zIndexOffset={800}
                  eventHandlers={{ click: () => onSelectRider?.(String(rider._id)) }}
                >
                  <Tooltip direction="top" offset={[0, -14]}>
                    {rider.name}
                    {rider.lastSeenLabel ? ` · ${rider.lastSeenLabel}` : rider.online ? " · online" : " · offline"}
                    {rider.active ? ` · ${rider.active} active` : ""}
                  </Tooltip>
                </Marker>
              );
            })
          : null}

        {testPoint ? <Marker position={[testPoint.lat, testPoint.lng]} icon={testIcon(testPoint.covered)} zIndexOffset={1000} interactive={false} /> : null}
      </MapContainer>
      {hint ? (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 18,
    position: "relative",
    backgroundColor: "#efe8dc",
  },
  hint: {
    position: "absolute",
    left: 12,
    top: 12,
    maxWidth: "70%",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,252,247,0.94)",
    // Leaflet's panes sit at z-index 400+; the hint has to float above them.
    ...Platform.select({ web: { zIndex: 1000 }, default: {} }),
  },
  hintText: { fontSize: 12, fontWeight: "600", color: "#19140f" },
});
