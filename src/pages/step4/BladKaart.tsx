import type { Blad, Opname } from "../../data/seed-types";
import MiniCanvasBlad from "../../drawing/miniCanvasBlad";
import { oppervlakteM2, effectiefMateriaalSoort } from "../../state/helpers";
import { bladZijden } from "../../drawing/bladZijdenHelpers";

interface BladKaartProps {
  blad: Blad;
  state: Opname;
  onBewerken: () => void;
}

export default function BladKaart({ blad, state, onBewerken }: BladKaartProps) {
  const heeftOverride = !!(blad.materiaalKeuze || blad.materiaalOverride);
  const keuze = blad.materiaalKeuze ?? state.materiaalKeuze;
  const soort = effectiefMateriaalSoort(blad, state);
  const dikte = keuze?.dikte_mm ?? state.materiaalKeuze?.dikte_mm ?? blad.dikte;
  const kleurLabel = keuze?.kleur_label ?? "—";

  const zijden = bladZijden(blad);
  const ingesteld = (blad.randafwerkingen ?? []).length;
  const compleet = ingesteld >= zijden.length;
  const aantalSparingen = (blad.sparingen ?? []).length;
  const aantalBoorgaten = (blad.boorgaten ?? []).length;

  return (
    <div className="blad-kaart-wrapper" style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      {/* Card-header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 14px 8px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{blad.label}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {blad.lengte} × {blad.breedte} mm · {oppervlakteM2(blad).toFixed(2)} m²
          </div>
        </div>
        <button
          onClick={onBewerken}
          style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 8 }}
        >
          Bewerken ↗
        </button>
      </div>

      {/* Mini-canvas */}
      <div style={{ padding: "0 14px 8px" }}>
        <MiniCanvasBlad blad={blad} state={state} width={292} height={110} />
      </div>

      {/* Materiaal-regel */}
      <div style={{ padding: "0 14px 6px", fontSize: 12, color: heeftOverride ? "#185FA5" : "#475569" }}>
        {soort} · {dikte}mm · {kleurLabel}
        {heeftOverride && <span style={{ marginLeft: 6, fontStyle: "italic" }}>(override)</span>}
      </div>

      {/* Status-regel */}
      <div style={{
        padding: "6px 14px 12px",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: compleet ? "#16a34a" : "#d97706",
        borderTop: "1px solid #f1f5f9",
      }}>
        <span>{compleet ? "✓" : "⚠"}</span>
        <span>
          {ingesteld}/{zijden.length} zijden · {aantalSparingen} sparing{aantalSparingen !== 1 ? "en" : ""} · {aantalBoorgaten} boorgat{aantalBoorgaten !== 1 ? "en" : ""}
        </span>
      </div>
    </div>
  );
}
