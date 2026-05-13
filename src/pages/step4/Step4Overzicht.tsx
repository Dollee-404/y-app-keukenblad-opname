import type { Opname } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
  onNavigeer: (stap: number, bladId?: string, subSection?: string) => void;
}

export default function Step4Overzicht({ state, onNavigeer }: Props) {
  return (
    <div style={{ maxWidth: 1024, margin: "0 auto", padding: "32px 16px", textAlign: "center" }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
        Stap 4 — Overzicht
      </h2>
      <p style={{ color: "#64748b", fontSize: 14 }}>
        Pagina wordt gebouwd in de volgende taak.{" "}
        {state.bladen.length} blad{state.bladen.length !== 1 ? "en" : ""} gevonden.
      </p>
      <button
        onClick={() => onNavigeer(3)}
        style={{ marginTop: 16, padding: "8px 16px", background: "#0d9488", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
      >
        ← Terug naar stap 3
      </button>
    </div>
  );
}
