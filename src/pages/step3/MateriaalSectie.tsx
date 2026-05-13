import { useState, useMemo } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Opname, MateriaalCode, MateriaalKeuze } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";

const seed = seedRaw as unknown as SeedData;

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
}

// 16×16 or 24×24 white square swatch (no hex in seed-data)
function KleurSwatch({ size = 16, geselecteerd = false }: { size?: number; geselecteerd?: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      flexShrink: 0,
      background: "white",
      border: `0.5px solid ${geselecteerd ? "#0d9488" : "#cbd5e1"}`,
      borderRadius: 2,
    }} />
  );
}

interface MateriaalFormProps {
  keuze: MateriaalKeuze;
  onChange: (k: MateriaalKeuze) => void;
  compact?: boolean;
}

function MateriaalForm({ keuze, onChange, compact = false }: MateriaalFormProps) {
  const [zoek, setZoek] = useState("");

  // Colors are material-specific in seed-data — filtering by soort is automatic.
  // Each material has its own kleuren list, so just reading seed.materialen[soort].kleuren
  // already gives only the colors valid for that material.
  const alleKleuren: string[] = seed.materialen[keuze.soort as MateriaalCode]?.kleuren ?? [];

  const gefilterd = useMemo((): string[] => {
    if (!zoek.trim()) return alleKleuren.slice(0, 30);
    const q = zoek.toLowerCase();
    const matches = alleKleuren.filter(k => k.toLowerCase().includes(q));
    return matches.slice(0, 30);
  }, [alleKleuren, zoek]);

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    minHeight: 44,
    boxSizing: "border-box" as const,
    background: "white",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: compact ? 10 : 16 }}>
      {/* Materiaalsoort */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
          Materiaalsoort
        </label>
        <select
          value={keuze.soort}
          onChange={e => {
            const soort = e.target.value as MateriaalCode;
            // Reset kleur when soort changes — kleuren are per-material
            onChange({ ...keuze, soort, kleur_code: "", kleur_label: "" });
            setZoek("");
          }}
          style={inputStyle}
        >
          {Object.entries(seed.materialen).map(([code, def]) => (
            <option key={code} value={code}>{def.label}</option>
          ))}
        </select>
      </div>

      {/* Dikte */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
          Dikte
        </label>
        <select
          value={keuze.dikte_mm}
          onChange={e => onChange({ ...keuze, dikte_mm: Number(e.target.value) })}
          style={inputStyle}
        >
          {seed.diktes_mm.map(d => (
            <option key={d} value={d}>{d} mm</option>
          ))}
        </select>
      </div>

      {/* Kleur */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: "#475569", display: "block", marginBottom: 4 }}>
          Kleur <span style={{ color: "#94a3b8", fontWeight: 400 }}>({alleKleuren.length} beschikbaar)</span>
        </label>

        {/* Geselecteerde kleur — preview */}
        {keuze.kleur_code && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px", background: "#f0fdfb", borderRadius: 6, border: "1px solid #ccfbf1" }}>
            <KleurSwatch size={24} geselecteerd />
            <span style={{ fontSize: 13, color: "#0d9488", fontWeight: 500 }}>✓ {keuze.kleur_label}</span>
            <button
              onClick={() => onChange({ ...keuze, kleur_code: "", kleur_label: "" })}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 2px" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Zoek input */}
        <input
          type="text"
          placeholder={keuze.kleur_code ? "Andere kleur zoeken..." : "Begin met typen om te zoeken..."}
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          style={{ ...inputStyle, marginBottom: 4 }}
        />

        {/* Resultatenlijst — max 30 in DOM */}
        <div style={{
          maxHeight: compact ? 140 : 200,
          overflowY: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
          background: "white",
        }}>
          {gefilterd.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
              Geen resultaten
            </div>
          ) : (
            gefilterd.map(kleur => {
              const isGeselecteerd = keuze.kleur_code === kleur;
              return (
                <button
                  key={kleur}
                  onClick={() => {
                    onChange({ ...keuze, kleur_code: kleur, kleur_label: kleur });
                    setZoek("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left" as const,
                    padding: "7px 10px",
                    border: "none",
                    borderBottom: "1px solid #f8fafc",
                    background: isGeselecteerd ? "#f0fdfb" : "transparent",
                    color: isGeselecteerd ? "#0d9488" : "#1e293b",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: isGeselecteerd ? 500 : 400,
                  }}
                >
                  <KleurSwatch geselecteerd={isGeselecteerd} />
                  {kleur}
                </button>
              );
            })
          )}
        </div>

        {!zoek && alleKleuren.length > 30 && (
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            Eerste 30 van {alleKleuren.length} — typ om te filteren
          </p>
        )}
        {zoek && gefilterd.length === 30 && (
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            30 van meer resultaten — verfijn uw zoekopdracht
          </p>
        )}
      </div>
    </div>
  );
}

export default function MateriaalSectie({ state, dispatch }: Props) {
  // Derive project-level MateriaalKeuze from state
  const projectKeuze: MateriaalKeuze = state.materiaalKeuze ?? {
    soort: state.materiaal.soort,
    dikte_mm: 20,
    kleur_code: state.materiaal.kleur ?? "",
    kleur_label: state.materiaal.kleur ?? "",
    leverancier: state.materiaal.producent,
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Materiaal & kleur</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
        Standaardmateriaal voor alle bladen. Afwijkende bladen stel je hieronder per stuk in.
      </p>

      {/* Project-niveau */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 16 }}>
          PROJECT-NIVEAU
        </p>
        <MateriaalForm
          keuze={projectKeuze}
          onChange={k => dispatch({ type: "MATERIAAL_INSTELLEN", keuze: k })}
        />
      </div>

      {/* Per-blad overrides */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: 4 }}>
          PER-BLAD OVERRIDE <span style={{ fontWeight: 400, textTransform: "none" as const, letterSpacing: 0 }}>(optioneel)</span>
        </p>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
          Alle bladen volgen standaard het project-materiaal. Vink een blad aan om af te wijken.
        </p>

        {state.bladen.length === 0 ? (
          <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>
            Geen bladen — voeg eerst bladen toe in stap 2.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {state.bladen.map(blad => {
              const heeftOverride = !!blad.materiaalKeuze;
              return (
                <div key={blad.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  {/* Toggle header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: heeftOverride ? "#f0fdfb" : "#f8fafc",
                      cursor: "pointer",
                    }}
                    onClick={() => dispatch({
                      type: "BLAD_MATERIAAL_OVERRIDE",
                      bladId: blad.id,
                      keuze: heeftOverride ? null : { ...projectKeuze },
                    })}
                  >
                    <input
                      type="checkbox"
                      checked={heeftOverride}
                      onChange={() => {}} // handled by parent onClick
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0d9488" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", flex: 1 }}>
                      {blad.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {heeftOverride
                        ? `${seed.materialen[blad.materiaalKeuze!.soort]?.label ?? blad.materiaalKeuze!.soort} · ${blad.materiaalKeuze!.dikte_mm}mm · ${blad.materiaalKeuze!.kleur_label || "—"}`
                        : `${seed.materialen[projectKeuze.soort]?.label ?? projectKeuze.soort} (project)`
                      }
                    </span>
                  </div>

                  {/* Expanded mini-form */}
                  {heeftOverride && (
                    <div style={{ padding: 16, borderTop: "1px solid #e2e8f0", background: "white" }}>
                      <MateriaalForm
                        keuze={blad.materiaalKeuze!}
                        onChange={k => dispatch({ type: "BLAD_MATERIAAL_OVERRIDE", bladId: blad.id, keuze: k })}
                        compact
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
