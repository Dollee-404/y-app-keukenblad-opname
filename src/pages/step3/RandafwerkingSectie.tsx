import { useState } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Opname, Blad, Randafwerking, RandafwerkingType } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";
import { bladZijden, type BladZijde } from "../../drawing/bladZijdenHelpers";
import { boundingBox } from "../../drawing/bladHelpers";
import ZijdePopup from "./ZijdePopup";

const seed = seedRaw as unknown as SeedData;

interface Props { state: Opname; dispatch: React.Dispatch<OpnameAction>; }

const ZIJDE_STROKE: Record<RandafwerkingType | "onbepaald", { kleur: string; breedte: number }> = {
  onbepaald: { kleur: "#94a3b8", breedte: 0.8 },
  GEEN:      { kleur: "#475569", breedte: 1.5 },
  FACET:     { kleur: "#2563eb", breedte: 2 },
  VERSTEK:   { kleur: "#0d9488", breedte: 2.5 },
};

const CANVAS_W = 600;
const CANVAS_H = 420;
const PADDING = 80;
const HIT_HW = 10;
const LABEL_OFFSET_PX = 28;
const LABEL_MIN_DIST = 60;
const LEADER_GAP = 3;

type LabelPos = {
  zijdeId: string;
  code: string;
  kleur: string;
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
};

function computeLabelPositions(
  zijden: BladZijde[],
  blad: Blad,
  tx: (x: number) => number,
  ty: (y: number) => number,
): LabelPos[] {
  const positions: LabelPos[] = [];
  for (const z of zijden) {
    const ra = blad.randafwerkingen?.find(r => r.zijdeId === z.id);
    if (!ra) continue;
    const typeKey = ra.type as RandafwerkingType;
    const { kleur } = ZIJDE_STROKE[typeKey] ?? ZIJDE_STROKE.onbepaald;
    const anchorX = tx(z.middenPunt.x);
    const anchorY = ty(z.middenPunt.y);
    positions.push({
      zijdeId: z.id,
      code: ra.code,
      kleur,
      anchorX,
      anchorY,
      labelX: anchorX + z.normaal.x * LABEL_OFFSET_PX,
      labelY: anchorY + z.normaal.y * LABEL_OFFSET_PX,
    });
  }

  // Push labels apart if closer than LABEL_MIN_DIST
  for (let iter = 0; iter < 4; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        const dx = b.labelX - a.labelX;
        const dy = b.labelY - a.labelY;
        const dist = Math.hypot(dx, dy);
        if (dist < LABEL_MIN_DIST && dist > 0.5) {
          const push = (LABEL_MIN_DIST - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          positions[i].labelX -= nx * push;
          positions[i].labelY -= ny * push;
          positions[j].labelX += nx * push;
          positions[j].labelY += ny * push;
        }
      }
    }
  }

  return positions;
}

function BladCanvas({
  blad,
  onZijdeTap,
  actieveZijdeId,
}: {
  blad: Blad;
  onZijdeTap: (z: BladZijde) => void;
  actieveZijdeId: string | null;
}) {
  const zijden = bladZijden(blad);
  const outline = blad.outline ?? zijden.map(z => z.startPunt);
  const bb = boundingBox(outline);
  const bW = Math.max(bb.maxX - bb.minX, 1);
  const bH = Math.max(bb.maxY - bb.minY, 1);
  const scaleX = (CANVAS_W - PADDING * 2) / bW;
  const scaleY = (CANVAS_H - PADDING * 2) / bH;
  const sc = Math.min(scaleX, scaleY);
  const offX = CANVAS_W / 2 - ((bb.minX + bb.maxX) / 2) * sc;
  const offY = CANVAS_H / 2 - ((bb.minY + bb.maxY) / 2) * sc;

  function tx(x: number) { return x * sc + offX; }
  function ty(y: number) { return y * sc + offY; }

  const hw = HIT_HW / sc;
  const labelPositions = computeLabelPositions(zijden, blad, tx, ty);

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ display: "block", width: "100%", maxWidth: CANVAS_W, margin: "0 auto" }}
    >
      {/* Blad fill */}
      <polygon
        points={outline.map(p => `${tx(p.x)},${ty(p.y)}`).join(" ")}
        fill="#f8fafc"
        stroke="#1e293b"
        strokeWidth={1}
      />

      {/* Zijden: colored strokes + transparent hit-zones */}
      {zijden.map(z => {
        const ra = blad.randafwerkingen?.find(r => r.zijdeId === z.id);
        const typeKey: RandafwerkingType | "onbepaald" = ra?.type ?? "onbepaald";
        const actief = z.id === actieveZijdeId;
        const { kleur, breedte } = ZIJDE_STROKE[typeKey];
        const strokeKleur = actief ? "#f59e0b" : kleur;

        const sx = tx(z.startPunt.x); const sy = ty(z.startPunt.y);
        const ex = tx(z.eindPunt.x);  const ey = ty(z.eindPunt.y);

        const norm = z.normaal;
        const nhx = norm.x * hw * sc; const nhy = norm.y * hw * sc;
        const hitPts = `${sx + nhx},${sy + nhy} ${ex + nhx},${ey + nhy} ${ex - nhx},${ey - nhy} ${sx - nhx},${sy - nhy}`;

        return (
          <g key={z.id}>
            <line
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={strokeKleur}
              strokeWidth={breedte}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
            <polygon
              points={hitPts}
              fill="transparent"
              stroke="none"
              style={{ cursor: "pointer" }}
              onPointerDown={e => { e.stopPropagation(); onZijdeTap(z); }}
            />
          </g>
        );
      })}

      {/* Outside labels with leader lines — rendered last so they appear on top */}
      {labelPositions.map(lp => {
        const actief = lp.zijdeId === actieveZijdeId;
        const kleur = actief ? "#f59e0b" : lp.kleur;
        const dx = lp.labelX - lp.anchorX;
        const dy = lp.labelY - lp.anchorY;
        const len = Math.hypot(dx, dy) || 1;
        // Leave a small gap at both ends of the leader line
        const lx1 = lp.anchorX + (dx / len) * LEADER_GAP;
        const ly1 = lp.anchorY + (dy / len) * LEADER_GAP;
        const lx2 = lp.labelX - (dx / len) * LEADER_GAP;
        const ly2 = lp.labelY - (dy / len) * LEADER_GAP;
        return (
          <g key={`label-${lp.zijdeId}`} style={{ pointerEvents: "none" }}>
            <line
              x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke="#94a3b8"
              strokeWidth={0.5}
            />
            <text
              x={lp.labelX}
              y={lp.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill={kleur}
              fontFamily="system-ui, sans-serif"
              fontWeight={600}
            >
              {lp.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RandafwerkingSectie({ state, dispatch }: Props) {
  const [geselecteerdBladId, setGeselecteerdBladId] = useState<string>(state.bladen[0]?.id ?? "");
  const [actieveZijde, setActieveZijde] = useState<BladZijde | null>(null);
  const [bulkCode, setBulkCode] = useState<string>("DV40");

  const blad = state.bladen.find(b => b.id === geselecteerdBladId) ?? state.bladen[0] ?? null;

  if (!blad) {
    return (
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>Randafwerking</h2>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Voeg eerst bladen toe in stap 2.</p>
      </div>
    );
  }

  const zijden = bladZijden(blad);
  const aantalBekend = (blad.randafwerkingen ?? []).length;

  function handleOpslaan(ra: Randafwerking) {
    dispatch({ type: "RANDAFWERKING_BIJWERKEN", bladId: blad.id, randafwerking: ra });
    setActieveZijde(null);
  }

  function handleVerwijder() {
    if (!actieveZijde) return;
    dispatch({ type: "RANDAFWERKING_VERWIJDEREN", bladId: blad.id, zijdeId: actieveZijde.id });
    setActieveZijde(null);
  }

  function handleBulkApply() {
    const def = seed.randafwerking_codes.find(r => r.code === bulkCode);
    if (!def) return;
    for (const z of zijden) {
      dispatch({
        type: "RANDAFWERKING_BIJWERKEN",
        bladId: blad.id,
        randafwerking: {
          zijdeId: z.id,
          code: def.code,
          label: def.label,
          type: def.type as RandafwerkingType,
          hoogte_mm: def.hoogte_mm,
        },
      });
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Randafwerking per zijde</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Tik op een zijde om de afwerking te kiezen.
      </p>

      {/* Blad-selector */}
      {state.bladen.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={geselecteerdBladId}
            onChange={e => { setGeselecteerdBladId(e.target.value); setActieveZijde(null); }}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 14, minHeight: 44 }}
          >
            {state.bladen.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
      )}

      {/* Progress */}
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
        <span style={{ fontWeight: 500 }}>{aantalBekend}/{zijden.length}</span> zijden ingesteld
        {aantalBekend < zijden.length && (
          <span style={{ color: "#d97706", marginLeft: 8 }}>⚠ Niet volledig</span>
        )}
      </div>

      {/* SVG canvas */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <BladCanvas
          blad={blad}
          onZijdeTap={z => setActieveZijde(prev => prev?.id === z.id ? null : z)}
          actieveZijdeId={actieveZijde?.id ?? null}
        />
      </div>

      {/* Bulk-apply */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#475569" }}>Stel alle zijden in op</span>
        <select
          value={bulkCode}
          onChange={e => setBulkCode(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, minHeight: 36 }}
        >
          {seed.randafwerking_codes.map(r => (
            <option key={r.code} value={r.code}>{r.code}</option>
          ))}
        </select>
        <button
          onClick={handleBulkApply}
          style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "#0d9488", color: "white", fontSize: 13, cursor: "pointer", minHeight: 36 }}
        >
          Toepassen
        </button>
      </div>

      {/* Popup */}
      {actieveZijde && (
        <ZijdePopup
          zijdeId={actieveZijde.id}
          zijdeLabel={actieveZijde.label}
          huidig={blad.randafwerkingen?.find(r => r.zijdeId === actieveZijde.id)}
          onOpslaan={handleOpslaan}
          onVerwijder={handleVerwijder}
          onSluiten={() => setActieveZijde(null)}
        />
      )}
    </div>
  );
}
