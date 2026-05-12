import { useState } from "react";
import type { MaatReferentie, Sparing, Boorgat } from "../data/seed-types";

type Hoek = "linksonder" | "linksboven" | "rechtsonder" | "rechtsboven";

const HOEK_NAAR_REF: Record<Hoek, MaatReferentie | null> = {
  linksonder: null,
  linksboven: { type: "LINKERRAND", offsetVanaf: "boven" },
  rechtsonder: { type: "RECHTERRAND", offsetVanaf: "onder" },
  rechtsboven: { type: "RECHTERRAND", offsetVanaf: "boven" },
};

const HOEK_LABELS: Record<Hoek, string> = {
  linksonder: "Linksonder",
  linksboven: "Linksboven",
  rechtsonder: "Rechtsonder",
  rechtsboven: "Rechtsboven",
};

function refNaarHoek(ref: MaatReferentie | null): Hoek | null {
  if (!ref || ref.type === "LINKSONDER") return "linksonder";
  if (ref.type === "LINKERRAND") return ref.offsetVanaf === "boven" ? "linksboven" : "linksonder";
  if (ref.type === "RECHTERRAND") return ref.offsetVanaf === "boven" ? "rechtsboven" : "rechtsonder";
  return null;
}

interface Props {
  referentie: MaatReferentie | null;
  onChange: (ref: MaatReferentie | null) => void;
  andereSparingen?: Sparing[];
  andereBoorgaten?: Boorgat[];
}

export default function AnchorPicker({ referentie, onChange, andereSparingen = [], andereBoorgaten = [] }: Props) {
  const actieveHoek = refNaarHoek(referentie);
  const [meerOpen, setMeerOpen] = useState(false);

  const isRelationeel =
    referentie?.type === "MIDDEN_BLAD" ||
    referentie?.type === "VORIGE_SPARING" ||
    referentie?.type === "VORIG_BOORGAT";

  function huidigLabel(): string {
    if (!referentie || referentie.type === "LINKSONDER") return "Linksonder";
    if (referentie.type === "MIDDEN_BLAD") return "Midden blad";
    if (referentie.type === "VORIGE_SPARING") {
      const s = andereSparingen.find(s => s.id === (referentie as { type: "VORIGE_SPARING"; sparingId: string }).sparingId);
      return `Sparing: ${s?.productModel ?? s?.type ?? "?"}`;
    }
    if (referentie.type === "VORIG_BOORGAT") {
      const bg = andereBoorgaten.find(b => b.id === (referentie as { type: "VORIG_BOORGAT"; boorgatId: string }).boorgatId);
      return `Boorgat Ø${bg?.diameter ?? "?"}`;
    }
    if (actieveHoek) return HOEK_LABELS[actieveHoek];
    return "—";
  }

  // SVG blad illustratie
  const bW = 68; const bH = 40;
  const margin = 8;
  const vbW = bW + margin * 2;
  const vbH = bH + margin * 2;
  const r = 5;
  const corners: { hoek: Hoek; cx: number; cy: number }[] = [
    { hoek: "linksboven",  cx: margin,        cy: margin },
    { hoek: "rechtsboven", cx: margin + bW,   cy: margin },
    { hoek: "linksonder",  cx: margin,        cy: margin + bH },
    { hoek: "rechtsonder", cx: margin + bW,   cy: margin + bH },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={{ width: 72, height: 44, flexShrink: 0 }}
          aria-label="Anker kiezen"
        >
          <rect
            x={margin} y={margin} width={bW} height={bH}
            fill="white" stroke="#cbd5e1" strokeWidth={1.2} rx={1}
          />
          {corners.map(({ hoek, cx, cy }) => {
            const actief = actieveHoek === hoek && !isRelationeel;
            return (
              <circle
                key={hoek}
                cx={cx} cy={cy} r={r}
                fill={actief ? "#0d9488" : "white"}
                stroke={actief ? "#0d9488" : "#94a3b8"}
                strokeWidth={1.5}
                style={{ cursor: "pointer" }}
                onClick={() => onChange(HOEK_NAAR_REF[hoek])}
              />
            );
          })}
        </svg>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", lineHeight: 1.3 }}>
            {huidigLabel()}
          </div>
          <button
            onClick={() => setMeerOpen(v => !v)}
            style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2, textDecoration: "underline" }}
          >
            Meer opties
          </button>
        </div>
      </div>

      {meerOpen && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "0.5px solid #e2e8f0" }}>
          <select
            value={
              !referentie ? "LINKSONDER" :
              referentie.type === "MIDDEN_BLAD" ? "MIDDEN_BLAD" :
              referentie.type === "VORIGE_SPARING" ? `VORIGE_SPARING_${referentie.sparingId}` :
              referentie.type === "VORIG_BOORGAT" ? `VORIG_BOORGAT_${referentie.boorgatId}` :
              ""
            }
            onChange={e => {
              const v = e.target.value;
              if (!v) { setMeerOpen(false); return; }
              if (v === "LINKSONDER") { onChange(null); setMeerOpen(false); return; }
              if (v === "MIDDEN_BLAD") { onChange({ type: "MIDDEN_BLAD" }); return; }
              if (v.startsWith("VORIGE_SPARING_")) { onChange({ type: "VORIGE_SPARING", sparingId: v.slice(15) }); return; }
              if (v.startsWith("VORIG_BOORGAT_")) { onChange({ type: "VORIG_BOORGAT", boorgatId: v.slice(14) }); return; }
            }}
            style={{
              width: "100%", padding: "5px 6px", border: "1px solid #e2e8f0",
              borderRadius: 5, fontSize: 11, background: "white", cursor: "pointer",
            }}
          >
            <option value="">— Hoek kiezen via illustratie —</option>
            <option value="LINKSONDER">Linksonder blad</option>
            <option value="MIDDEN_BLAD">Midden blad</option>
            {andereSparingen.map(s => (
              <option key={s.id} value={`VORIGE_SPARING_${s.id}`}>
                Sparing: {s.productModel ?? s.type}
              </option>
            ))}
            {andereBoorgaten.map(bg => (
              <option key={bg.id} value={`VORIG_BOORGAT_${bg.id}`}>
                Boorgat Ø{bg.diameter}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
