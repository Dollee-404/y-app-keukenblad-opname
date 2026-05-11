import { useRef, useState, useEffect, useCallback } from "react";
import type { Blad, Point } from "../../data/seed-types";
import {
  rechthoekOutline,
  segmentLengtes,
  boundingBox,
  uitwaartsNormaal,
  segmentMidden,
} from "../../drawing/bladHelpers";

interface Viewport { x: number; y: number; scale: number }
interface Props {
  blad: Blad;
  onSegmentTap: (segmentIndex: number) => void;
  onHoekTap: (cornerIndex: number) => void;
}

const DIM_OFFSET = 50;      // mm buiten het blad voor maatlijnen
const DIM_TICK = 12;        // mm lengte van eindstreepjes
const TAP_ZONE_THICKNESS = 24; // px hitzone dikte voor segmenten (in screen space)

function pointsAttr(pts: Point[]): string {
  return pts.map(p => `${p.x},${p.y}`).join(" ");
}

export default function Canvas({ blad, onSegmentTap, onHoekTap }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, scale: 1 });

  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const lengtes = segmentLengtes(outline);
  const bb = boundingBox(outline);

  // Initial fit: schaal het blad zodat het in 80% van het canvas past
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const margin = DIM_OFFSET * 2 + 20;
    const bW = bb.maxX - bb.minX + margin * 2;
    const bH = bb.maxY - bb.minY + margin * 2;
    const scale = Math.min(rect.width / bW, rect.height / bH) * 0.85;
    setVp({
      x: rect.width / 2 - ((bb.minX + bb.maxX) / 2) * scale,
      y: rect.height / 2 - ((bb.minY + bb.maxY) / 2) * scale,
      scale,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blad.id]);

  // ── Pointer-events voor pan + pinch-zoom ──
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
      pinchStart.current = {
        dist: dist2(a, b),
        scale: vp.scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
    }
  }, [vp]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrs.current.size === 1 && panStart.current) {
      const dx = e.clientX - panStart.current.cx;
      const dy = e.clientY - panStart.current.cy;
      setVp({ x: panStart.current.vpX + dx, y: panStart.current.vpY + dy, scale: vp.scale });
    } else if (ptrs.current.size === 2 && pinchStart.current) {
      const [a, b] = [...ptrs.current.values()];
      const newDist = dist2(a, b);
      const newScale = Math.max(0.05, Math.min(20, pinchStart.current.scale * (newDist / pinchStart.current.dist)));
      const { cx, cy } = pinchStart.current;
      setVp(prev => ({
        scale: newScale,
        x: cx - (cx - prev.x) * (newScale / prev.scale),
        y: cy - (cy - prev.y) * (newScale / prev.scale),
      }));
    }
  }, [vp.scale]);

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
    setVp(prev => {
      const newScale = Math.max(0.05, Math.min(20, prev.scale * factor));
      return {
        scale: newScale,
        x: cx - (cx - prev.x) * (newScale / prev.scale),
        y: cy - (cy - prev.y) * (newScale / prev.scale),
      };
    });
  }, []);

  // ── Maatvoering rendering ──
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

    return (
      <g key={`maat-${i}`} className="maatvoering" stroke="#475569" fill="none" strokeWidth={strokeW}>
        {/* Maatlijn */}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} />
        {/* Eindstreepjes */}
        <line x1={tickX1} y1={tickY1} x2={tickX2} y2={tickY2} />
        <line x1={tick2X1} y1={tick2Y1} x2={tick2X2} y2={tick2Y2} />
        {/* Hulplijnen van hoekpunt naar maatlijn */}
        <line x1={p.x} y1={p.y} x2={lx1} y2={ly1} strokeDasharray={`${fontSizeMm * 0.3} ${fontSizeMm * 0.3}`} strokeOpacity={0.4} />
        <line x1={q.x} y1={q.y} x2={lx2} y2={ly2} strokeDasharray={`${fontSizeMm * 0.3} ${fontSizeMm * 0.3}`} strokeOpacity={0.4} />
        {/* Maatgetal */}
        <text
          x={mx}
          y={my}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1e293b"
          stroke="white"
          strokeWidth={fontSizeMm * 0.25}
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

  // ── Tap-zone voor segment ──
  function renderSegmentTapZone(i: number) {
    const n = outline.length;
    const p = outline[i];
    const q = outline[(i + 1) % n];
    const halfW = (TAP_ZONE_THICKNESS / vp.scale) / 2;
    const norm = uitwaartsNormaal(outline, i);
    // Breedte keer twee zijden voor hitzone
    const pts: Point[] = [
      { x: p.x + norm.x * halfW, y: p.y + norm.y * halfW },
      { x: q.x + norm.x * halfW, y: q.y + norm.y * halfW },
      { x: q.x - norm.x * halfW, y: q.y - norm.y * halfW },
      { x: p.x - norm.x * halfW, y: p.y - norm.y * halfW },
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

  // ── Tap-zone voor hoekpunt ──
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
        {/* Blad-polygoon */}
        <polygon
          points={pointsAttr(outline)}
          fill="white"
          stroke="#1e293b"
          strokeWidth={strokeW * 2}
        />

        {/* Hoekpunten */}
        {outline.map((p, i) => (
          <circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={fontSizeMm * 0.25}
            fill="#94a3b8"
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
