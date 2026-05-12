import { useState, useEffect } from "react";
import type { Sparing } from "../../data/seed-types";

interface Props {
  sparing: Sparing;
  onBijwerken: (patch: Partial<Sparing>) => void;
  onVerwijderen: () => void;
  onSluiten: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  KOOKPLAAT: "Kookplaat",
  SPOELBAK: "Spoelbak",
  KOOF: "Vrije rechthoek",
  BOORGAT: "Boorgat",
  KOLOM: "Kolom",
  HOEK: "Hoek",
};

export default function SparingPanel({ sparing, onBijwerken, onVerwijderen, onSluiten }: Props) {
  const [x, setX] = useState(String(Math.round(sparing.positie.x)));
  const [y, setY] = useState(String(Math.round(sparing.positie.y)));

  useEffect(() => {
    setX(String(Math.round(sparing.positie.x)));
    setY(String(Math.round(sparing.positie.y)));
  }, [sparing.id, sparing.positie.x, sparing.positie.y]);

  function handlePosOpslaan() {
    const nx = parseInt(x, 10);
    const ny = parseInt(y, 10);
    if (!isNaN(nx) && !isNaN(ny)) {
      onBijwerken({ positie: { x: nx, y: ny } });
    }
  }

  const typeLabel = TYPE_LABELS[sparing.type] ?? sparing.type;
  const product = [sparing.productMerk, sparing.productModel].filter(Boolean).join(" ");

  return (
    <div
      style={{
        background: "white",
        borderRadius: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.08)",
        padding: "14px 16px",
        minWidth: 310,
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{typeLabel}</span>
          {product && (
            <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{product}</span>
          )}
        </div>
        <button
          onClick={onSluiten}
          aria-label="Sluiten"
          style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "2px 4px" }}
        >
          ×
        </button>
      </div>

      {/* Positie-invoer */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            X (mm)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={x}
            onChange={e => setX(e.target.value)}
            onBlur={handlePosOpslaan}
            onKeyDown={e => e.key === "Enter" && handlePosOpslaan()}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            Y (mm)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={y}
            onChange={e => setY(e.target.value)}
            onBlur={handlePosOpslaan}
            onKeyDown={e => e.key === "Enter" && handlePosOpslaan()}
            style={{
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Maten</div>
          <div style={{ fontSize: 11, color: "#475569", padding: "7px 0", whiteSpace: "nowrap" }}>
            {sparing.breedte} × {sparing.hoogte} mm
          </div>
        </div>
      </div>

      {/* Verwijder-knop */}
      <button
        onClick={onVerwijderen}
        style={{
          width: "100%",
          padding: "7px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 6,
          color: "#dc2626",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Sparing verwijderen
      </button>
    </div>
  );
}
