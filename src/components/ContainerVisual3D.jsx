/**
 * ContainerVisual3D — a real, continuously-turning 3D shipping container
 * that fills with crates as groupages get a volume. Built with
 * @react-three/fiber + @react-three/drei on top of three.js.
 *
 * Design choices:
 *  - The container shell is semi-transparent with a crisp wireframe edge
 *    outline, rather than a cutaway box — a cutaway looks broken from
 *    some angles once it's continuously rotating; a "glass" shell reads
 *    correctly from every angle and still shows the cargo inside.
 *  - Crates are proportional to each groupage's volume (m³) against the
 *    container's real usable capacity (33 m³ for 20', 67 m³ for 40').
 *  - Groupages without a volume yet render as a small dashed wireframe
 *    "ghost" crate, so something appears the instant a groupage exists.
 *  - Crates pack shelf-style: left to right along the floor, then stack
 *    as a new layer on top once a layer is full — like real loading.
 *    Anything that still doesn't fit after 3 layers simply isn't drawn
 *    inside the shell (nothing spills outside it); the text readout
 *    below carries the "doesn't fit" warning instead.
 */

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Line } from "@react-three/drei";
import * as THREE from "three";

const CAPACITY_M3 = { "20": 33, "40": 67 };
const BOX_COLORS = ["#2F7E6C", "#C9912B", "#D6492F", "#185FA5", "#6E4E9E", "#3B6D11"];

// Scaled-down real container proportions (meters / 2), so 40' reads
// meaningfully longer than 20' rather than just "a bigger box".
const DIMS = {
  "20": { length: 3.03, width: 1.22, height: 1.3 },
  "40": { length: 6.1,  width: 1.22, height: 1.3 },
};

function parseVolume(value) {
  const n = parseFloat((value || "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/* ── One loaded crate, with a pop-in entrance animation ── */
function Crate({ x, y, w, depth, height, color }) {
  const ref = useRef();
  const scaleRef = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current) return;
    scaleRef.current = Math.min(1, scaleRef.current + delta * 3.2);
    const s = scaleRef.current;
    // slight overshoot for a satisfying "pop"
    const eased = s < 1 ? 1 - Math.pow(1 - s, 3) : 1;
    ref.current.scale.set(1, eased, 1);
  });
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, height, depth)), [w, height, depth]);

  return (
    <group position={[x, y, 0]}>
      <mesh ref={ref} castShadow>
        <boxGeometry args={[w, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#0B2A3D" transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
}

/* ── A small dashed "not sized yet" placeholder crate ── */
function GhostCrate({ x, size }) {
  const points = useMemo(() => {
    const g = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(g);
    const pos = edges.attributes.position;
    const pts = [];
    for (let i = 0; i < pos.count; i++) pts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
    return pts;
  }, [size]);
  return (
    <group position={[x, size / 2 + 0.02, 0]}>
      <Line points={points} segments color="#A8A39A" dashed dashSize={0.04} gapSize={0.03} lineWidth={1} />
    </group>
  );
}

/* ── The container shell: semi-transparent glass box + crisp edges + brand stripe + door frame ── */
function ContainerShell({ length, width, height }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(length, height, width)), [length, width, height]);
  const doorX = length / 2;

  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial
          color="#DCE6EA"
          transparent
          opacity={0.12}
          roughness={0.25}
          metalness={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments position={[0, height / 2, 0]} geometry={edges}>
        <lineBasicMaterial color="#0B2A3D" transparent opacity={0.55} />
      </lineSegments>

      {/* brand stripe wrapping the container */}
      <mesh position={[0, height * 0.52, 0]}>
        <boxGeometry args={[length + 0.01, height * 0.09, width + 0.01]} />
        <meshStandardMaterial color="#2F7E6C" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* door frame lines at one end */}
      <Line
        points={[
          [doorX, 0, -width / 2], [doorX, height, -width / 2],
          [doorX, height, width / 2], [doorX, 0, width / 2], [doorX, 0, -width / 2],
        ]}
        color="#0B2A3D" lineWidth={1.5} transparent opacity={0.6}
      />
      <Line points={[[doorX, 0, 0], [doorX, height, 0]]} color="#0B2A3D" lineWidth={1} transparent opacity={0.35} />
    </group>
  );
}

/* ── Slowly, continuously turning scene contents ── */
function Scene({ sizeFeet, groupages, compact }) {
  const dims = DIMS[sizeFeet] || DIMS["20"];
  const capacity = CAPACITY_M3[sizeFeet] || CAPACITY_M3["20"];
  const named = groupages.filter(g => g.supplier.trim() && g.client.trim());

  const sized = named
    .map((g, i) => ({ id: g.id, volume: parseVolume(g.volume), color: BOX_COLORS[i % BOX_COLORS.length] }))
    .filter(g => g.volume > 0);
  const unsized = named.filter(g => parseVolume(g.volume) <= 0);

  const interiorLength = dims.length * 0.92;
  const crateDepth = dims.width * 0.82;

  // Shelf-pack: fill a layer left-to-right, then start a new layer
  // stacked on top once the current one is full — up to 3 layers, which
  // is roughly what the container's height can plausibly hold. Anything
  // that still doesn't fit after that just isn't drawn — the numeric
  // readout below carries the "doesn't fit" message instead of crates
  // spilling out through the container walls.
  const LAYERS = 3;
  const LAYER_GAP = 0.015;
  const crateHeight = (dims.height * 0.82) / LAYERS - LAYER_GAP;
  // The three layers together represent 100% of capacity — a crate's
  // width is proportional to its share of the *whole* container, not
  // just one layer, otherwise 100% would only fill a third of the shell.
  const totalLengthBudget = interiorLength * LAYERS;

  let layer = 0;
  let cursorX = -interiorLength / 2;
  const drawn = [];
  for (const item of sized) {
    let remaining = Math.max(0.05, (item.volume / capacity) * totalLengthBudget);
    while (remaining > 0.0005 && layer < LAYERS) {
      const spaceLeft = interiorLength / 2 - cursorX;
      const w = Math.min(remaining, spaceLeft);
      if (w > 0.0005) {
        const y = layer * (crateHeight + LAYER_GAP) + crateHeight / 2 + 0.02;
        drawn.push({ ...item, id: `${item.id}-${layer}`, x: cursorX + w / 2, y, w });
        cursorX += w;
        remaining -= w;
      }
      if (remaining > 0.0005) {
        layer += 1;
        cursorX = -interiorLength / 2;
      }
    }
    // Anything still remaining here has exhausted all layers — it
    // genuinely doesn't fit, so it isn't drawn (see comment above).
  }

  return (
    <group rotation={[0.08, 0, 0]}>
      <ContainerShell length={dims.length} width={dims.width} height={dims.height} />
      {drawn.map(b => (
        <Crate key={b.id} x={b.x} y={b.y} w={b.w} depth={crateDepth} height={crateHeight} color={b.color} />
      ))}
      {unsized.map((g, i) => (
        <GhostCrate key={g.id} x={interiorLength / 2 + 0.18 + i * 0.16} size={0.13} />
      ))}
      {!compact && (
        <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={dims.length + 2} blur={2.2} far={dims.height + 1} />
      )}
    </group>
  );
}

/* ── Public component ── */
export default function ContainerVisual3D({ sizeFeet, groupages, t, compact }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const dims = DIMS[sizeFeet] || DIMS["20"];
  const capacity = CAPACITY_M3[sizeFeet] || CAPACITY_M3["20"];
  const named = groupages.filter(g => g.supplier.trim() && g.client.trim());
  const totalVolume = named.reduce((a, g) => a + parseVolume(g.volume), 0);
  const pct = capacity > 0 ? (totalVolume / capacity) * 100 : 0;
  const overCapacity = totalVolume > capacity;
  const overflowAmount = Math.max(0, totalVolume - capacity);

  // Frame the whole container with margin, from a consistent elevated
  // 3/4 angle, regardless of container size — computed from the
  // bounding sphere rather than guessed distances, so nothing gets
  // clipped for either size or view mode.
  const R = Math.sqrt((dims.length / 2) ** 2 + (dims.height / 2) ** 2 + (dims.width / 2) ** 2);
  const fovDeg = 30;
  const fovRad = (fovDeg * Math.PI) / 180;
  const margin = compact ? 1.55 : 1.35;
  const dist = (R / Math.sin(fovRad / 2)) * margin;
  const elevRad = (26 * Math.PI) / 180;
  const azimRad = (35 * Math.PI) / 180;
  const target = [0, dims.height / 2, 0];
  const camPos = [
    dist * Math.cos(elevRad) * Math.sin(azimRad),
    dist * Math.sin(elevRad) + target[1],
    dist * Math.cos(elevRad) * Math.cos(azimRad),
  ];

  return (
    <div className="pva-container-visual">
      <div style={{ width: "100%", height: compact ? 150 : 230 }}>
        {ready && (
          <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ alpha: true, antialias: true }}
            camera={{ position: camPos, fov: fovDeg }}
          >
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 2]} intensity={1.35} castShadow />
            <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#8fb8d9" />
            <Scene sizeFeet={sizeFeet} groupages={groupages} compact={compact} />
            <OrbitControls
              target={target}
              autoRotate
              autoRotateSpeed={1.4}
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI * (50 / 180)}
              maxPolarAngle={Math.PI * (72 / 180)}
            />
          </Canvas>
        )}
      </div>

      <div className="pva-container-visual-readout">
        <span className="pva-container-visual-pct" style={{ color: overCapacity ? "#D6492F" : "#2F7E6C" }}>
          {totalVolume.toFixed(1)} / {capacity} m³ · {Math.round(pct)}%
        </span>
        {overCapacity && (
          <span className="pva-container-visual-warn">
            {t("addEntry.overCapacityWarning").replace("{amount}", overflowAmount.toFixed(1))}
          </span>
        )}
        {named.length === 0 && (
          <span className="pva-container-visual-hint">{t("addEntry.emptyContainerHint")}</span>
        )}
      </div>
    </div>
  );
}