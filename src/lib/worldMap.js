/**
 * Shared world-map setup — projection, country geometry, port
 * coordinates, and the route-animation hook — used by both Home's
 * hero globe and Analytics' lane-performance map, so both stay
 * visually and geographically consistent and the (fairly large)
 * world-atlas topology only gets bundled and parsed once.
 */

import { useState, useEffect, useRef } from "react";
import { geoEqualEarth, geoPath, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";

export const WIDTH = 1440;
export const HEIGHT = 900;

// One shared projection + path generator. Centered roughly on the
// Mediterranean so Tunis sits near the visual middle while Asia, the
// Americas, and Australia remain visible for context.
export const projection = geoEqualEarth()
  .rotate([-12, -6, 0])
  .scale(205)
  .translate([WIDTH / 2, HEIGHT / 2]);

export const pathGenerator = geoPath(projection);
export const graticuleLines = geoGraticule()();

// world-atlas ships a TopoJSON topology; convert its one object
// ("countries") into GeoJSON features once, at module load.
export const countries = feature(
  worldTopology,
  worldTopology.objects.countries
).features;

export const TUNIS = [10.18, 36.81];

// [longitude, latitude] for every port in AddEntry's ORIGIN_PORTS
// autocomplete list, so any real lane in the data can be plotted
// without needing a live geocoding call. Keyed lowercase/trimmed —
// look up with normalizePortName().
export const PORT_COORDS = {
  "shanghai":   [121.47, 31.23],
  "ningbo":     [121.55, 29.87],
  "shenzhen":   [114.06, 22.54],
  "qingdao":    [120.38, 36.07],
  "guangzhou":  [113.26, 23.13],
  "hong kong":  [114.17, 22.32],
  "singapore":  [103.82, 1.35],
  "busan":      [129.08, 35.18],
  "rotterdam":  [4.48, 51.92],
  "antwerp":    [4.40, 51.22],
  "hamburg":    [9.99, 53.55],
  "genoa":      [8.93, 44.41],
  "valencia":   [-0.38, 39.47],
  "barcelona":  [2.17, 41.39],
  "marseille":  [5.37, 43.30],
  "piraeus":    [23.61, 37.95],
  "istanbul":   [28.98, 41.01],
  "alexandria": [29.92, 31.20],
  "alexandrie": [29.92, 31.20],
  "casablanca": [-7.59, 33.57],
  "algiers":    [3.06, 36.75],
  "ambarli":    [28.72, 40.97],
};

export function normalizePortName(name) {
  return (name || "").trim().toLowerCase();
}

/**
 * Animates a marker's projected [x, y] position along the straight
 * line from `from` to `to` (interpolated in lon/lat space, then
 * projected — a reasonable approximation at this scale), looping.
 * Respects prefers-reduced-motion.
 */
export function useRoutePosition(from, to, duration, offset = 0) {
  const [t, setT] = useState(() => (offset % duration) / duration);
  const frameRef = useRef();
  const startRef = useRef(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) return undefined;

    const tick = (now) => {
      if (startRef.current === null) startRef.current = now - offset * 1000;
      const elapsed = now - startRef.current;
      const cycleMs = duration * 1000;
      const progress = ((elapsed % cycleMs) + cycleMs) % cycleMs / cycleMs;
      setT(progress);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [duration, offset]);

  const lon = from[0] + (to[0] - from[0]) * t;
  const lat = from[1] + (to[1] - from[1]) * t;
  return projection([lon, lat]);
}
