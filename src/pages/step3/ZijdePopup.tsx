import { useState } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Randafwerking, RandafwerkingType } from "../../data/seed-types";

const seed = seedRaw as unknown as SeedData;

const CATEGORIE_LABELS: Record<RandafwerkingType, string> = {
  GEEN: "Recht",
  FACET: "Facet",
  VERSTEK: "Verstek",
};

interface Props {
  zijdeId: string;
  zijdeLabel: string;
  huidig?: Randafwerking;
  onOpslaan: (ra: Randafwerking) => void;
  onVerwijder: () => void;
  onSluiten: () => void;
}

export default function ZijdePopup({ zijdeId, zijdeLabel, huidig, onOpslaan, onVerwijder, onSluiten }: Props) {
  const [categorie, setCategorie] = useState<RandafwerkingType>(huidig?.type ?? "GEEN");

  const opties = seed.randafwerking_codes.filter(r => r.type === categorie);

  function kiesCode(def: (typeof seed.randafwerking_codes)[0]) {
    onOpslaan({
      zijdeId,
      code: def.code,
      label: def.label,
      type: def.type as RandafwerkingType,
      hoogte_mm: def.hoogte_mm,
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onSluiten} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div style={{
        position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
        zIndex: 50, background: "white", borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: 20, width: 320,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>{zijdeLabel}</p>
          <button onClick={onSluiten} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        {/* Segmented control */}
        <div style={{ display: "flex", gap: 2, marginBottom: 12, background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
          {(["GEEN", "FACET", "VERSTEK"] as RandafwerkingType[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13,
                background: categorie === cat ? "white" : "transparent",
                fontWeight: categorie === cat ? 600 : 400,
                color: categorie === cat ? "#0d9488" : "#64748b",
                boxShadow: categorie === cat ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                minHeight: 36,
              }}
            >
              {CATEGORIE_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Sub-opties */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: huidig ? 12 : 0 }}>
          {opties.map(opt => (
            <button
              key={opt.code}
              onClick={() => kiesCode(opt)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13,
                background: huidig?.code === opt.code ? "#0d9488" : "#f1f5f9",
                color: huidig?.code === opt.code ? "white" : "#1e293b",
                fontWeight: huidig?.code === opt.code ? 600 : 400,
                minHeight: 36,
              }}
            >
              {opt.code}
            </button>
          ))}
        </div>

        {huidig && (
          <button
            onClick={onVerwijder}
            style={{ width: "100%", padding: "8px 0", borderRadius: 6, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 13, cursor: "pointer", minHeight: 40 }}
          >
            Verwijder afwerking
          </button>
        )}
      </div>
    </>
  );
}
