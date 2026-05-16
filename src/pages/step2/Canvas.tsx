import { useRef, useEffect, useCallback } from "react";
import type { Blad, Point, Sparing, Boorgat, Opname } from "../../data/seed-types";
import { oppervlakteM2 } from "../../data/seed-types";
import {
  rechthoekOutline,
  segmentLengtes,
  boundingBox,
  uitwaartsNormaal,
  segmentMidden,
} from "../../drawing/bladHelpers";
import { sparingPath } from "../../drawing/sparingHelpers";
import { randAfstand } from "../../drawing/boorgatHelpers";
import { gekoppeldeZijde } from "../../state/verstekHelpers";

interface Viewport { x: number; y: number; scale: number }

interface Props {
  blad: Blad;
  selectedSegmentIndex: number | null;
  activeSparingId?: string | null;
  activeBoorgatId?: string | null;
  materiaalSoort?: string;
  state?: Opname;
  vp: Viewport;
  onVpChange: (vp: Viewport | ((prev: Viewport) => Viewport)) => void;
  onFitRef: React.MutableRefObject<(() => void) | null>;
  onSegmentTap: (segmentIndex: number) => void;
  onHoekTap: (cornerIndex: number) => void;
  onSparingTap?: (id: string) => void;
  onBoorgatTap?: (id: string) => void;
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
  activeBoorgatId,
  materiaalSoort,
  state,
  vp,
  onVpChange,
  onFitRef,
  onSegmentTap,
  onHoekTap,
  onSparingTap,
  onBoorgatTap,
}: Props) {
  const isComposiet = COMPOSIET_SOORTEN.has(materiaalSoort ?? "");
  const svgRef = useRef<SVGSVGElement>(null);

  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const lengtes = segmentLengtes(outline);
  const bb = boundingBox(outline);

  // SVG Y=0 is at top; datamodel Y=0 is at physical bottom — flip for rendering.
  const fy = (y: number) => blad.breedte - y;

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
    // Normalize so text is never upside-down (bottom edge has angle=180°)
    const displayAngle = textAngle > 90 || textAngle < -90 ? textAngle + 180 : textAngle;
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
              transform={`rotate(${displayAngle} ${mx} ${my})`}
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
          transform={`rotate(${displayAngle} ${mx} ${my})`}
        >
          {lengte}
        </text>
      </g>
    );
  }

  // Verstek-annotaties: driehoekjes (ra.verstek=true) + koppeling-sub-label (alleen bij actieve relatie)
  function renderVerstekAnnotaties(i: number) {
    if (!state) return null;
    const zijdeId = String(i);
    const ra = blad.randafwerkingen?.find(r => r.zijdeId === zijdeId);
    if (!ra?.verstek) return null;

    const n = outline.length;
    const p = outline[i];
    const q = outline[(i + 1) % n];
    const norm = uitwaartsNormaal(outline, i);
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy);
    const dir = { x: dx / len, y: dy / len };

    const h = fontSizeMm * 0.5;
    const b = fontSizeMm * 0.35;
    const inset = fontSizeMm * 0.4;

    const tp1 = { x: p.x + dir.x * inset, y: p.y + dir.y * inset };
    const tip1 = { x: tp1.x + norm.x * h, y: tp1.y + norm.y * h };
    const base1a = { x: tp1.x + dir.x * b, y: tp1.y + dir.y * b };
    const base1b = { x: tp1.x - dir.x * b, y: tp1.y - dir.y * b };

    const tp2 = { x: q.x - dir.x * inset, y: q.y - dir.y * inset };
    const tip2 = { x: tp2.x + norm.x * h, y: tp2.y + norm.y * h };
    const base2a = { x: tp2.x + dir.x * b, y: tp2.y + dir.y * b };
    const base2b = { x: tp2.x - dir.x * b, y: tp2.y - dir.y * b };

    const mid = segmentMidden(outline, i);
    const textAngle = Math.atan2(q.y - p.y, q.x - p.x) * (180 / Math.PI);
    const displayAngle = textAngle > 90 || textAngle < -90 ? textAngle + 180 : textAngle;
    const subOffset = DIM_OFFSET + fontSizeMm * 1.6;
    const slx = mid.x + norm.x * subOffset;
    const sly = mid.y + norm.y * subOffset;

    const koppeling = gekoppeldeZijde(state, blad.id, zijdeId);
    const triColor = "#0d9488";

    return (
      <g key={`verstek-${i}`} style={{ pointerEvents: "none" }}>
        <polygon
          points={`${tip1.x},${tip1.y} ${base1a.x},${base1a.y} ${base1b.x},${base1b.y}`}
          fill={triColor}
          fillOpacity={0.85}
          stroke="none"
        />
        <polygon
          points={`${tip2.x},${tip2.y} ${base2a.x},${base2a.y} ${base2b.x},${base2b.y}`}
          fill={triColor}
          fillOpacity={0.85}
          stroke="none"
        />
        {koppeling && (
          <text
            x={slx}
            y={sly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={triColor}
            stroke="white"
            strokeWidth={fontSizeMm * 0.2}
            paintOrder="stroke"
            fontSize={fontSizeMm * 0.75}
            fontFamily="system-ui, sans-serif"
            transform={`rotate(${displayAngle} ${slx} ${sly})`}
            style={{ userSelect: "none" }}
          >
            ↔ {koppeling.bladNaam}
          </text>
        )}
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

  function renderBoorgat(bg: Boorgat) {
    const r = bg.diameter / 2;
    const bgY = fy(bg.positie.y);
    const tapR = r + Math.max(10, 14 / vp.scale);
    const actief = bg.id === activeBoorgatId;
    const kleur = actief ? "#4338ca" : "#6B4FB8";
    const dasharray = bg.doorboring ? undefined : `${fontSizeMm * 0.4} ${fontSizeMm * 0.25}`;
    const { risico } = randAfstand(bg.positie, bg.diameter, blad);
    const centerFontSize = Math.min(r * 0.8, fontSizeMm * 0.6);
    return (
      <g
        key={bg.id}
        style={{ cursor: onBoorgatTap ? "pointer" : "default" }}
        onPointerDown={(e) => { e.stopPropagation(); onBoorgatTap?.(bg.id); }}
      >
        <circle cx={bg.positie.x} cy={bgY} r={tapR} fill="transparent" stroke="none" />
        {actief && (
          <circle
            cx={bg.positie.x} cy={bgY} r={r + strokeW * 4}
            fill={kleur} fillOpacity={0.12} stroke="none"
            style={{ pointerEvents: "none" }}
          />
        )}
        <circle
          cx={bg.positie.x} cy={bgY} r={r}
          fill="none" stroke={kleur} strokeWidth={strokeW * 1.5}
          strokeDasharray={dasharray}
          style={{ pointerEvents: "none" }}
        />
        {bg.diameter >= 25 && (
          <text
            x={bg.positie.x} y={bgY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={centerFontSize} fill={kleur} fillOpacity={0.65}
            fontFamily="system-ui, sans-serif"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {bg.diameter}
          </text>
        )}
        {bg.notitie && (
          <text
            x={bg.positie.x + r * 0.7} y={bgY - r * 0.7}
            fontSize={fontSizeMm * 0.7} textAnchor="start" dominantBaseline="middle"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <title>{bg.notitie}</title>
            ✏
          </text>
        )}
        {risico && (
          <text
            x={bg.positie.x - r - fontSizeMm * 0.1}
            y={bgY - r}
            fontSize={fontSizeMm * 0.85} textAnchor="end" dominantBaseline="middle"
            fill="#b45309"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <title>Boorgat &lt;60mm van bladrand — risico op breuk</title>
            ⚠
          </text>
        )}
      </g>
    );
  }

  function renderBoorgatGroepLijnen() {
    const boorgaten = blad.boorgaten ?? [];
    const groepen = new Map<string, Boorgat[]>();
    for (const bg of boorgaten) {
      if (!bg.groepId) continue;
      if (!groepen.has(bg.groepId)) groepen.set(bg.groepId, []);
      groepen.get(bg.groepId)!.push(bg);
    }
    const result: React.ReactNode[] = [];
    groepen.forEach((leden, groepId) => {
      const gesorteerd = [...leden].sort((a, b) => (a.groepVolgnummer ?? 1) - (b.groepVolgnummer ?? 1));
      for (let i = 0; i < gesorteerd.length - 1; i++) {
        const a = gesorteerd[i];
        const b = gesorteerd[i + 1];
        const ayf = fy(a.positie.y);
        const byf = fy(b.positie.y);
        const mx = (a.positie.x + b.positie.x) / 2;
        const my = (ayf + byf) / 2;
        const afstand = Math.round(Math.hypot(b.positie.x - a.positie.x, b.positie.y - a.positie.y));
        result.push(
          <g key={`groep-${groepId}-${i}`} style={{ pointerEvents: "none" }}>
            <line
              x1={a.positie.x} y1={ayf} x2={b.positie.x} y2={byf}
              stroke="#6B4FB8" strokeWidth={strokeW}
              strokeDasharray={`${fontSizeMm * 0.3} ${fontSizeMm * 0.2}`}
              strokeOpacity={0.5}
            />
            <text
              x={mx} y={my - fontSizeMm * 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={fontSizeMm * 0.7} fill="#6B4FB8"
              stroke="white" strokeWidth={fontSizeMm * 0.18} paintOrder="stroke"
              fontFamily="system-ui, sans-serif"
            >
              {afstand}
            </text>
          </g>
        );
      }
    });
    return result;
  }

  function renderReferentieLijnen() {
    const sparingen = blad.sparingen ?? [];
    const boorgaten = blad.boorgaten ?? [];
    const ol = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
    const xs = ol.map(p => p.x);
    const ys = ol.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const lijnen: React.ReactNode[] = [];

    function lijnNaarPunt(key: string, van: { x: number; y: number }, naar: { x: number; y: number }) {
      lijnen.push(
        <line
          key={key}
          x1={van.x} y1={van.y} x2={naar.x} y2={naar.y}
          stroke="#94a3b8"
          strokeWidth={strokeW * 0.6}
          strokeDasharray={`${fontSizeMm * 0.4} ${fontSizeMm * 0.2}`}
          strokeOpacity={0.7}
          style={{ pointerEvents: "none" }}
        />
      );
    }

    function referentieoorsprong(ref: NonNullable<(typeof boorgaten)[0]["referentie"]>, pos: { x: number; y: number }): { x: number; y: number } | null {
      switch (ref.type) {
        case "LINKSONDER": return null;
        case "LINKERRAND": return { x: minX, y: fy(pos.y) };
        case "RECHTERRAND": return { x: maxX, y: fy(pos.y) };
        case "MIDDEN_BLAD": return { x: midX, y: midY };
        case "VORIGE_SPARING": {
          const s = sparingen.find(s => s.id === ref.sparingId);
          return s ? { x: s.positie.x, y: fy(s.positie.y) } : null;
        }
        case "VORIG_BOORGAT": {
          const bg = boorgaten.find(bg => bg.id === ref.boorgatId);
          return bg ? { x: bg.positie.x, y: fy(bg.positie.y) } : null;
        }
      }
    }

    const actiefBoorgat = boorgaten.find(bg => bg.id === activeBoorgatId);
    if (actiefBoorgat?.referentie && actiefBoorgat.referentie.type !== "LINKSONDER") {
      const orig = referentieoorsprong(actiefBoorgat.referentie, actiefBoorgat.positie);
      if (orig) lijnNaarPunt(`ref-bg-${actiefBoorgat.id}`, orig, { x: actiefBoorgat.positie.x, y: fy(actiefBoorgat.positie.y) });
    }

    const actieveSparing = sparingen.find(s => s.id === activeSparingId);
    if (actieveSparing?.referentie && actieveSparing.referentie.type !== "LINKSONDER") {
      const orig = referentieoorsprong(actieveSparing.referentie, actieveSparing.positie);
      if (orig) lijnNaarPunt(`ref-sp-${actieveSparing.id}`, orig, { x: actieveSparing.positie.x, y: fy(actieveSparing.positie.y) });
    }

    return lijnen;
  }

  function renderBoorgatLabels() {
    const labelFontSize = fontSizeMm * 0.85;
    return boorgatLabels.map((label, idx) => {
      const labelY = label.zone === 'BOVEN'
        ? -(DIM_OFFSET + fontSizeMm * 1.8)
        : blad.breedte + DIM_OFFSET + fontSizeMm * 1.8;
      const leaderStartY = label.zone === 'BOVEN'
        ? labelY + labelFontSize * 0.6
        : labelY - labelFontSize * 0.6;
      const leaderEndY = label.zone === 'BOVEN'
        ? label.leaderEndY - fontSizeMm * 0.4
        : label.leaderEndY + fontSizeMm * 0.4;
      return (
        <g key={`bg-label-${idx}`} style={{ pointerEvents: "none" }}>
          <line
            x1={label.labelX} y1={leaderStartY}
            x2={label.groupCenterX} y2={leaderEndY}
            stroke="#B4B2A9" strokeWidth={strokeW * 0.5}
            strokeDasharray={`${fontSizeMm * 0.15} ${fontSizeMm * 0.15}`}
          />
          <text
            x={label.labelX} y={labelY}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={labelFontSize}
            fill="#444441"
            fontFamily="system-ui, sans-serif"
          >
            {label.text}
          </text>
        </g>
      );
    });
  }

  // Grouped label placement: outside blad-outline, with leader lines.
  // Boorgaten within 100mm horizontal → one cluster → one combined label.
  // Zone BOVEN when physical Y >= breedte/2, else ONDER.
  // Labels spread to min 80mm apart within each zone.
  type BoorgatLabelInfo = {
    text: string;
    labelX: number;
    zone: 'BOVEN' | 'ONDER';
    groupCenterX: number;
    leaderEndY: number;
  };

  const boorgatLabels: BoorgatLabelInfo[] = (() => {
    const bgs = blad.boorgaten ?? [];
    if (bgs.length === 0) return [];

    const sorted = [...bgs].sort((a, b) => a.positie.x - b.positie.x);

    const clusters: Boorgat[][] = [];
    for (const bg of sorted) {
      const last = clusters[clusters.length - 1];
      const lastMember = last?.[last.length - 1];
      if (lastMember && Math.abs(lastMember.positie.x - bg.positie.x) <= 100) {
        last.push(bg);
      } else {
        clusters.push([bg]);
      }
    }

    const labels: BoorgatLabelInfo[] = clusters.map(group => {
      const centerX = group.reduce((s, b) => s + b.positie.x, 0) / group.length;
      const avgPhysY = group.reduce((s, b) => s + b.positie.y, 0) / group.length;
      const zone: 'BOVEN' | 'ONDER' = avgPhysY >= blad.breedte / 2 ? 'BOVEN' : 'ONDER';

      const byDiam = new Map<number, number>();
      for (const bg of group) byDiam.set(bg.diameter, (byDiam.get(bg.diameter) ?? 0) + 1);
      const text = Array.from(byDiam.entries())
        .sort(([a], [b]) => a - b)
        .map(([d, n]) => n === 1 ? `Ø${d}` : `${n}× Ø${d}`)
        .join(' + ');

      const leaderEndY = zone === 'BOVEN'
        ? Math.min(...group.map(bg => fy(bg.positie.y) - bg.diameter / 2))
        : Math.max(...group.map(bg => fy(bg.positie.y) + bg.diameter / 2));

      return { text, labelX: centerX, zone, groupCenterX: centerX, leaderEndY };
    });

    const MIN_GAP = 80;
    for (const zone of ['BOVEN', 'ONDER'] as const) {
      const zl = labels.filter(l => l.zone === zone).sort((a, b) => a.labelX - b.labelX);
      for (let i = 1; i < zl.length; i++) {
        if (zl[i].labelX - zl[i - 1].labelX < MIN_GAP) {
          zl[i].labelX = zl[i - 1].labelX + MIN_GAP;
        }
      }
    }

    return labels;
  })();

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
          const rsp = { ...sparing, positie: { x: sparing.positie.x, y: fy(sparing.positie.y) } };
          return (
            <g
              key={sparing.id}
              style={{ cursor: onSparingTap ? "pointer" : "default" }}
              onPointerDown={(e) => { e.stopPropagation(); onSparingTap?.(sparing.id); }}
            >
              <path
                d={sparingPath(rsp, "boven")}
                fill={kleur.fill}
                fillOpacity={actief ? 0.3 : 0.18}
                stroke={kleur.stroke}
                strokeWidth={strokeW * 1.5}
              />
              {sparing.notitie && (
                <title>{sparing.notitie}</title>
              )}
              {sparing.notitie && (
                <text
                  x={rsp.positie.x + rsp.breedte / 2 + fontSizeMm * 0.1}
                  y={rsp.positie.y + rsp.hoogte / 2 - fontSizeMm * 0.1}
                  fontSize={fontSizeMm * 0.85}
                  textAnchor="start" dominantBaseline="auto"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  ✏
                </text>
              )}
              {sparing.vlakbouw && (
                <path
                  d={sparingPath(rsp, "onder")}
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
                    x={rsp.positie.x + rsp.breedte / 2 - fontSizeMm * 0.1}
                    y={rsp.positie.y - rsp.hoogte / 2 + fontSizeMm * 0.9}
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

        {/* Referentielijntjes (gestippeld grijs naar referentiepunt) */}
        {renderReferentieLijnen()}

        {/* Groepverbindingslijnen */}
        {renderBoorgatGroepLijnen()}

        {/* Boorgaten */}
        {(blad.boorgaten ?? []).map(bg => renderBoorgat(bg))}

        {/* Boorgat-labels buiten blad-outline, met leader-lijnen */}
        {renderBoorgatLabels()}

        {/* m² watermerk — verborgen zodra er sparingen of boorgaten zijn */}
        {!blad.sparingen?.length && !blad.boorgaten?.length && (
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

        {/* Verstek-annotaties */}
        {outline.map((_, i) => renderVerstekAnnotaties(i))}

        {/* Tap-zones segmenten */}
        {outline.map((_, i) => renderSegmentTapZone(i))}

        {/* Tap-zones hoekpunten */}
        {outline.map((_, i) => renderHoekTapZone(i))}
      </g>
    </svg>
  );
}
