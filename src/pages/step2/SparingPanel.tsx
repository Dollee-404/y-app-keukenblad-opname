import { useState, useEffect } from "react";
import type { Sparing, Blad, MaatReferentie } from "../../data/seed-types";
import { absolutePositie, absoluteNaarReferentie } from "../../drawing/boorgatHelpers";

interface Props {
  sparing: Sparing;
  blad: Blad;
  onBijwerken: (patch: Partial<Sparing>) => void;
  onVerwijderen: () => void;
  onKraangatToevoegen?: () => void;
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

const inputStyle = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function SparingPanel({
  sparing,
  blad,
  onBijwerken,
  onVerwijderen,
  onKraangatToevoegen,
  onSluiten,
}: Props) {
  const [x, setX] = useState(String(Math.round(sparing.positie.x)));
  const [y, setY] = useState(String(Math.round(sparing.positie.y)));
  const [notitie, setNotitie] = useState(sparing.notitie ?? "");
  const [referentie, setReferentie] = useState<MaatReferentie | null>(sparing.referentie ?? null);

  const ctx = { sparingen: (blad.sparingen ?? []).filter(s => s.id !== sparing.id), boorgaten: blad.boorgaten ?? [] };

  useEffect(() => {
    const ref = sparing.referentie ?? null;
    setReferentie(ref);
    const offset = ref
      ? absoluteNaarReferentie(sparing.positie, ref, blad, ctx)
      : sparing.positie;
    setX(String(Math.round(offset.x)));
    setY(String(Math.round(offset.y)));
    setNotitie(sparing.notitie ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparing.id, sparing.positie.x, sparing.positie.y, sparing.notitie, sparing.referentie]);

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
      ? absoluteNaarReferentie(sparing.positie, nieuw, blad, ctx)
      : sparing.positie;
    setX(String(Math.round(offset.x)));
    setY(String(Math.round(offset.y)));
  }

  function referentieNaarWaarde(ref: MaatReferentie | null): string {
    if (!ref) return "LINKSONDER";
    switch (ref.type) {
      case "LINKSONDER": return "LINKSONDER";
      case "LINKERRAND": return `LINKERRAND_${ref.offsetVanaf}`;
      case "RECHTERRAND": return `RECHTERRAND_${ref.offsetVanaf}`;
      case "MIDDEN_BLAD": return "MIDDEN_BLAD";
      case "VORIGE_SPARING": return `VORIGE_SPARING_${ref.sparingId}`;
      case "VORIG_BOORGAT": return `VORIG_BOORGAT_${ref.boorgatId}`;
    }
  }

  function waardeNaarReferentie(val: string): MaatReferentie | null {
    if (val === "LINKSONDER") return null;
    if (val === "LINKERRAND_onder") return { type: "LINKERRAND", offsetVanaf: "onder" };
    if (val === "LINKERRAND_boven") return { type: "LINKERRAND", offsetVanaf: "boven" };
    if (val === "RECHTERRAND_onder") return { type: "RECHTERRAND", offsetVanaf: "onder" };
    if (val === "RECHTERRAND_boven") return { type: "RECHTERRAND", offsetVanaf: "boven" };
    if (val === "MIDDEN_BLAD") return { type: "MIDDEN_BLAD" };
    if (val.startsWith("VORIGE_SPARING_")) return { type: "VORIGE_SPARING", sparingId: val.slice("VORIGE_SPARING_".length) };
    if (val.startsWith("VORIG_BOORGAT_")) return { type: "VORIG_BOORGAT", boorgatId: val.slice("VORIG_BOORGAT_".length) };
    return null;
  }

  function xLabel(): string {
    if (!referentie) return "X (mm)";
    switch (referentie.type) {
      case "RECHTERRAND": return "Afstand rechterrand (mm)";
      case "LINKERRAND": return "Afstand linkerrand (mm)";
      case "MIDDEN_BLAD": return "X t.o.v. midden (mm)";
      case "VORIGE_SPARING": return "X t.o.v. sparing (mm)";
      case "VORIG_BOORGAT": return "X t.o.v. boorgat (mm)";
      default: return "X (mm)";
    }
  }

  function yLabel(): string {
    if (!referentie) return "Y (mm)";
    switch (referentie.type) {
      case "LINKERRAND":
      case "RECHTERRAND":
        return referentie.offsetVanaf === "boven" ? "Hoogte vanaf boven (mm)" : "Hoogte vanaf onder (mm)";
      case "MIDDEN_BLAD": return "Y t.o.v. midden (mm)";
      case "VORIGE_SPARING": return "Y t.o.v. sparing (mm)";
      case "VORIG_BOORGAT": return "Y t.o.v. boorgat (mm)";
      default: return "Y (mm)";
    }
  }

  const typeLabel = TYPE_LABELS[sparing.type] ?? sparing.type;
  const product = [sparing.productMerk, sparing.productModel].filter(Boolean).join(" ");
  const andereSparingen = (blad.sparingen ?? []).filter(s => s.id !== sparing.id);

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

      {/* Maat-referentie */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
          Gemeten vanaf
        </label>
        <select
          value={referentieNaarWaarde(referentie)}
          onChange={e => handleReferentieWijzigen(waardeNaarReferentie(e.target.value))}
          style={{ ...inputStyle, background: "white", cursor: "pointer" }}
        >
          <option value="LINKSONDER">Linksonder blad</option>
          <option value="LINKERRAND_onder">Linkerrand (vanaf onder)</option>
          <option value="LINKERRAND_boven">Linkerrand (vanaf boven)</option>
          <option value="RECHTERRAND_onder">Rechterrand (vanaf onder)</option>
          <option value="RECHTERRAND_boven">Rechterrand (vanaf boven)</option>
          <option value="MIDDEN_BLAD">Midden blad</option>
          {andereSparingen.map(s => (
            <option key={s.id} value={`VORIGE_SPARING_${s.id}`}>
              Vorige sparing: {s.productModel ?? s.type}
            </option>
          ))}
          {(blad.boorgaten ?? []).map(bg => (
            <option key={bg.id} value={`VORIG_BOORGAT_${bg.id}`}>
              Vorig boorgat: Ø{bg.diameter}
            </option>
          ))}
        </select>
      </div>

      {/* Positie-invoer */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            {xLabel()}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={x}
            onChange={e => setX(e.target.value)}
            onBlur={handlePosOpslaan}
            onKeyDown={e => e.key === "Enter" && handlePosOpslaan()}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>
            {yLabel()}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={y}
            onChange={e => setY(e.target.value)}
            onBlur={handlePosOpslaan}
            onKeyDown={e => e.key === "Enter" && handlePosOpslaan()}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Maten</div>
          <div style={{ fontSize: 11, color: "#475569", padding: "7px 0", whiteSpace: "nowrap" }}>
            {sparing.breedte} × {sparing.hoogte} mm
          </div>
        </div>
      </div>

      {/* Kraangat sub-actie (alleen bij spoelbak) */}
      {sparing.type === "SPOELBAK" && onKraangatToevoegen && (
        <button
          onClick={onKraangatToevoegen}
          style={{
            width: "100%", padding: "7px", fontSize: 12, fontWeight: 500,
            border: "0.5px solid #6B4FB8", borderRadius: 6,
            background: "white", color: "#6B4FB8", cursor: "pointer",
            marginBottom: 10,
          }}
        >
          + Kraangat toevoegen
        </button>
      )}

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
