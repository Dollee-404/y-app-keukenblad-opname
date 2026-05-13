import { useState } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Randafwerking, RandafwerkingType } from "../../data/seed-types";

const seed = seedRaw as unknown as SeedData;

// UI-only tab type — KOPPELING is geen RandafwerkingType
type Tab = RandafwerkingType | "KOPPELING";

const TAB_LABELS: Record<Tab, string> = {
  GEEN: "Recht",
  FACET: "Facet",
  VERSTEK: "Verstek (hoogte)",
  KOPPELING: "Verstek (koppeling)",
};

const TABS: Tab[] = ["GEEN", "FACET", "VERSTEK", "KOPPELING"];

function initTab(huidig?: Randafwerking): Tab {
  if (!huidig) return "GEEN";
  if (huidig.code === "verstek" && huidig.verstek) return "KOPPELING";
  return huidig.type ?? "GEEN";
}

interface Props {
  zijdeId: string;
  zijdeLabel: string;
  huidig?: Randafwerking;
  onOpslaan: (ra: Randafwerking) => void;
  onVerwijder: () => void;
  onSluiten: () => void;
}

export default function ZijdePopup({ zijdeId, zijdeLabel, huidig, onOpslaan, onVerwijder, onSluiten }: Props) {
  const [tab, setTab] = useState<Tab>(initTab(huidig));

  const opties = tab !== "KOPPELING"
    ? seed.randafwerking_codes.filter(r => r.type === tab)
    : [];

  function kiesCode(def: (typeof seed.randafwerking_codes)[0]) {
    onOpslaan({
      zijdeId,
      code: def.code,
      label: def.label,
      type: def.type as RandafwerkingType,
      hoogte_mm: def.hoogte_mm,
      verstek: huidig?.verstek,
    });
  }

  function pasVerstekKoppelingToe() {
    if (huidig) {
      onOpslaan({ ...huidig, verstek: true });
    } else {
      onOpslaan({ zijdeId, code: "verstek", label: "Verstek", type: "VERSTEK", verstek: true });
    }
  }

  const dvConflict = tab === "KOPPELING" && huidig?.code.startsWith("DV");

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

        {/* Segmented control — 2×2 grid zodat labels leesbaar blijven */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
          background: "#f1f5f9", borderRadius: 8, padding: 3, marginBottom: 12,
        }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 4px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                background: tab === t ? "white" : "transparent",
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "#0d9488" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                minHeight: 40,
                whiteSpace: "nowrap",
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Sub-opties voor GEEN / FACET / VERSTEK (hoogte) */}
        {tab !== "KOPPELING" && (
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
        )}

        {/* Verstek (koppeling) tabblad */}
        {tab === "KOPPELING" && (
          <div style={{ marginBottom: 12 }}>
            {dvConflict && (
              <div style={{
                background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6,
                padding: "8px 10px", marginBottom: 10, fontSize: 12, color: "#92400e",
              }}>
                ⚠ Deze zijde heeft al code <strong>{huidig!.code}</strong> (verstek-hoogte). Een aparte verstek-koppeling is meestal overbodig — DV-codes zijn al verstek-werk.
              </div>
            )}
            <p style={{ fontSize: 12, color: "#475569", margin: "0 0 12px", lineHeight: 1.5 }}>
              Deze zijde wordt verstek-gesneden (45°) om met een andere blad-zijde verbonden te worden.
              Maak de koppeling aan via stap 2 → BladInfoPanel → "+ Verstek-relatie toevoegen".
            </p>
            <button
              onClick={pasVerstekKoppelingToe}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 6, border: "none",
                background: "#0d9488", color: "white", fontSize: 13, fontWeight: 500,
                cursor: "pointer", minHeight: 40,
              }}
            >
              Toepassen
            </button>
          </div>
        )}

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
