import { useState } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Sparing, SparingTypeCode, Blad, Opname, KookplaatProduct, SpoelbakProduct } from "../../data/seed-types";
import { pasProductToe } from "../../drawing/sparingHelpers";
import { rechthoekOutline } from "../../drawing/bladHelpers";

const seed = seedRaw as unknown as SeedData;

type AnyProduct = KookplaatProduct | SpoelbakProduct;

interface Props {
  blad: Blad;
  state: Opname;
  onToevoegen: (sparing: Sparing) => void;
  onSluiten: () => void;
}

let teller = 0;
function nieuweId(): string { return `sp-${++teller}`; }

const TYPE_OPTIES: { code: SparingTypeCode; label: string; icoon: string }[] = [
  { code: "KOOKPLAAT", label: "Kookplaat", icoon: "🔥" },
  { code: "SPOELBAK", label: "Spoelbak", icoon: "💧" },
  { code: "KOOF", label: "Vrije rechthoek", icoon: "⬜" },
];

const INBOUWWIJZE_LABELS: Record<string, string> = {
  VLAKBOUW: "Vlakbouw",
  ONDERBOUW: "Onderbouw",
  OPBOUW: "Opbouw",
  NIS: "Nis",
  VERSTEK: "Verstek",
};

function isComposietMateriaal(materiaal: Opname["materiaal"]): boolean {
  return ["COMPOSIET", "KWARTSCOMPOSIET"].includes(materiaal?.soort ?? "");
}

export default function SparingDialog({ blad, state, onToevoegen, onSluiten }: Props) {
  const [stap, setStap] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<SparingTypeCode | null>(null);
  const [gekozenProduct, setGekozenProduct] = useState<AnyProduct | null>(null);
  const [zoekterm, setZoekterm] = useState("");
  const [toonWarning, setToonWarning] = useState(false);
  const [handmatig, setHandmatig] = useState(false);

  // Stap 3 — plaatsing state
  const defaultX = Math.round(blad.lengte / 2);
  const defaultY = Math.round(blad.breedte / 2);
  const [posX, setPosX] = useState(String(defaultX));
  const [posY, setPosY] = useState(String(defaultY));
  const [handmBreedte, setHandmBreedte] = useState("500");
  const [handmHoogte, setHandmHoogte] = useState("400");
  const [handmRadius, setHandmRadius] = useState("0");

  function handleTypeKiezen(t: SparingTypeCode) {
    setType(t);
    if (t === "KOOF") {
      setHandmatig(true);
      setStap(3);
    } else {
      setHandmatig(false);
      setStap(2);
    }
  }

  function handleProductKiezen(product: AnyProduct) {
    const isVlakbouw = product.inbouwwijze === "VLAKBOUW";
    const isComp = isComposietMateriaal(state.materiaal);
    if (type === "KOOKPLAAT" && isVlakbouw && isComp) {
      setGekozenProduct(product);
      setToonWarning(true);
    } else {
      setGekozenProduct(product);
      setStap(3);
    }
  }

  function handleWarningDoorgaan() {
    setToonWarning(false);
    setStap(3);
  }

  function handleToepassen() {
    const x = Number(posX);
    const y = Number(posY);
    if (!x || !y) return;

    let basis: Sparing = {
      id: nieuweId(),
      type: type!,
      bladId: blad.id,
      inbouwwijze: "ONDERBOUW",
      positie: { x, y },
      breedte: Number(handmBreedte) || 500,
      hoogte: Number(handmHoogte) || 400,
      radiusMm: Number(handmRadius) || 0,
    };

    if (gekozenProduct) {
      basis.productMerk = gekozenProduct.merk;
      basis.productModel = gekozenProduct.model;
      basis = pasProductToe(basis, gekozenProduct);
    }

    onToevoegen(basis);
  }

  const producten: AnyProduct[] =
    type === "KOOKPLAAT" ? seed.producten_kookplaten :
    type === "SPOELBAK" ? seed.producten_spoelbakken : [];

  const gefilterd = producten.filter(p =>
    `${p.merk} ${p.model}`.toLowerCase().includes(zoekterm.toLowerCase())
  );

  // Mini preview SVG
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  const vbW = Math.max(...xs) + 40;
  const vbH = Math.max(...ys) + 40;
  const previewBreedte = gekozenProduct ? gekozenProduct.sparing_boven_mm[0] : Number(handmBreedte) || 200;
  const previewHoogte = gekozenProduct ? gekozenProduct.sparing_boven_mm[1] : Number(handmHoogte) || 160;
  const previewX = Number(posX) || defaultX;
  const previewY = Number(posY) || defaultY;

  const inputKlasse = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }}
        onClick={onSluiten}
      />
      <div
        style={{
          position: "relative",
          background: "white",
          borderRadius: 12,
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "0.5px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
            {stap === 1 && "Sparing toevoegen"}
            {stap === 2 && "Product kiezen"}
            {stap === 3 && "Positie instellen"}
          </span>
          <button
            onClick={onSluiten}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8" }}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          {/* Stap 1 — Type kiezen */}
          {stap === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {TYPE_OPTIES.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => handleTypeKiezen(opt.code)}
                  style={{
                    minHeight: 90,
                    padding: 12,
                    border: "0.5px solid #e2e8f0",
                    borderRadius: 8,
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 24,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0fdfa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}
                >
                  <span>{opt.icoon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Stap 2 — Product kiezen */}
          {stap === 2 && (
            <div>
              {toonWarning && gekozenProduct ? (
                <div style={{ background: "#fef9c3", border: "0.5px solid #d97706", borderRadius: 8, padding: 14, marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: "#92400e", marginBottom: 10 }}>
                    {seed.clausules.VLAKBOUW_WAARSCHUWING}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { setGekozenProduct(null); setToonWarning(false); }}
                      style={{ flex: 1, padding: "6px 0", fontSize: 11, border: "0.5px solid #d97706", borderRadius: 4, background: "white", cursor: "pointer", color: "#92400e" }}
                    >
                      Kies ander product
                    </button>
                    <button
                      onClick={handleWarningDoorgaan}
                      style={{ flex: 1, padding: "6px 0", fontSize: 11, border: "none", borderRadius: 4, background: "#0d9488", color: "white", cursor: "pointer", fontWeight: 500 }}
                    >
                      Toch toevoegen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    className={inputKlasse}
                    style={{ marginBottom: 10 }}
                    placeholder={`Zoek ${type === "KOOKPLAAT" ? "kookplaat" : "spoelbak"}...`}
                    value={zoekterm}
                    onChange={e => setZoekterm(e.target.value)}
                    autoFocus
                  />
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {gefilterd.map((p, i) => (
                      <li key={i}>
                        <button
                          onClick={() => handleProductKiezen(p)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "none",
                            borderBottom: "0.5px solid #f1f5f9",
                            background: "white",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseLeave={e => (e.currentTarget.style.background = "white")}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                              {p.merk} {p.model}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {p.sparing_boven_mm[0]}×{p.sparing_boven_mm[1]} mm
                              {p.opmerking?.includes("onbevestigd") && (
                                <span style={{ color: "#f59e0b", marginLeft: 4 }}>⚠ specs onbevestigd</span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, padding: "2px 6px", background: "#f1f5f9", borderRadius: 999, color: "#475569", whiteSpace: "nowrap" }}>
                            {INBOUWWIJZE_LABELS[p.inbouwwijze] ?? p.inbouwwijze}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => { setHandmatig(true); setStap(3); }}
                    style={{ width: "100%", padding: "10px 0", marginTop: 8, border: "0.5px dashed #94a3b8", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, color: "#64748b" }}
                  >
                    Niet in lijst — voer handmatig in
                  </button>
                </>
              )}
            </div>
          )}

          {/* Stap 3 — Plaatsing */}
          {stap === 3 && (
            <div>
              {gekozenProduct && (
                <div style={{ padding: "8px 12px", background: "#f0fdfa", borderRadius: 6, marginBottom: 14, fontSize: 12, color: "#0f172a" }}>
                  <strong>{gekozenProduct.merk} {gekozenProduct.model}</strong>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>
                    {gekozenProduct.sparing_boven_mm[0]}×{gekozenProduct.sparing_boven_mm[1]} mm
                  </span>
                </div>
              )}

              {/* Positie inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>X — vanaf linkerrand (mm)</label>
                  <input type="number" inputMode="numeric" className={inputKlasse} value={posX} onChange={e => setPosX(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Y — vanaf onderkant (mm)</label>
                  <input type="number" inputMode="numeric" className={inputKlasse} value={posY} onChange={e => setPosY(e.target.value)} />
                </div>
              </div>

              {/* Handmatige maten (alleen voor vrije rechthoek of "niet in lijst") */}
              {(handmatig || !gekozenProduct) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Breedte (mm)</label>
                    <input type="number" inputMode="numeric" className={inputKlasse} value={handmBreedte} onChange={e => setHandmBreedte(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Hoogte (mm)</label>
                    <input type="number" inputMode="numeric" className={inputKlasse} value={handmHoogte} onChange={e => setHandmHoogte(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Radius (mm)</label>
                    <input type="number" inputMode="numeric" className={inputKlasse} value={handmRadius} onChange={e => setHandmRadius(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Mini-preview */}
              <div style={{ borderRadius: 6, border: "0.5px solid #e2e8f0", background: "#f8fafc", padding: 8, marginBottom: 14 }}>
                <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Voorvertoon</p>
                <svg
                  viewBox={`-20 -20 ${vbW + 20} ${vbH + 20}`}
                  style={{ width: "100%", maxHeight: 120 }}
                  aria-label="Positie-preview"
                >
                  <polygon
                    points={outline.map(p => `${p.x},${p.y}`).join(" ")}
                    fill="white"
                    stroke="#475569"
                    strokeWidth={Math.max(blad.lengte, blad.breedte) * 0.005}
                  />
                  <rect
                    x={previewX - previewBreedte / 2}
                    y={previewY - previewHoogte / 2}
                    width={previewBreedte}
                    height={previewHoogte}
                    fill="#0d948820"
                    stroke="#0d9488"
                    strokeWidth={Math.max(blad.lengte, blad.breedte) * 0.005}
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {stap === 3 && !toonWarning && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setStap(handmatig && type !== "KOOF" ? 2 : type === "KOOF" ? 1 : 2)}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, border: "0.5px solid #cbd5e1", borderRadius: 6, background: "white", cursor: "pointer", color: "#475569" }}
            >
              ← Terug
            </button>
            <button
              onClick={handleToepassen}
              style={{ flex: 2, padding: "8px 0", fontSize: 12, fontWeight: 500, border: "none", borderRadius: 6, background: "#0d9488", color: "white", cursor: "pointer" }}
            >
              Toevoegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
