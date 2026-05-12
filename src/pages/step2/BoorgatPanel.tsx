import { useState, useEffect } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, Boorgat, Blad, MaatReferentie } from "../../data/seed-types";
import { randAfstand, absolutePositie, absoluteNaarReferentie } from "../../drawing/boorgatHelpers";

const seed = seedRaw as unknown as SeedData;

type Richting = "rechts" | "links" | "boven" | "onder";

interface Props {
  boorgat: Boorgat;
  blad: Blad;
  onBijwerken: (patch: Partial<Boorgat>) => void;
  onVerwijderen: () => void;
  onVolgendToevoegen: (richting: Richting, hartAfstand: number) => void;
  onSluiten: () => void;
}

const QUICK_DIAMETERS = [35, 50, 70, 90];

const RICHTING_LABELS: Record<Richting, string> = {
  rechts: "→",
  links: "←",
  boven: "↑",
  onder: "↓",
};

export default function BoorgatPanel({
  boorgat,
  blad,
  onBijwerken,
  onVerwijderen,
  onVolgendToevoegen,
  onSluiten,
}: Props) {
  const [x, setX] = useState(String(Math.round(boorgat.positie.x)));
  const [y, setY] = useState(String(Math.round(boorgat.positie.y)));
  const [diameter, setDiameter] = useState(String(boorgat.diameter));
  const [notitie, setNotitie] = useState(boorgat.notitie ?? "");
  const [toonGroepActie, setToonGroepActie] = useState(false);
  const [richting, setRichting] = useState<Richting>("rechts");
  const [hartAfstand, setHartAfstand] = useState("70");
  const [referentie, setReferentie] = useState<MaatReferentie | null>(boorgat.referentie ?? null);

  const ctx = { sparingen: blad.sparingen ?? [], boorgaten: blad.boorgaten ?? [] };

  useEffect(() => {
    const ref = boorgat.referentie ?? null;
    setReferentie(ref);
    const offset = ref
      ? absoluteNaarReferentie(boorgat.positie, ref, blad, ctx)
      : boorgat.positie;
    setX(String(Math.round(offset.x)));
    setY(String(Math.round(offset.y)));
    setDiameter(String(boorgat.diameter));
    setNotitie(boorgat.notitie ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boorgat.id, boorgat.positie.x, boorgat.positie.y, boorgat.diameter, boorgat.notitie, boorgat.referentie]);

  function handlePosOpslaan() {
    const nx = parseInt(x, 10);
    const ny = parseInt(y, 10);
    if (!isNaN(nx) && !isNaN(ny)) {
      const absPos = referentie
        ? absolutePositie({ x: nx, y: ny }, referentie, blad, ctx)
        : { x: nx, y: ny };
      onBijwerken({ positie: absPos, referentie: referentie ?? undefined });
    }
  }

  function handleReferentieWijzigen(nieuw: MaatReferentie | null) {
    setReferentie(nieuw);
    const offset = nieuw
      ? absoluteNaarReferentie(boorgat.positie, nieuw, blad, ctx)
      : boorgat.positie;
    setX(String(Math.round(offset.x)));
    setY(String(Math.round(offset.y)));
  }

  function handleDiameterOpslaan() {
    const d = parseInt(diameter, 10);
    if (!isNaN(d) && d > 0) onBijwerken({ diameter: d });
  }

  function handleVolgend() {
    const ha = parseInt(hartAfstand, 10);
    if (!isNaN(ha) && ha > 0) {
      onVolgendToevoegen(richting, ha);
      setToonGroepActie(false);
    }
  }

  const doelLabel = seed.boorgat_doelen.find(d => d.code === boorgat.doel)?.label ?? boorgat.doel;
  const liveX = parseInt(x, 10) || boorgat.positie.x;
  const liveY = parseInt(y, 10) || boorgat.positie.y;
  const liveDiameter = parseInt(diameter, 10) || boorgat.diameter;
  const randCheck = randAfstand({ x: liveX, y: liveY }, liveDiameter, blad);

  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 10,
        boxShadow: "0 4px 24px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.08)",
        padding: "14px 16px",
        minWidth: 300,
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          Boorgat — {doelLabel}
        </span>
        <button
          onClick={onSluiten}
          aria-label="Sluiten"
          style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: "2px 4px" }}
        >
          ×
        </button>
      </div>

      {/* Positie */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            X (mm)
          </label>
          <input
            type="number" inputMode="numeric" value={x}
            onChange={e => setX(e.target.value)}
            onBlur={handlePosOpslaan}
            onKeyDown={e => e.key === "Enter" && handlePosOpslaan()}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            Y (mm)
          </label>
          <input
            type="number" inputMode="numeric" value={y}
            onChange={e => setY(e.target.value)}
            onBlur={handlePosOpslaan}
            onKeyDown={e => e.key === "Enter" && handlePosOpslaan()}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Diameter */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
          Diameter (mm)
        </label>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          {QUICK_DIAMETERS.map(d => (
            <button
              key={d}
              onClick={() => { setDiameter(String(d)); onBijwerken({ diameter: d }); }}
              style={{
                flex: 1, padding: "4px 0", fontSize: 11, border: "0.5px solid",
                borderColor: boorgat.diameter === d ? "#0d9488" : "#e2e8f0",
                borderRadius: 5,
                background: boorgat.diameter === d ? "#f0fdfa" : "white",
                color: boorgat.diameter === d ? "#0d9488" : "#475569",
                cursor: "pointer", fontWeight: boorgat.diameter === d ? 600 : 400,
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          type="number" inputMode="numeric" value={diameter}
          onChange={e => setDiameter(e.target.value)}
          onBlur={handleDiameterOpslaan}
          onKeyDown={e => e.key === "Enter" && handleDiameterOpslaan()}
          style={inputStyle}
          placeholder="Anders..."
        />
      </div>

      {/* Doorboring toggle */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
          Doorboring
        </label>
        <div style={{ display: "flex", border: "0.5px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
          {([true, false] as const).map(val => (
            <button
              key={String(val)}
              onClick={() => onBijwerken({ doorboring: val })}
              style={{
                flex: 1, padding: "6px 0", fontSize: 12, border: "none",
                background: boorgat.doorboring === val ? "#0d9488" : "white",
                color: boorgat.doorboring === val ? "white" : "#475569",
                cursor: "pointer", fontWeight: boorgat.doorboring === val ? 600 : 400,
              }}
            >
              {val ? "Doorgaand" : "Blind"}
            </button>
          ))}
        </div>
      </div>

      {/* Rand-afstand warning */}
      {randCheck.risico && (
        <div style={{ background: "#fffbeb", borderLeft: "3px solid #b45309", borderRadius: "0 6px 6px 0", padding: "8px 10px", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
            <p style={{ fontSize: 11, color: "#78350f", margin: 0 }}>
              {randCheck.minAfstand}mm van bladrand — risico op breuk.
            </p>
          </div>
        </div>
      )}

      {/* Sub-actie: volgend boorgat */}
      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => setToonGroepActie(v => !v)}
          style={{
            width: "100%", padding: "7px", fontSize: 12, fontWeight: 500,
            border: "0.5px solid #6B4FB8", borderRadius: 6,
            background: toonGroepActie ? "#ede9fe" : "white",
            color: "#6B4FB8", cursor: "pointer",
          }}
        >
          + Volgend boorgat hiernaast
        </button>

        {toonGroepActie && (
          <div style={{ marginTop: 8, padding: 10, background: "#f8f7ff", borderRadius: 6, border: "0.5px solid #ddd6fe" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 8, justifyContent: "center" }}>
              {(["boven", "links", "rechts", "onder"] as Richting[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRichting(r)}
                  style={{
                    width: 36, height: 36, fontSize: 16, border: "0.5px solid",
                    borderColor: richting === r ? "#6B4FB8" : "#e2e8f0",
                    borderRadius: 6,
                    background: richting === r ? "#ede9fe" : "white",
                    color: richting === r ? "#6B4FB8" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {RICHTING_LABELS[r]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
                  H.o.h. afstand (mm)
                </label>
                <input
                  type="number" inputMode="numeric" value={hartAfstand}
                  onChange={e => setHartAfstand(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={handleVolgend}
                style={{
                  padding: "7px 14px", fontSize: 12, fontWeight: 500,
                  border: "none", borderRadius: 6,
                  background: "#6B4FB8", color: "white", cursor: "pointer",
                }}
              >
                Toevoegen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notitie */}
      <div style={{ marginBottom: 10 }}>
        <textarea
          value={notitie}
          onChange={e => setNotitie(e.target.value.slice(0, 200))}
          onBlur={() => onBijwerken({ notitie: notitie || undefined })}
          rows={2}
          placeholder="Notitie (optioneel)"
          style={{
            width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0",
            borderRadius: 6, fontSize: 12, resize: "none", outline: "none",
            fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Verwijder */}
      <button
        onClick={onVerwijderen}
        style={{
          width: "100%", padding: "7px",
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: 6, color: "#dc2626", fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}
      >
        Boorgat verwijderen
      </button>
    </div>
  );
}
