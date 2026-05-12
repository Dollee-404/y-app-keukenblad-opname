import seedRaw from "../../data/seed-data.json";
import type { SeedData, Blad, Opname } from "../../data/seed-types";
import { oppervlakteM2 } from "../../data/seed-types";
import { rechthoekOutline, segmentLengtes } from "../../drawing/bladHelpers";
import { randAfstand } from "../../drawing/boorgatHelpers";

const seed = seedRaw as unknown as SeedData;

const SPARING_LABELS: Record<string, string> = {
  KOOKPLAAT: "Kookplaat",
  SPOELBAK: "Spoelbak",
  KOOF: "Vrije rechthoek",
  BOORGAT: "Boorgat",
  KOLOM: "Kolom",
  HOEK: "Hoek",
};

interface Props {
  blad: Blad | null;
  state: Opname;
  onBoorgatToevoegen?: () => void;
}

function omtrekMm(blad: Blad): number {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  return Math.round(segmentLengtes(outline).reduce((s, l) => s + l, 0));
}

export default function BladInfoPanel({ blad, state, onBoorgatToevoegen }: Props) {
  const matSoort = blad?.materiaalOverride?.soort ?? state.materiaal?.soort ?? "—";
  const dikte = blad?.dikte ?? "—";
  const kleur = blad?.materiaalOverride?.kleur ?? state.materiaal?.kleur ?? "—";

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 2,
  };
  const valueStyle: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: "#0f172a" };
  const subStyle: React.CSSProperties = { fontSize: 11, color: "#64748b" };

  return (
    <div
      className="bg-white flex-shrink-0 flex flex-col h-full"
      style={{ width: 220, borderLeft: "0.5px solid rgba(0,0,0,0.08)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ padding: "12px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>Blad-info</span>
        <span style={{ fontSize: 14, color: "#94a3b8", cursor: "pointer" }} title="Paneel inklappen">›</span>
      </div>

      {!blad ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <p style={{ fontSize: 11, color: "#94a3b8" }}>Selecteer een blad om details te zien.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" style={{ padding: "12px 14px" }}>
          {/* Werkstuk */}
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Werkstuk</div>
            <div style={valueStyle}>{blad.werkstukType ?? "—"}</div>
          </div>

          {/* Materiaal */}
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Materiaal</div>
            <div style={valueStyle}>{matSoort} · {dikte} mm</div>
            <div style={subStyle}>{kleur}</div>
          </div>

          {/* Afmetingen */}
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Afmetingen</div>
            <div style={valueStyle}>{blad.lengte} × {blad.breedte} mm</div>
            <div style={subStyle}>
              {oppervlakteM2(blad).toFixed(2)} m² · omtrek {omtrekMm(blad)} mm
            </div>
          </div>

          {/* Randafwerking */}
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Randafwerking</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Stap 3</div>
          </div>
        </div>
      )}

      {/* Footer: Sparingen */}
      <div style={{ padding: "10px 14px", borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Sparingen</div>
        {!blad || !blad.sparingen?.length ? (
          <p style={{ fontSize: 11, color: "#94a3b8" }}>Geen sparingen</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {blad.sparingen.map(s => {
              const isComposiet = ["COMPOSIET", "KWARTSCOMPOSIET"].includes(
                blad.materiaalOverride?.soort ?? state.materiaal?.soort ?? ""
              );
              const toonRisicoIcon = isComposiet && s.type === "KOOKPLAAT" && s.inbouwwijze === "VLAKBOUW";
              return (
                <li key={s.id} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#0f172a" }}>
                    {SPARING_LABELS[s.type] ?? s.type}
                  </span>
                  {(s.productMerk || s.productModel) && (
                    <span style={{ fontSize: 10, color: "#64748b" }}>
                      {[s.productMerk, s.productModel].filter(Boolean).join(" ")}
                    </span>
                  )}
                  {toonRisicoIcon && (
                    <span
                      title="Vlakbouw in composiet — risico op scheuren"
                      style={{ fontSize: 11, color: "#d97706", marginLeft: 2, cursor: "default" }}
                    >
                      ⚠
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer: Boorgaten */}
      <div style={{ padding: "10px 14px", borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Boorgaten</div>
        {!blad || !blad.boorgaten?.length ? (
          <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Geen boorgaten</p>
        ) : (
          <ul style={{ margin: 0, padding: "0 0 6px", listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {blad.boorgaten.map(bg => {
              const doelLabel = seed.boorgat_doelen.find(d => d.code === bg.doel)?.label ?? bg.doel;
              const { risico } = randAfstand(bg.positie, bg.diameter, blad);
              return (
                <li key={bg.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#6B4FB8", flexShrink: 0, lineHeight: 1 }}>○</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", flex: 1 }}>
                    {doelLabel} · Ø{bg.diameter}
                  </span>
                  {risico && (
                    <span title="<60mm van bladrand — risico" style={{ fontSize: 11, color: "#d97706", flexShrink: 0 }}>⚠</span>
                  )}
                  {bg.groepId && (
                    <span style={{
                      fontSize: 9, padding: "1px 4px",
                      background: "#ede9fe", color: "#6B4FB8",
                      borderRadius: 3, flexShrink: 0,
                    }}>
                      groep
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {onBoorgatToevoegen && (
          <button
            onClick={onBoorgatToevoegen}
            disabled={!blad}
            style={{
              width: "100%", padding: "5px 0", fontSize: 11,
              border: "0.5px solid #6B4FB8", borderRadius: 5,
              background: blad ? "#f5f3ff" : "white",
              color: blad ? "#6B4FB8" : "#94a3b8",
              cursor: blad ? "pointer" : "not-allowed",
              opacity: blad ? 1 : 0.4,
            }}
          >
            + Boorgat toevoegen
          </button>
        )}
      </div>
    </div>
  );
}
