import type { Opname } from "../data/seed-types";

const STAPPEN = [
  { nr: 1, label: "Klant" },
  { nr: 2, label: "Tekening" },
  { nr: 3, label: "Specs" },
  { nr: 4, label: "Overzicht" },
];

interface Props {
  state: Opname;
  huidigStap: number;
  online?: boolean;
  onStap: (nr: number) => void;
  onNaarStap1?: () => void;
  onVolgende?: () => void;
  onNieuweOpname?: () => void;
}

export default function TopBar({ state, huidigStap, online = true, onStap, onNaarStap1, onVolgende, onNieuweOpname }: Props) {
  const klantNaam =
    state.afleveradres?.naam ||
    state.opdrachtgever?.naam ||
    null;
  const geenKlant = !klantNaam;
  const opdrachtgever = state.opdrachtgever?.naam || "";
  const datum = state.datum
    ? new Date(state.datum).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <header
      className="no-print bg-white border-b flex items-center justify-between flex-shrink-0"
      style={{ height: 50, padding: "0 16px", borderColor: "rgba(0,0,0,0.08)" }}
    >
      {/* Links: klant-blok + separator + step-pills */}
      <div className="flex items-center" style={{ gap: 16 }}>
        {geenKlant ? (
          <button
            onClick={onNaarStap1}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: onNaarStap1 ? "pointer" : "default",
              lineHeight: 1.2,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>
              Nog geen klant gekozen
            </div>
            {onNaarStap1 && (
              <div style={{ fontSize: 11, color: "#0d9488" }}>→ Ga naar stap 1</div>
            )}
          </button>
        ) : (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{klantNaam}</div>
            {(opdrachtgever || datum) && (
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {[opdrachtgever, datum].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        )}

        <div style={{ width: "0.5px", height: 24, background: "rgba(0,0,0,0.12)" }} />

        {/* Step pills */}
        <div className="flex items-center" style={{ gap: 4 }}>
          {STAPPEN.map((stap) => {
            const actief = stap.nr === huidigStap;
            const gedaan = stap.nr < huidigStap;
            return (
              <button
                key={stap.nr}
                onClick={() => onStap(stap.nr)}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: actief ? 600 : 400,
                  background: actief ? "#0d9488" : "#f1f5f9",
                  color: actief ? "#fff" : gedaan ? "#475569" : "#94a3b8",
                  transition: "all 0.15s",
                }}
              >
                {gedaan ? `${stap.nr} ${stap.label} ✓` : `${stap.nr} ${stap.label}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rechts: netwerk-indicator + Nieuwe opname + Volgende */}
      <div className="flex items-center" style={{ gap: 8 }}>
        {!online && (
          <span style={{ fontSize: 11, color: "#92400e", background: "#fef3c7", borderRadius: 999, padding: "2px 8px" }}>
            Offline
          </span>
        )}
        {onNieuweOpname && (
          <button
            onClick={onNieuweOpname}
            style={{
              fontSize: 11,
              padding: "4px 10px",
              border: "0.5px solid #94a3b8",
              borderRadius: 6,
              background: "white",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            + Nieuw
          </button>
        )}
        {huidigStap < 4 && (
          <button
            onClick={onVolgende}
            style={{
              fontSize: 12,
              padding: "5px 12px",
              border: "0.5px solid #94a3b8",
              borderRadius: 6,
              background: "white",
              color: "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Volgende ›
          </button>
        )}
      </div>
    </header>
  );
}
