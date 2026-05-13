import { oppervlakteM2 } from "../../data/seed-types";
import type { Opname } from "../../data/seed-types";
import { bladZijden } from "../../drawing/bladZijdenHelpers";
import { titleCase } from "../../drawing/titleCase";

interface Props { state: Opname; }

const HDR: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#94a3b8",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const ROW: React.CSSProperties = {
  fontSize: 12,
  color: "#0f172a",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const SUB: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
};

const EMPTY: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  fontStyle: "italic",
};

function Divider() {
  return <div style={{ height: 20 }} />;
}

export default function SamenvattingPanel({ state }: Props) {
  const { materiaalKeuze, bladen, accessoires } = state;

  // ── MATERIAAL ──────────────────────────────────────────────
  function renderMateriaal() {
    if (!materiaalKeuze) {
      return <p style={EMPTY}>Nog niet gekozen</p>;
    }
    const { soort, dikte_mm, kleur_label, leverancier } = materiaalKeuze;
    const merkLijn = leverancier
      ? `${leverancier} · ${titleCase(kleur_label)}`
      : titleCase(kleur_label);
    return (
      <div style={ROW}>
        <div style={{ fontWeight: 500 }}>{merkLijn}</div>
        <div style={SUB}>{soort} · {dikte_mm}mm</div>
      </div>
    );
  }

  // ── BLADEN ─────────────────────────────────────────────────
  function renderBladen() {
    if (bladen.length === 0) {
      return <p style={EMPTY}>Geen bladen — voeg toe in stap 2</p>;
    }
    const totaalM2 = bladen.reduce((s, b) => s + oppervlakteM2(b), 0);
    return (
      <>
        <p style={{ ...HDR, marginBottom: 10 }}>
          BLADEN &nbsp;
          <span style={{ fontWeight: 400, color: "#64748b" }}>
            {bladen.length} — {totaalM2.toFixed(2)} m²
          </span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bladen.map(blad => {
            const zijden = bladZijden(blad);
            const totalZ = zijden.length;
            const ingesteldZ = (blad.randafwerkingen ?? []).length;
            const raCompleet = ingesteldZ === totalZ;

            const override = blad.materiaalKeuze;
            const materiaalLabel = override
              ? `${override.soort} · ${override.dikte_mm}mm · ${titleCase(override.kleur_label)}`
              : "default";

            return (
              <div key={blad.id}>
                <div style={{ ...ROW, fontWeight: 500 }}>{blad.label}</div>
                <div style={SUB}>{materiaalLabel}</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  {raCompleet ? (
                    <span style={{ color: "#0d9488" }}>✓ {ingesteldZ}/{totalZ} zijden</span>
                  ) : (
                    <span style={{ color: "#d97706" }}>⚠ {ingesteldZ}/{totalZ} zijden</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // ── ACCESSOIRES ────────────────────────────────────────────
  function renderAccessoires() {
    const items = accessoires ?? [];
    const totaalStuks = items.reduce((s, a) => s + a.aantal, 0);
    if (items.length === 0) {
      return <p style={EMPTY}>Geen accessoires</p>;
    }
    return (
      <>
        <p style={{ ...HDR, marginBottom: 8 }}>
          ACCESSOIRES &nbsp;
          <span style={{ fontWeight: 400, color: "#64748b" }}>({totaalStuks} stuks)</span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map(a => (
            <div key={a.id} style={ROW}>
              <span style={{ color: "#64748b" }}>{a.aantal}×</span> {a.naam}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      borderLeft: "1px solid rgba(0,0,0,0.08)",
      padding: "20px 14px",
      background: "#fafafa",
      overflowY: "auto",
    }}>
      {/* MATERIAAL */}
      <p style={HDR}>MATERIAAL</p>
      {renderMateriaal()}

      <Divider />

      {/* BLADEN — header rendered inside renderBladen when bladen > 0 */}
      {bladen.length === 0 ? (
        <>
          <p style={HDR}>BLADEN</p>
          {renderBladen()}
        </>
      ) : (
        renderBladen()
      )}

      <Divider />

      {/* ACCESSOIRES — header rendered inside renderAccessoires when items > 0 */}
      {(accessoires ?? []).length === 0 ? (
        <>
          <p style={HDR}>ACCESSOIRES</p>
          {renderAccessoires()}
        </>
      ) : (
        renderAccessoires()
      )}
    </aside>
  );
}
