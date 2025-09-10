import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, ContactShadows } from "@react-three/drei";

// ─────────────────────────────────────────────────────────────────────────────
// 설정/상수
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_INDEX = { A: 0, B: 1, C: 2, D: 3 }; // D = 불량
const INDEX_SECTION = Object.keys(SECTION_INDEX);

const STOCK_WARN_RATIO = 0.8;
const BOX_H_MIN = 0.3;
const BOX_H_SPAN = 0.6;

const CELL = 1.2;        // 칸(열) 폭
const SECTION_GAP = 1;   // 섹션 사이 통로폭

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ratioByCap = (q, cap) => clamp01((Number(q) || 0) / (Number(cap) || 100));

function quantityColorByCap(q, cap) {
  const t = ratioByCap(q, cap);
  if (t < STOCK_WARN_RATIO) return "#ef4444"; // 부족
  if (t < 1.0) return "#f59e0b"; // 주의
  return "#22c55e"; // 충분
}

function boxHeightByCap(q, cap) {
  const t = ratioByCap(q, cap);
  return BOX_H_MIN + BOX_H_SPAN * t;
}

/** 위치 문자열을 관대하게 표준화: "B구역-1-2", "b 1 2", "불량 01-02" 등 */
function normalizeLocation(loc) {
  if (!loc || typeof loc !== "string") return "A-01-01";
  let s = loc.trim();
  s = s.replace(/구역/g, "").replace(/[^\w가-힣- ]/g, " ").replace(/\s+/g, " ").trim();

  let m = s.match(/^(불량)[^\d]*?(\d{1,2})[^\d]*?(\d{1,2})/i);
  if (m) return `D-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;

  m = s.match(/^([A-Za-z])[^\d]*?(\d{1,2})[^\d]*?(\d{1,2})/);
  if (m) {
    const sec = (SECTION_INDEX.hasOwnProperty(m[1].toUpperCase()) ? m[1].toUpperCase() : "A");
    return `${sec}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
  }
  if (/^불량/.test(s)) return "D-01-01";
  return "A-01-01";
}

function parseLocation(loc) {
  const norm = normalizeLocation(loc);
  const m = norm.match(/^([A-D])-(\d{2})-(\d{2})$/);
  if (!m) return { section: "A", row: 1, col: 1 };
  return { section: m[1], row: parseInt(m[2], 10), col: parseInt(m[3], 10) };
}

// ★ 가로(col)=x, 세로(row)=z
// 섹션 간 이동 단위 = 랙길이(colsCount*cell) + 통로폭(sectionGap)
function toPosition(loc, { cell = CELL, sectionGap = SECTION_GAP, colsCount = 3 } = {}) {
  const { section, row, col } = parseLocation(loc);
  const secIdx = SECTION_INDEX[section] ?? 0;
  const shelfLenX = colsCount * cell;
  const sectionStride = shelfLenX + sectionGap;
  const baseX = secIdx * sectionStride;
  const x = baseX + (col - 1) * cell;
  const z = (row - 1) * cell;
  const y = 1.2;
  return [x, y, z];
}

// 섹션/행/열을 순회하며 자동 위치 생성
function* autoPositions(sections = 3, rows = 2, cols = 3) {
  const secs = ["A", "B", "C", "D", "E", "F"];
  for (let s = 0; s < sections; s++) {
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        yield `${secs[s]}-${String(r).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
      }
    }
  }
}

// 아이템 배열에서 섹션/최대행/최대열 추출 (최소값 보장)
function getGridStats(items, { minSections = 3, minRows = 2, minCols = 3 } = {}) {
  let maxRow = 1, maxCol = 1;
  const secSet = new Set();
  for (const it of items) {
    const rawLoc = it.location || it._autoLoc || "A-01-01";
    const { section, row, col } = parseLocation(rawLoc);
    secSet.add(section);
    maxRow = Math.max(maxRow, row || 1);
    maxCol = Math.max(maxCol, col || 1);
  }
  const computedSections = Math.max(1, ...Array.from(secSet).map(s => (SECTION_INDEX[s] ?? 0))) + 1;
  return {
    sections: Math.max(minSections, computedSections),
    rows: Math.max(minRows, maxRow),
    cols: Math.max(minCols, maxCol),
  };
}

function sectionLabelByIndex(idx) {
  const sec = INDEX_SECTION[idx] ?? String.fromCharCode(65 + idx);
  return sec === "D" ? "불량 구역" : `구역 ${sec}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 구조물
// ─────────────────────────────────────────────────────────────────────────────
function WarehouseRacks({
  sections = 3,
  rowsCount = 2,
  colsCount = 3,
  cell = CELL,
  sectionGap = SECTION_GAP,
}) {
  const shelfLenX = colsCount * cell;
  const shelfMidX = shelfLenX / 2;
  const sectionStride = shelfLenX + sectionGap; // ★ 핵심

  return (
    <group>
      {Array.from({ length: sections }, (_, sectionIdx) => (
        <group key={sectionIdx}>
          {Array.from({ length: rowsCount }, (_, rowIdx) => (
            <group key={rowIdx} position={[sectionIdx * sectionStride, 0, rowIdx * cell]}>
              {/* 기둥 */}
              <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[0.08, 2, 0.08]} />
                <meshStandardMaterial color="#4a5568" />
              </mesh>
              <mesh position={[shelfLenX, 1, 0]} castShadow>
                <boxGeometry args={[0.08, 2, 0.08]} />
                <meshStandardMaterial color="#4a5568" />
              </mesh>

              {/* 중간 지지대 */}
              {Array.from({ length: Math.max(0, colsCount - 1) }, (_, i) => (
                <mesh key={i} position={[(i + 1) * cell, 1, 0]}>
                  <boxGeometry args={[0.04, 2, 0.04]} />
                  <meshStandardMaterial color="#64748b" />
                </mesh>
              ))}

              {/* 선반판 1/2층 */}
              <mesh position={[shelfMidX, 0.9, 0]} receiveShadow castShadow>
                <boxGeometry args={[shelfLenX + 0.2, 0.05, 0.6]} />
                <meshStandardMaterial color="#e2e8f0" />
              </mesh>
              <mesh position={[shelfMidX, 1.6, 0]} receiveShadow castShadow>
                <boxGeometry args={[shelfLenX + 0.2, 0.05, 0.6]} />
                <meshStandardMaterial color="#e2e8f0" />
              </mesh>

              {/* 백 패널 */}
              <mesh position={[shelfMidX, 1.25, -0.25]}>
                <boxGeometry args={[shelfLenX + 0.2, 1.4, 0.05]} />
                <meshStandardMaterial color="#6b7280" />
              </mesh>
            </group>
          ))}

          {/* 섹션 라벨 */}
          <Text
            position={[sectionIdx * sectionStride + Math.min(1, shelfMidX), 2.2, -0.6]}
            fontSize={0.4}
            color="#1f2937"
            anchorX="center"
          >
            {sectionLabelByIndex(sectionIdx)}
          </Text>
        </group>
      ))}
    </group>
  );
}

function WarehouseStructure({
  sections = 3,
  rowsCount = 2,
  colsCount = 3,
  sectionGap = SECTION_GAP,
  cell = CELL,
}) {
  const shelfLenX = colsCount * cell;
  const totalWidth = sections * shelfLenX + (sections - 1) * sectionGap + 2; // ★ 핵심
  const totalDepth = rowsCount * cell + 2;

  return (
    <group>
      {/* 바닥 */}
      <mesh receiveShadow position={[totalWidth / 2 - 1, -0.05, totalDepth / 2 - 1]}>
        <boxGeometry args={[totalWidth, 0.1, totalDepth]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* 통로 라인 (앞/뒤) */}
      <mesh position={[totalWidth / 2 - 1, 0.005, totalDepth + 0.5 - 1]}>
        <boxGeometry args={[totalWidth, 0.01, 0.1]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[totalWidth / 2 - 1, 0.005, -0.5]}>
        <boxGeometry args={[totalWidth, 0.01, 0.1]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>

      {/* 뒷벽(좌측) */}
      <mesh position={[-0.5, 1.5, totalDepth / 2 - 1]}>
        <boxGeometry args={[0.2, 3, totalDepth + 1]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      <ContactShadows
        opacity={0.4}
        width={totalWidth}
        height={totalDepth}
        blur={2}
        far={4}
        resolution={1024}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UI 요소
// ─────────────────────────────────────────────────────────────────────────────
function WarehouseTooltip({ item, cap }) {
  return (
    <Html center distanceFactor={6} transform>
      <div
        style={{
          background: "#0f172a",
          color: "#f1f5f9",
          padding: "8px 10px",
          borderRadius: 6,
          fontSize: 11,
          border: "1px solid #334155",
          whiteSpace: "nowrap",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
        <div style={{ color: "#94a3b8" }}>코드: {item.code}</div>
        <div style={{ color: "#94a3b8" }}>수량: {item.quantity}개</div>
        <div style={{ color: item.quantity >= cap ? "#22c55e" : "#ef4444", fontSize: 10, marginTop: 2 }}>
          {item.quantity >= cap ? "✓ 출고가능" : "⚠ 부족"} (기준 {cap})
        </div>
      </div>
    </Html>
  );
}

function ShelfBox({ item, cap = 100, onSelect, colsCount }) {
  const q = Number(item.quantity) || 0;
  const h = boxHeightByCap(q, cap);
  const color = quantityColorByCap(q, cap);
  const [x, y, z] = toPosition(item.location || "A-01-01", { cell: CELL, sectionGap: SECTION_GAP, colsCount });
  const [hovered, setHovered] = useState(false);
  const ref = useRef();

  useFrame((state) => {
    if (ref.current && hovered) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={ref}
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
        onClick={(e) => { e.stopPropagation(); onSelect && onSelect(item); }}
      >
        <boxGeometry args={[0.6, h, 0.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>

      {/* 라벨 */}
      <Text position={[0, h / 2 + 0.1, 0.31]} fontSize={0.12} color="#1f2937" anchorX="center" fontFamily="monospace">
        {item.code}
      </Text>
      <Text position={[0, -0.1, 0.31]} fontSize={0.08} color={color} anchorX="center" fontWeight="bold">
        {item.quantity}
      </Text>

      {hovered && <WarehouseTooltip item={item} cap={cap} />}
    </group>
  );
}

function WarehouseLights() {
  return (
    <group>
      <ambientLight intensity={0.4} color="#e2e8f0" />
      <directionalLight
        position={[3, 6, 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={15}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[8, 6, 2]} intensity={0.6} />
      <directionalLight position={[-2, 4, 2]} intensity={0.3} />
      <pointLight position={[5, 3, 2]} intensity={0.5} color="#fbbf24" />
    </group>
  );
}

// WarehouseStatus 함수 제거됨 - 이제 메인 컴포넌트에서 직접 렌더링

function WarehouseCeilingLights({ width = 20, depth = 10, sections = 3 }) {
  const lightsPerSection = 2;
  const sectionWidth = width / sections;
  
  return (
    <group>
      {Array.from({ length: sections }, (_, sectionIdx) => (
        <group key={sectionIdx}>
          {Array.from({ length: lightsPerSection }, (_, lightIdx) => {
            const x = sectionIdx * sectionWidth + (lightIdx + 0.5) * (sectionWidth / lightsPerSection);
            const z = depth / 2;
            
            return (
              <group key={lightIdx} position={[x, 4.5, z]}>
                {/* 천장 조명 스탠드 구조 */}
                <mesh position={[0, 0.3, 0]} castShadow>
                  <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                  <meshStandardMaterial color="#2d3748" />
                </mesh>
                
                {/* 조명 갓 (반사판) */}
                <mesh position={[0, 0, 0]} castShadow>
                  <coneGeometry args={[0.4, 0.3, 8]} />
                  <meshStandardMaterial color="#4a5568" side={2} />
                </mesh>
                
                {/* 조명 전구 */}
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.08]} />
                  <meshStandardMaterial color="#fffef7" emissive="#fff9c4" emissiveIntensity={0.8} />
                </mesh>
                
                {/* 빛 원뿔 효과 - 메인 */}
                <mesh position={[0, -1.5, 0]} rotation={[0, 0, 0]}>
                  <coneGeometry args={[1.2, 3, 16, 1, true]} />
                  <meshBasicMaterial 
                    color="#fff9c4" 
                    transparent 
                    opacity={0.15}
                    side={2}
                  />
                </mesh>
                
                {/* 빛 원뿔 효과 - 내부 밝은 부분 */}
                <mesh position={[0, -1.2, 0]} rotation={[0, 0, 0]}>
                  <coneGeometry args={[0.8, 2.4, 12, 1, true]} />
                  <meshBasicMaterial 
                    color="#ffffff" 
                    transparent 
                    opacity={0.25}
                    side={2}
                  />
                </mesh>
                
                {/* 빛 원뿔 효과 - 중심 핫스팟 */}
                <mesh position={[0, -1, 0]} rotation={[0, 0, 0]}>
                  <coneGeometry args={[0.4, 2, 8, 1, true]} />
                  <meshBasicMaterial 
                    color="#ffffff" 
                    transparent 
                    opacity={0.35}
                    side={2}
                  />
                </mesh>
                
                {/* 전구 주변 글로우 효과 */}
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.2]} />
                  <meshBasicMaterial 
                    color="#fff9c4" 
                    transparent 
                    opacity={0.3}
                  />
                </mesh>
                
                {/* 실제 조명 */}
                <spotLight
                  position={[0, -0.2, 0]}
                  target-position={[0, -4, 0]}
                  intensity={2.5}
                  angle={Math.PI / 5}
                  penumbra={0.2}
                  color="#ffffff"
                  castShadow
                  shadow-mapSize-width={1024}
                  shadow-mapSize-height={1024}
                />
                
                {/* 추가 포인트 라이트 */}
                <pointLight
                  position={[0, -0.15, 0]}
                  intensity={1.8}
                  color="#fff9c4"
                  distance={8}
                  decay={1}
                />
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function Warehouse3D({
  data = [],
  threshold = 100,           // 폴백 값 (item.limit 없을 때만 사용)
  onSelect,
  getCameraStream,
  style,
  layout = "longZ",
  minSections = 4,           // A/B/C/D(불량) 기본 노출
  minRows = 2,
  minCols = 3,
}) {
  const [selected, setSelected] = useState(null);

  // 1) 위치 지정된 아이템만으로 1차 그리드 추정
  const located = useMemo(() => data.filter(d => !!d.location), [data]);
  const baseStats = useMemo(
    () => getGridStats(located, { minSections, minRows, minCols }),
    [located, minSections, minRows, minCols]
  );

  // 2) 오토 위치 부여
  const items = useMemo(() => {
    const withLoc = [], noLoc = [];
    for (const item of data) {
      const copy = { ...item };
      if (copy.location) copy.location = normalizeLocation(copy.location);
      (copy.location ? withLoc : noLoc).push(copy);
    }
    const gen = autoPositions(baseStats.sections, baseStats.rows, baseStats.cols);
    noLoc.forEach((item) => {
      const next = gen.next();
      item._autoLoc = next.done ? "A-01-01" : next.value;
    });
    return [...withLoc, ...noLoc];
  }, [data, baseStats]);

  // 3) 최종 그리드 확정
  const { sections: sectionCount, rows: rowsCount, cols: colsCount } = useMemo(
    () => getGridStats(items, { minSections, minRows, minCols }),
    [items, minSections, minRows, minCols]
  );

  // ✅ 부족 항목 계산도 item별 cap 기준
  const stats = useMemo(() => {
    const total = items.length;
    const lowStock = items.filter((it) => {
      const cap = Number(it.limit) || Number(threshold) || 100;
      const qty = Number(it.quantity) || 0;
      return qty < cap * STOCK_WARN_RATIO;
    }).length;
    return { total, lowStock };
  }, [items, threshold]);

  const handleSelect = (item) => { setSelected(item); onSelect && onSelect(item); };

  // 카메라 타깃(장면 중앙) — 섹션 랙길이 + 통로폭 기준
  const sceneWidth = sectionCount * (colsCount * CELL) + (sectionCount - 1) * SECTION_GAP;
  const targetX = sceneWidth / 2;
  const targetZ = (rowsCount * CELL) / 2;

  return (
    <div style={{ position: "relative", width: "100%", height: 480, backgroundColor: "#1e293b", border: "2px solid #334155", borderRadius: 12, overflow: "hidden", ...style }}>
      <Canvas
        shadows
        camera={{ position: [targetX + 6, 6, targetZ + 6], fov: 42 }}
        dpr={[1, 2]}
        onPointerMissed={() => (document.body.style.cursor = "default")}
      >
        <color attach="background" args={["#475569"]} />
       
        <WarehouseLights />
        <WarehouseCeilingLights width={sceneWidth} depth={rowsCount * CELL} sections={sectionCount} />
        <WarehouseStructure sections={sectionCount} rowsCount={rowsCount} colsCount={colsCount} />
        <WarehouseRacks sections={sectionCount} rowsCount={rowsCount} colsCount={colsCount} />

        {items.map((item, i) => {
          const cap = Number(item.limit) || Number(threshold) || 100;   // ✅ 아이템별 cap
          return (
            <ShelfBox
              key={item.id || i}
              item={{ ...item, location: item.location || item._autoLoc }}
              cap={cap}
              onSelect={handleSelect}
              colsCount={colsCount}          // 좌표 계산에 현재 열 개수 전달
            />
          );
        })}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={Math.max(18, targetX + targetZ)}
          minPolarAngle={0.3}
          maxPolarAngle={1.3}
          target={[targetX, 1, targetZ]}
        />
      </Canvas>

      {/* 창고 현황 - 화면 고정 */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "rgba(30, 41, 59, 0.95)",
          color: "#f1f5f9",
          border: "1px solid #475569",
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(8px)",
          minWidth: 160,
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, color: "#fbbf24" }}>📦 창고 현황</div>

        <div style={{ marginBottom: 8 }}>
          <div>전체 항목: {stats.total}개</div>
          <div style={{ color: stats.lowStock > 0 ? "#ef4444" : "#22c55e" }}>부족 항목: {stats.lowStock}개</div>
        </div>

        <div style={{ borderTop: "1px solid #475569", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: 2 }} />
            <span style={{ fontSize: 11 }}>부족 (&lt;80%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: 2 }} />
            <span style={{ fontSize: 11 }}>주의 (80-99%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: 2 }} />
            <span style={{ fontSize: 11 }}>충분 (≥100%)</span>
          </div>
        </div>

        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #475569", color: "#94a3b8", fontSize: 10 }}>
          기준: <b>각 상자별 limit</b> (없으면 {Number(threshold) || 100})
        </div>
      </div>

      {/* 선택된 아이템 정보 패널 */}
      {selected && (
        <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(15, 23, 42, 0.95)", color: "#f1f5f9", padding: "12px 16px", borderRadius: 8, fontSize: 13, border: "1px solid #334155", maxWidth: 300, backdropFilter: "blur(8px)" }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}>
            📦 선택된 품목
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "1px solid #475569", color: "#94a3b8", borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer", marginLeft: "auto" }}>
              ✕
            </button>
          </div>
          <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
            <div><strong>제품:</strong> {selected.name}</div>
            <div><strong>코드:</strong> {selected.code}</div>
            <div><strong>수량:</strong> {selected.quantity}개</div>
            {selected.location && <div><strong>위치:</strong> {selected.location}</div>}
            <div style={{ color: (Number(selected.quantity)||0) >= (Number(selected.limit)||Number(threshold)||100) ? "#22c55e" : "#ef4444", fontWeight: 600, marginTop: 4 }}>
              {(Number(selected.quantity)||0) >= (Number(selected.limit)||Number(threshold)||100) ? "✅출고 가능" : "⚠️ 재고 부족"} (기준 {Number(selected.limit)||Number(threshold)||100})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
