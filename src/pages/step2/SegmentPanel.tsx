import { useState, useEffect } from "react";

interface Props {
  segmentIndex: number;
  huidigeLengte: number;
  onOpslaan: (nieuweLengte: number) => void;
  onSluiten: () => void;
}

const ZIJDE_LABELS = ["Bovenzijde", "Rechterzijde", "Onderzijde", "Linkerzijde"];

export default function SegmentPanel({ segmentIndex, huidigeLengte, onOpslaan, onSluiten }: Props) {
  const [waarde, setWaarde] = useState(Math.round(huidigeLengte).toString());

  useEffect(() => {
    setWaarde(Math.round(huidigeLengte).toString());
  }, [huidigeLengte, segmentIndex]);

  function aanpassen(delta: number) {
    setWaarde(v => String(Math.max(1, (Number(v) || 0) + delta)));
  }

  function handleOpslaan() {
    const n = Number(waarde);
    if (n > 0) onOpslaan(n);
  }

  const label = ZIJDE_LABELS[segmentIndex] ?? `Zijde ${segmentIndex + 1}`;

  const btnBase: React.CSSProperties = {
    padding: "6px 8px",
    fontSize: 11,
    background: "#f1f5f9",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
    minWidth: 36,
  };

  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(0,0,0,0.12)",
        borderRadius: 8,
        padding: "12px 14px",
        minWidth: 340,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#475569" }}>
          {label} · maat
        </span>
        <button
          onClick={onSluiten}
          aria-label="Sluiten"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#94a3b8",
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Input-rij */}
      <div className="flex items-center" style={{ gap: 6 }}>
        <button style={btnBase} onClick={() => aanpassen(-100)}>−100</button>
        <button style={btnBase} onClick={() => aanpassen(-10)}>−10</button>
        <input
          type="number"
          inputMode="numeric"
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
            border: "0.5px solid #cbd5e1",
            borderRadius: 4,
            outline: "none",
            minWidth: 0,
          }}
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <span style={{ fontSize: 12, color: "#64748b" }}>mm</span>
        <button style={btnBase} onClick={() => aanpassen(10)}>+10</button>
        <button style={btnBase} onClick={() => aanpassen(100)}>+100</button>
      </div>

      {/* Actie-rij */}
      <div className="flex" style={{ gap: 6, marginTop: 8 }}>
        <button
          onClick={onSluiten}
          style={{
            flex: 1,
            padding: "6px 0",
            fontSize: 11,
            background: "white",
            border: "0.5px solid #cbd5e1",
            borderRadius: 4,
            cursor: "pointer",
            color: "#475569",
          }}
        >
          Annuleer
        </button>
        <button
          onClick={handleOpslaan}
          style={{
            flex: 2,
            padding: "6px 0",
            fontSize: 11,
            fontWeight: 500,
            background: "#0d9488",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Toepassen
        </button>
      </div>
    </div>
  );
}
