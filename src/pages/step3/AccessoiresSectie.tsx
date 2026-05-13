import { useRef, useState } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Opname, AccessoireRegel } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";

const seed = seedRaw as unknown as SeedData;

interface Props { state: Opname; dispatch: React.Dispatch<OpnameAction>; }

function generateId() {
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function Stepper({
  aantal,
  onChange,
}: {
  aantal: number;
  onChange: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(String(aantal));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 1) onChange(n);
    setEditing(false);
  }

  const btnStyle: React.CSSProperties = {
    width: 32, height: 32, border: "1px solid #cbd5e1", borderRadius: 6,
    background: "#f8fafc", cursor: "pointer", fontSize: 16, fontWeight: 600,
    color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button style={btnStyle} onClick={() => aantal > 1 && onChange(aantal - 1)}>−</button>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
          style={{ width: 40, textAlign: "center", border: "1px solid #0d9488", borderRadius: 6, fontSize: 14, padding: "2px 0" }}
        />
      ) : (
        <button
          onClick={startEdit}
          style={{ width: 40, height: 32, border: "1px solid #e2e8f0", borderRadius: 6, background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#0f172a" }}
        >
          {aantal}
        </button>
      )}
      <button style={btnStyle} onClick={() => onChange(aantal + 1)}>+</button>
    </div>
  );
}

export default function AccessoiresSectie({ state, dispatch }: Props) {
  const [catalogusOpen, setCatalogusOpen] = useState(false);
  const [handmatigOpen, setHandmatigOpen] = useState(false);
  const [handmatigNaam, setHandmatigNaam] = useState("");
  const [handmatigAantal, setHandmatigAantal] = useState(1);
  const [handmatigKleur, setHandmatigKleur] = useState("");

  const projectKleur = state.materiaalKeuze?.kleur_code ?? null;
  const accessoires = state.accessoires ?? [];

  function voegCatalogusItemToe(sku: string) {
    const item = seed.accessoires_catalogus.find(a => a.sku === sku);
    if (!item) return;
    dispatch({
      type: "ACCESSOIRE_TOEVOEGEN",
      regel: { id: generateId(), sku: item.sku, naam: item.naam, aantal: item.default_aantal },
    });
    setCatalogusOpen(false);
  }

  function voegHandmatigToe() {
    if (!handmatigNaam.trim()) return;
    dispatch({
      type: "ACCESSOIRE_TOEVOEGEN",
      regel: {
        id: generateId(),
        naam: handmatigNaam.trim(),
        aantal: handmatigAantal,
        kleur_code: handmatigKleur || undefined,
      },
    });
    setHandmatigNaam("");
    setHandmatigAantal(1);
    setHandmatigKleur("");
    setHandmatigOpen(false);
  }

  function updateAantal(id: string, aantal: number) {
    dispatch({ type: "ACCESSOIRE_BIJWERKEN", id, patch: { aantal } });
  }

  function verwijder(id: string) {
    dispatch({ type: "ACCESSOIRE_VERWIJDEREN", id });
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Accessoires</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Extra onderdelen zoals profielen, eindkappen en lijm.
      </p>

      {/* Lijst van toegevoegde accessoires */}
      {accessoires.length === 0 ? (
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
          Geen accessoires toegevoegd. Voeg toe via de knoppen hieronder.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {accessoires.map((a: AccessoireRegel) => (
            <div
              key={a.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", background: "white",
                border: "1px solid #e2e8f0", borderRadius: 8,
              }}
            >
              {/* Naam + kleur-badge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{a.naam}</span>
                {a.kleur_code && (
                  <span style={{
                    marginLeft: 8, fontSize: 11, padding: "1px 7px",
                    borderRadius: 99, background: "#f1f5f9", color: "#475569",
                    fontWeight: 500, whiteSpace: "nowrap",
                  }}>
                    {a.kleur_code}
                  </span>
                )}
              </div>

              {/* Stepper */}
              <Stepper aantal={a.aantal} onChange={n => updateAantal(a.id, n)} />

              {/* Verwijder */}
              <button
                onClick={() => verwijder(a.id)}
                style={{
                  width: 32, height: 32, border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 16, color: "#94a3b8",
                  borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                }}
                title="Verwijder"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Handmatig mini-form */}
      {handmatigOpen && (
        <div style={{
          marginBottom: 16, padding: "14px 16px", background: "#f8fafc",
          border: "1px solid #e2e8f0", borderRadius: 8,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 4 }}>
                Naam <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={handmatigNaam}
                onChange={e => setHandmatigNaam(e.target.value)}
                placeholder="Bijv. Speciaal anker bovenkant"
                style={{
                  width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1",
                  borderRadius: 6, fontSize: 14, boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: "0 0 auto" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 4 }}>
                  Aantal
                </label>
                <input
                  type="number"
                  min={1}
                  value={handmatigAantal}
                  onChange={e => setHandmatigAantal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    width: 72, padding: "8px 10px", border: "1px solid #cbd5e1",
                    borderRadius: 6, fontSize: 14,
                  }}
                />
              </div>
              {projectKleur && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 4 }}>
                    Kleur (optioneel)
                  </label>
                  <select
                    value={handmatigKleur}
                    onChange={e => setHandmatigKleur(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1",
                      borderRadius: 6, fontSize: 14, minHeight: 38,
                    }}
                  >
                    <option value="">— geen kleur —</option>
                    <option value={projectKleur}>{projectKleur}</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={voegHandmatigToe}
                disabled={!handmatigNaam.trim()}
                style={{
                  padding: "8px 18px", borderRadius: 6, border: "none",
                  background: handmatigNaam.trim() ? "#0d9488" : "#e2e8f0",
                  color: handmatigNaam.trim() ? "white" : "#94a3b8",
                  fontSize: 13, cursor: handmatigNaam.trim() ? "pointer" : "default",
                  fontWeight: 500, minHeight: 36,
                }}
              >
                Toevoegen
              </button>
              <button
                onClick={() => { setHandmatigOpen(false); setHandmatigNaam(""); setHandmatigAantal(1); }}
                style={{
                  padding: "8px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
                  background: "white", color: "#64748b", fontSize: 13, cursor: "pointer", minHeight: 36,
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actie-knoppen */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative" }}>
        {/* Catalogus dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setCatalogusOpen(o => !o); setHandmatigOpen(false); }}
            style={{
              padding: "9px 16px", borderRadius: 8, border: "1px solid #0d9488",
              background: catalogusOpen ? "#0d9488" : "white",
              color: catalogusOpen ? "white" : "#0d9488",
              fontSize: 13, cursor: "pointer", fontWeight: 500, minHeight: 44,
            }}
          >
            + Uit catalogus
          </button>
          {catalogusOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
                onClick={() => setCatalogusOpen(false)}
              />
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
                background: "white", border: "1px solid #e2e8f0", borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 240, overflow: "hidden",
              }}>
                {seed.accessoires_catalogus.map(item => (
                  <button
                    key={item.sku}
                    onClick={() => voegCatalogusItemToe(item.sku)}
                    style={{
                      display: "block", width: "100%", padding: "11px 16px",
                      textAlign: "left", border: "none", borderBottom: "1px solid #f1f5f9",
                      background: "transparent", cursor: "pointer", fontSize: 14,
                      color: "#0f172a", minHeight: 44,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.naam}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => { setHandmatigOpen(o => !o); setCatalogusOpen(false); }}
          style={{
            padding: "9px 16px", borderRadius: 8, border: "1px solid #cbd5e1",
            background: "white", color: "#475569",
            fontSize: 13, cursor: "pointer", fontWeight: 500, minHeight: 44,
          }}
        >
          + Handmatig...
        </button>
      </div>
    </div>
  );
}
