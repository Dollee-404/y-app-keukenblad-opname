import type { Opname } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";
import { totaalM2, totaalAccessoires, globaleWaarschuwingen } from "../../state/helpers";
import BladKaart from "./BladKaart";

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
  onNavigeer: (stap: number, bladId?: string, subSection?: string) => void;
}

export default function Step4Overzicht({ state, onNavigeer }: Props) {
  const klantnaam =
    state.opdrachtgever?.naam || state.afleveradres?.naam || null;

  const datumFormatted = state.datum
    ? new Date(state.datum).toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const warnings = globaleWaarschuwingen(state);
  const visibleWarnings = warnings.slice(0, 2);
  const extraWarnings = warnings.length - visibleWarnings.length;

  return (
    <div style={{ maxWidth: 1024, margin: "0 auto", padding: "24px 16px" }}>
      {/* Amber banner als geen klant */}
      {!klantnaam && (
        <div style={{
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#92400e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>Geen klant gekozen</span>
          <button
            onClick={() => onNavigeer(1)}
            style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            Ga naar stap 1 →
          </button>
        </div>
      )}

      {/* Zone 1 — Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", margin: 0 }}>
            {klantnaam || "Nog geen klant"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Inmeting {datumFormatted || "—"}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
          {state.verkoper?.naam && <div>Verkoper: {state.verkoper.naam}</div>}
          {state.inmeting?.inmeter && <div>Inmeter: {state.inmeting.inmeter}</div>}
        </div>
      </header>

      {/* Zone 2 — Key metrics */}
      <div style={{
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 0",
        marginBottom: 24,
        display: "flex",
        alignItems: "baseline",
        gap: 32,
      }}>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{state.bladen.length}</span>
          <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>bladen</span>
        </div>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{totaalM2(state).toFixed(2)}</span>
          <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>m²</span>
        </div>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{totaalAccessoires(state)}</span>
          <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>accessoires</span>
        </div>

        {/* Globale warnings rechts */}
        {warnings.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {visibleWarnings.map((tekst, i) => (
              <span
                key={i}
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fcd34d",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {tekst}
              </span>
            ))}
            {extraWarnings > 0 && (
              <span style={{ fontSize: 12, color: "#92400e" }}>
                {extraWarnings} meer waarschuwing{extraWarnings !== 1 ? "en" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Zone 3 — Bladen-grid */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {state.bladen.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Nog geen bladen — voeg toe in stap 2</p>
          ) : (
            state.bladen.map((blad) => (
              <BladKaart
                key={blad.id}
                blad={blad}
                state={state}
                onBewerken={() => onNavigeer(2, blad.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* Zone 4 — Accessoires */}
      <section style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
            Accessoires{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>({totaalAccessoires(state)} stuks)</span>
          </span>
          <button
            onClick={() => onNavigeer(3, undefined, 'accessoires')}
            style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            Bewerken ↗
          </button>
        </div>
        {(state.accessoires ?? []).length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Geen accessoires toegevoegd</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
            {(state.accessoires ?? []).map((a) => (
              <div key={a.id} style={{ fontSize: 13, color: "#334155" }}>
                {a.aantal}× {a.naam}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Zone 5 — Acties */}
      <footer style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={() => console.log("print preview")}
          style={{
            padding: "9px 18px",
            fontSize: 14,
            border: "1px solid #cbd5e1",
            borderRadius: 7,
            background: "white",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          Print preview
        </button>
        <button
          onClick={() => console.log("concept opslaan")}
          style={{
            padding: "9px 18px",
            fontSize: 14,
            border: "none",
            borderRadius: 7,
            background: "#0d9488",
            color: "white",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Concept opslaan
        </button>
      </footer>
    </div>
  );
}
