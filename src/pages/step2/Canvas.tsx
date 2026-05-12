import { useRef, useEffect, useCallback } from "react";
import type { Blad, Point, Sparing } from "../../data/seed-types";
import { oppervlakteM2 } from "../../data/seed-types";
import {
  rechthoekOutline,
  segmentLengtes,
  boundingBox,
  uitwaartsNormaal,
  segmentMidden,
} from "../../drawing/bladHelpers";
import { sparingPath } from "../../drawing/sparingHelpers";

interface Viewport { x: number; y: number; scale: number }

interface Props {
  blad: Blad;
  selectedSegmentIndex: number | null;
  activeSparingId?: string | null;
  materiaalSoort?: string;
  vp: Viewport;
  onVpChange: (vp: Viewport | ((prev: Viewport) => Viewport)) => void;
  onFitRef: React.MutableRefObject<(() => void) | null>;
  onSegmentTap: (segmentIndex: number) => void;
  onHoekTap: (cornerIndex: number) => void;
  onSparingTap?: (id: string) => void;
}

const DIM_OFFSET = 50;
const DIM_TICK = 12;
const TAP_ZONE_THICKNESS = 24;

function pointsAttr(pts: Point[]): string {
  return pts.map(p => `${p.x},${p.y}`).join(" ");
}

function sparingKleur(type: Sparing["type"], actief: boolean): { fill: string; stroke: string } {
  if (actief) return { fill: "#0d9488", stroke: "#0d9488" };
  if (type === "KOOKPLAAT") return { fill: "#ef4444", stroke: "#dc2626" };
  if (type === "SPOELBAK")  return { fill: "#3b82f6", stroke: "#2563eb" };
  return { fill: "#94a3b8", stroke: "#64748b" };
}

const COMPOSIET_SOORTEN = new Set(["COMPOSIET", "KWARTSCOMPOSIET"]);

export default function Canvas({
  blad,
  selectedSegmentIndex,
  activeSparingId,
  materiaalSoort,
  vp,
  onVpChange,
  onFitRef,
  onSegmentTap,
  onHoekTap,
  onSparingTap,
}: Props) {
  const isComposiet = COMPOSIET_SOORTEN.has(materiaalSoort ?? "");
  const svgRef = useRef<SVGSVGElement>(null);

  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const lengtes = segmentLengtes(outline);
  const bb = boundingBox(outline);

  function computeFit(w: number, h: number): Viewport {
    const margin = DIM_OFFSET * 2 + 20;
    const bW = bb.maxX - bb.minX + margin * 2;
    const bH = bb.maxY - bb.minY + margin * 2;
    const scale = Math.min(w / bW, h / bH) * 0.85;
    return {
      x: w / 2 - ((bb.minX + bb.maxX) / 2) * scale,
      y: h / 2 - ((bb.minY + bb.maxY) / 2) * scale,
      scale,
    };
  }

  // Initial fit
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    onVpChange(computeFit(rect.width, rect.height));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blad.id]);

  // ResizeObserver
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) onVpChange(computeFit(width, height));
    });
    ro.observe(svg);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blad.id]);

  // Fit-to-screen callback voor toolbar
  useEffect(() => {
    onFitRef.current = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      onVpChange(computeFit(rect.width, rect.height));
    };
  });

  // Pointer-events: pan + pinch-zoom
  const ptrs = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panStart = useRef<{ ptId: number; vpX: number; vpY: number; cx: number; cy: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);

  function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    if (ptrs.current.size === 1) {
      panStart.current = { ptId: e.pointerId, vpX: vp.x, vpY: vp.y, cx: e.clientX, cy: e.clientY };
      pinchStart.current = null;
    } else if (ptrs.current.size === 2) {
      panStart.current = null;
      const [a, b] = [...ptrs.current.values()];
      pinchStart.current = { dist: dist2(a, b), scale: vp.scale, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
  }, [vp]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 1 && panStart.current) {
      const dx = e.clientX - panStart.current.cx;
      const dy = e.clientY - panStart.current.cy;
      onVpChange({ x: panStart.current.vpX + dx, y: panStart.current.vpY + dy, scale: vp.scale });
    } else if (ptrs.current.size === 2 && pinchStart.current) {
      const [a, b] = [...ptrs.current.values()];
      const newDist = dist2(a, b);
      const newScale = Math.max(0.05, Math.min(20, pinchStart.current.scale * (newDist / pinchStart.current.dist)));
      const { cx, cy } = pinchStart.current;
      onVpChange(prev => ({
        scale: newScale,
        x: cx - (cx - prev.x) * (newScale / prev.scale),
        y: cy - (cy - prev.y) * (newScale / prev.scale),
      }));
    }
  }, [vp.scale, onVpChange]);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    ptrs.current.delete(e.pointerId);
    panStart.current = null;
    pinchStart.current = null;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = svgRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    onVpChange(prev => {
      const newScale = Math.max(0.05, Math.min(20, prev.scale * factor));
      return {
        scale: newScale,
        x: cx - (cx - prev.x) * (newScale / prev.scale),
        y: cy - (cy - prev.y) * (newScale / prev.scale),
      };
    });
  }, [onVpChange]);

  // Maatvoering rendering
  const fontSizeMm = Math.max(16, Math.min(50, Math.min(blad.lengte, blad.breedte) / 15));
  const strokeW = fontSizeMm * 0.05;

  function renderMaatvoering(i: number) {
    const n = outline.length;
    const p = outline[i];
    const q = outline[(i + 1) % n];
    const norm = uitwaartsNormaal(outline, i);
    const mid = segmentMidden(outline, i);
    const offset = DIM_OFFSET;

    const lx1 = p.x + norm.x * offset;
    const ly1 = p.y + norm.y * offset;
    const lx2 = q.x + norm.x * offset;
    const ly2 = q.y + norm.y * offset;
    const mx = mid.x + norm.x * offset;
    const my = mid.y + norm.y * offset;
    const tickX1 = p.x + norm.x * (offset - DIM_TICK / 2);
    const tickY1 = p.y + norm.y * (offset - DIM_TICK / 2);
    const tickX2 = p.x + norm.x * (offset + DIM_TICK / 2);
    const tickY2 = p.y + norm.y * (offset + DIM_TICK / 2);
    const tick2X1 = q.x + norm.x * (offset - DIM_TICK / 2);
    const tick2Y1 = q.y + norm.y * (offset - DIM_TICK / 2);
    const tick2X2 = q.x + norm.x * (offset + DIM_TICK / 2);
    const tick2Y2 = q.y + norm.y * (offset + DIM_TICK / 2);

    const lengte = Math.round(lengtes[i]);
    const textAngle = Math.atan2(q.y - p.y, q.x - p.x) * (180 / Math.PI);
    const isActief = i === selectedSegmentIndex;

    const lineColor = isActief ? "#0d9488" : "#475569";
    const textBg = isActief ? "#0d9488" : undefined;
    const textColor = isActief ? "white" : "#1e293b";

    return (
      <g key={`maat-${i}`} stroke={lineColor} fill="none" strokeWidth={strokeW}>
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} />
        <line x1={tickX1} y1={tickY1} x2={tickX2} y2={tickY2} />
        <line x1={tick2X1} y1={tick2Y1} x2={tick2X2} y2={tick2Y2} />
        <line x1={p.x} y1={p.y} x2={lx1} y2={ly1} strokeDasharray={`${fontSizeMm * 0.3} ${fontSizeMm * 0.3}`} strokeOpacity={0.4} />
        <line x1={q.x} y1={q.y} x2={lx2} y2={ly2} strokeDasharray={`${fontSizeMm * 0.3} ${fontSizeMm * 0.3}`} strokeOpacity={0.4} />
        {isActief && textBg && (() => {
          const pillW = fontSizeMm * (String(lengte).length * 0.65 + 1.4);
          return (
            <rect
              x={mx - pillW / 2}
              y={my - fontSizeMm * 0.75}
              width={pillW}
              height={fontSizeMm * 1.5}
              fill={textBg}
              rx={fontSizeMm * 0.3}
              transform={`rotate(${textAngle} ${mx} ${my})`}
            />
          );
        })()}
        <text
          x={mx}
          y={my}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          stroke={isActief ? "none" : "white"}
          strokeWidth={isActief ? 0 : fontSizeMm * 0.25}
          paintOrder="stroke"
          fontSize={fontSizeMm}
          fontFamily="system-ui, sans-serif"
          transform={`rotate(${textAngle} ${mx} ${my})`}
        >
          {lengte}
        </text>
      </g>
    );
  }

  // Segment highlight (groen vlak)
  function renderSegmentHighlight(i: number) {
    const n = outline.length;
    const p = outline[i];
    const q = outline[(i + 1) % n];
    const norm = uitwaartsNormaal(outline, i);
    const hw = (TAP_ZONE_THICKNESS / vp.scale) / 2;
    const pts: Point[] = [
      { x: p.x + norm.x * hw, y: p.y + norm.y * hw },
      { x: q.x + norm.x * hw, y: q.y + norm.y * hw },
      { x: q.x - norm.x * hw, y: q.y - norm.y * hw },
      { x: p.x - norm.x * hw, y: p.y - norm.y * hw },
    ];
    return (
      <polygon
        key={`hl-${i}`}
        points={pointsAttr(pts)}
        fill="#0d9488"
        fillOpacity={0.18}
        stroke="none"
        style={{ pointerEvents: "none" }}
      />
    );
  }

  // Tap-zones
  function renderSegmentTapZone(i: number) {
    const n = outline.length;
    const p = outline[i];
    const q = outline[(i + 1) % n];
    const hw = (TAP_ZONE_THICKNESS / vp.scale) / 2;
    const norm = uitwaartsNormaal(outline, i);
    const pts: Point[] = [
      { x: p.x + norm.x * hw, y: p.y + norm.y * hw },
      { x: q.x + norm.x * hw, y: q.y + norm.y * hw },
      { x: q.x - norm.x * hw, y: q.y - norm.y * hw },
      { x: p.x - norm.x * hw, y: p.y - norm.y * hw },
    ];
    return (
      <polygon
        key={`tap-seg-${i}`}
        points={pointsAttr(pts)}
        fill="transparent"
        stroke="none"
        style={{ cursor: "pointer", touchAction: "none" }}
        onPointerDown={(e) => { e.stopPropagation(); onSegmentTap(i); }}
      />
    );
  }

  function renderHoekTapZone(i: number) {
    const p = outline[i];
    const r = Math.max(20, 30 / vp.scale);
    return (
      <circle
        key={`tap-hoek-${i}`}
        cx={p.x}
        cy={p.y}
        r={r}
        fill="transparent"
        stroke="none"
        style={{ cursor: "pointer", touchAction: "none" }}
        onPointerDown={(e) => { e.stopPropagation(); onHoekTap(i); }}
      />
    );
  }

  const transform = `translate(${vp.x} ${vp.y}) scale(${vp.scale})`;
  const m2 = oppervlakteM2(blad);
  const cx = (bb.minX + bb.maxX) / 2;
  const cy = (bb.minY + bb.maxY) / 2;

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-slate-50 touch-none select-none"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <g transform={transform}>
        {/* Geselecteerd segment highlight */}
        {selectedSegmentIndex !== null && renderSegmentHighlight(selectedSegmentIndex)}

        {/* Blad-polygoon */}
        <polygon
          points={pointsAttr(outline)}
          fill="white"
          stroke="#1e293b"
          strokeWidth={strokeW * 2}
        />

        {/* Sparingen */}
        {(blad.sparingen ?? []).map(sparing => {
          const actief = sparing.id === activeSparingId;
          const kleur = sparingKleur(sparing.type, actief);
          return (
            <g
              key={sparing.id}
              style={{ cursor: onSparingTap ? "pointer" : "default" }}
              onPointerDown={(e) => { e.stopPropagation(); onSparingTap?.(sparing.id); }}
            >
              <path
                d={sparingPath(sparing, "boven")}
                fill={kleur.fill}
                fillOpacity={actief ? 0.3 : 0.18}
                stroke={kleur.stroke}
                strokeWidth={strokeW * 1.5}
              />
              {sparing.vlakbouw && (
                <path
                  d={sparingPath(sparing, "onder")}
                  fill="none"
                  stroke={kleur.stroke}
                  strokeWidth={strokeW}
                  strokeDasharray={`${fontSizeMm * 0.4} ${fontSizeMm * 0.3}`}
                  strokeOpacity={0.6}
                  style={{ pointerEvents: "none" }}
                />
              )}
              {isComposiet && sparing.type === "KOOKPLAAT" && sparing.inbouwwijze === "VLAKBOUW" && (
                <g style={{ pointerEvents: "none" }}>
                  <title>Vlakbouw in composiet — risico op scheuren</title>
                  <text
                    x={sparing.positie.x + sparing.breedte / 2 - fontSizeMm * 0.1}
                    y={sparing.positie.y - sparing.hoogte / 2 + fontSizeMm * 0.9}
                    textAnchor="end"
                    dominantBaseline="auto"
                    fontSize={fontSizeMm * 0.9}
                    fill="#d97706"
                    fontFamily="system-ui, sans-serif"
                  >
                    ⚠
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* m² watermerk — verborgen zodra er sparingen zijn */}
        {!blad.sparingen?.length && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94a3b8"
            fillOpacity={0.7}
            fontSize={fontSizeMm * 1.4}
            fontFamily="system-ui, sans-serif"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {m2.toFixed(2)} m²
          </text>
        )}

        {/* Hoekpunten: wit met teal stroke */}
        {outline.map((p, i) => (
          <circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={fontSizeMm * 0.4}
            fill="white"
            stroke="#0d9488"
            strokeWidth={strokeW * 2}
          />
        ))}

        {/* Maatvoering */}
        {outline.map((_, i) => renderMaatvoering(i))}

        {/* Tap-zones segmenten */}
        {outline.map((_, i) => renderSegmentTapZone(i))}

        {/* Tap-zones hoekpunten */}
        {outline.map((_, i) => renderHoekTapZone(i))}
      </g>
    </svg>
  );
}
