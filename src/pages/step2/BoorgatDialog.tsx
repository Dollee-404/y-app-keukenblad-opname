import { useState } from "react";
import {
  IconBolt, IconPlug, IconPlugConnected,
  IconDroplet, IconDroplets, IconBottle,
  IconCylinder, IconCircleDot, IconWind, IconCircle,
} from "@tabler/icons-react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Boorgat, BoorgatDoelCode, Blad } from "../../data/seed-types";
import { rechthoekOutline } from "../../drawing/bladHelpers";
import { randAfstand } from "../../drawing/boorgatHelpers";

const seed = seedRaw as unknown as SeedData;

interface Props {
  blad: Blad;
  onToevoegen: (boorgat: Boorgat) => void;
  onSluiten: () => void;
}

let teller = 0;
function nieuweId(): string { return `bg-${++teller}`; }

type DoelInfo = {
  code: BoorgatDoelCode;
  label: string;
  sub: string;
  Icon: React.ElementType;
};

type Categorie = {
  label: string;
  kleur: string;
  Icon: React.ElementType;
  doelen: DoelInfo[];
};

const CATEGORIEEN: Categorie[] = [
  {
    label: "STROOM",
    kleur: "#b45309",
    Icon: IconBolt,
    doelen: [
      { code: "ELEKTRA",     label: "Stopcontact",  sub: "Ø70 enkel",  Icon: IconPlug },
      { code: "DUBBELE_WCD", label: "Dubbele wcd",  sub: "Ø70 dubbel", Icon: IconPlugConnected },
    ],
  },
  {
    label: "WATER",
    kleur: "#0369a1",
    Icon: IconDroplet,
    doelen: [
      { code: "KRAAN",    label: "Losse kraan",  sub: "Ø35",  Icon: IconDroplet },
      { code: "QUOOKER",  label: "Quooker",      sub: "Ø35",  Icon: IconDroplets },
      { code: "ZEEPPOMP", label: "Zeeppomp",     sub: "Ø35",  Icon: IconBottle },
    ],
  },
  {
    label: "DOORVOER & OVERIG",
    kleur: "#64748b",
    Icon: IconCylinder,
    doelen: [
      { code: "DOORVOER", label: "Leiding-doorvoer", sub: "Ø70 kabel/buis", Icon: IconCircleDot },
      { code: "DOWNDRAFT", label: "Downdraft",       sub: "eigen diameter", Icon: IconWind },
      { code: "OVERIG",   label: "Overig",           sub: "eigen diameter", Icon: IconCircle },
    ],
  },
];

const QUICK_DIAMETERS = [35, 50, 70, 90];

export default function BoorgatDialog({ blad, onToevoegen, onSluiten }: Props) {
  const [stap, setStap] = useState<1 | 2 | 3>(1);
  const [doel, setDoel] = useState<BoorgatDoelCode | null>(null);
  const [diameter, setDiameter] = useState("35");
  const [doorboring, setDoorboring] = useState(true);

  const defaultX = Math.round(blad.lengte / 2);
  const defaultY = Math.round(blad.breedte / 2);
  const [posX, setPosX] = useState(String(defaultX));
  const [posY, setPosY] = useState(String(defaultY));

  function handleDoelKiezen(code: BoorgatDoelCode) {
    setDoel(code);
    const def = seed.boorgat_doelen.find(d => d.code === code);
    if (def?.default_diameter_mm) setDiameter(String(def.default_diameter_mm));
    setStap(2);
  }

  function handleToepassen() {
    const x = Number(posX);
    const y = Number(posY);
    const d = Number(diameter) || 35;
    if (!doel || !x || !y) return;
    onToevoegen({
      id: nieuweId(),
      bladId: blad.id,
      doel,
      diameter: d,
      doorboring,
      positie: { x, y },
    });
  }

  const x = Number(posX) || defaultX;
  const y = Number(posY) || defaultY;
  const d = Number(diameter) || 35;
  const randCheck = stap === 3 ? randAfstand({ x, y }, d, blad) : null;

  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  const vbW = Math.max(...xs) + 40;
  const vbH = Math.max(...ys) + 40;

  const inputKlasse = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  const doelInfo = CATEGORIEEN.flatMap(c => c.doelen).find(d => d.code === doel);
  const doelLabel = doelInfo?.label ?? (doel ? (seed.boorgat_doelen.find(d => d.code === doel)?.label ?? doel) : "");

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={onSluiten} />
      <div style={{
        position: "relative", background: "white", borderRadius: 12,
        width: "100%", maxWidth: 420, maxHeight: "85vh", overflow: "hidden",
        display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
            {stap === 1 && "Boorgat toevoegen"}
            {stap === 2 && `${doelLabel} — diameter en doorboring`}
            {stap === 3 && `${doelLabel} — positie instellen`}
          </span>
          <button onClick={onSluiten} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          {/* Stap 1 — Doel kiezen met categorieën */}
          {stap === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {CATEGORIEEN.map(cat => (
                <div key={cat.label}>
                  {/* Categorie-header */}
                  <div style={{ ...labelStyle, color: cat.kleur, marginBottom: 6 }}>
                    <cat.Icon size={13} stroke={1.5} />
                    {cat.label}
                  </div>
                  {/* Keuze-knoppen */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {cat.doelen.map(doel => (
                      <button
                        key={doel.code}
                        onClick={() => handleDoelKiezen(doel.code)}
                        style={{
                          minHeight: 52,
                          padding: "10px 14px",
                          border: "0.5px solid #e2e8f0",
                          borderRadius: 8,
                          background: "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          textAlign: "left",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}
                      >
                        <doel.Icon size={20} stroke={1.5} color="#475569" style={{ flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{doel.label}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{doel.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Hint-tekst onder Water */}
                  {cat.label === "WATER" && (
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: "6px 2px 0", lineHeight: 1.4 }}>
                      Tip: kraan bij spoelbak gaat sneller via de spoelbak-flow
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stap 2 — Diameter + doorboring */}
          {stap === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                  Diameter (mm)
                </label>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {QUICK_DIAMETERS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDiameter(String(d))}
                      style={{
                        flex: 1, padding: "6px 0", fontSize: 12, border: "0.5px solid",
                        borderColor: diameter === String(d) ? "#0d9488" : "#e2e8f0",
                        borderRadius: 6, background: diameter === String(d) ? "#f0fdfa" : "white",
                        color: diameter === String(d) ? "#0d9488" : "#475569",
                        cursor: "pointer", fontWeight: diameter === String(d) ? 600 : 400,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputKlasse}
                  value={diameter}
                  onChange={e => setDiameter(e.target.value)}
                  placeholder="Anders..."
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                  Doorboring
                </label>
                <div style={{ display: "flex", border: "0.5px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setDoorboring(val)}
                      style={{
                        flex: 1, padding: "8px 0", fontSize: 12, border: "none",
                        background: doorboring === val ? "#0d9488" : "white",
                        color: doorboring === val ? "white" : "#475569",
                        cursor: "pointer", fontWeight: doorboring === val ? 600 : 400,
                      }}
                    >
                      {val ? "Doorgaand" : "Blind"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stap 3 — Positie + preview */}
          {stap === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    X — vanaf linkerrand (mm)
                  </label>
                  <input type="number" inputMode="numeric" className={inputKlasse} value={posX} onChange={e => setPosX(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                    Y — vanaf onderkant (mm)
                  </label>
                  <input type="number" inputMode="numeric" className={inputKlasse} value={posY} onChange={e => setPosY(e.target.value)} />
                </div>
              </div>

              {randCheck?.risico && (
                <div style={{ background: "#fffbeb", borderLeft: "3px solid #b45309", borderRadius: "0 6px 6px 0", padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
                    <p style={{ fontSize: 12, color: "#78350f", margin: 0 }}>
                      Boorgat {randCheck.minAfstand}mm van bladrand — risico op breuk bij installatie.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ borderRadius: 6, border: "0.5px solid #e2e8f0", background: "#f8fafc", padding: 8 }}>
                <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Voorvertoon</p>
                <svg viewBox={`-20 -20 ${vbW + 20} ${vbH + 20}`} style={{ width: "100%", maxHeight: 110 }} aria-label="Positie-preview">
                  <polygon
                    points={outline.map(p => `${p.x},${p.y}`).join(" ")}
                    fill="white" stroke="#475569"
                    strokeWidth={Math.max(blad.lengte, blad.breedte) * 0.005}
                  />
                  <circle
                    cx={x} cy={blad.breedte - y} r={d / 2}
                    fill="none" stroke="#6B4FB8"
                    strokeWidth={Math.max(blad.lengte, blad.breedte) * 0.005}
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {stap >= 2 && (
          <div style={{ padding: "12px 16px", borderTop: "0.5px solid rgba(0,0,0,0.08)", display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setStap(s => (s > 1 ? (s - 1) as 1 | 2 | 3 : s))}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, border: "0.5px solid #cbd5e1", borderRadius: 6, background: "white", cursor: "pointer", color: "#475569" }}
            >
              ← Terug
            </button>
            {stap === 2 ? (
              <button
                onClick={() => setStap(3)}
                disabled={!diameter || Number(diameter) <= 0}
                style={{ flex: 2, padding: "8px 0", fontSize: 12, fontWeight: 500, border: "none", borderRadius: 6, background: "#0d9488", color: "white", cursor: "pointer", opacity: (!diameter || Number(diameter) <= 0) ? 0.4 : 1 }}
              >
                Volgende →
              </button>
            ) : (
              <button
                onClick={handleToepassen}
                disabled={!posX || !posY}
                style={{ flex: 2, padding: "8px 0", fontSize: 12, fontWeight: 500, border: "none", borderRadius: 6, background: "#0d9488", color: "white", cursor: "pointer", opacity: (!posX || !posY) ? 0.4 : 1 }}
              >
                Toevoegen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
