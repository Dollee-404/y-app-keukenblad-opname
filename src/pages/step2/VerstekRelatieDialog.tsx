import { useState } from "react";
import type { Blad, Opname, VerstekRelatie } from "../../data/seed-types";
import MiniCanvasBlad from "../../drawing/miniCanvasBlad";
import { bladZijden } from "../../drawing/bladZijdenHelpers";
import { zijdeIsGekoppeld, gekoppeldeZijde } from "../../state/verstekHelpers";
import { oppervlakteM2 } from "../../state/helpers";

const HOEK_OPTIES: number[] = [22.5, 30, 45, 60];

interface Props {
  huidigBlad: Blad;
  state: Opname;
  onOpslaan: (relatie: VerstekRelatie) => void;
  onSluiten: () => void;
}

export default function VerstekRelatieDialog({ huidigBlad, state, onOpslaan, onSluiten }: Props) {
  const [stap, setStap] = useState<1 | 2 | 3>(1);
  const [gekozenZijdeA, setGekozenZijdeA] = useState<string | null>(null);
  const [gekozenBladB, setGekozenBladB] = useState<Blad | null>(null);
  const [gekozenZijdeB, setGekozenZijdeB] = useState<string | null>(null);
  const [gekozenHoek, setGekozenHoek] = useState<number>(45);
  const [notitie, setNotitie] = useState("");

  const zijdenA = bladZijden(huidigBlad);
  const andreBladenList = state.bladen.filter(b => b.id !== huidigBlad.id);

  const geblokkeerdeZijdenA = zijdenA
    .filter(z => zijdeIsGekoppeld(state, huidigBlad.id, z.id))
    .map(z => z.id);

  const zijdenB = gekozenBladB ? bladZijden(gekozenBladB) : [];
  const geblokkeerdeZijdenB = gekozenBladB
    ? zijdenB.filter(z => zijdeIsGekoppeld(state, gekozenBladB.id, z.id)).map(z => z.id)
    : [];

  function volgendeStap() {
    if (stap === 1 && gekozenZijdeA) setStap(2);
    else if (stap === 2 && gekozenBladB) setStap(3);
  }

  function vorigeStap() {
    if (stap === 2) { setStap(1); setGekozenBladB(null); }
    if (stap === 3) { setStap(2); setGekozenZijdeB(null); }
  }

  function handleOpslaan() {
    if (!gekozenZijdeA || !gekozenBladB || !gekozenZijdeB) return;
    onOpslaan({
      id: crypto.randomUUID(),
      bladA_id: huidigBlad.id,
      zijdeA_id: gekozenZijdeA,
      bladB_id: gekozenBladB.id,
      zijdeB_id: gekozenZijdeB,
      hoek_graden: gekozenHoek,
      notitie: notitie.trim() || undefined,
    });
    onSluiten();
  }

  const geldigeKeuze =
    (stap === 1 && gekozenZijdeA !== null) ||
    (stap === 2 && gekozenBladB !== null) ||
    (stap === 3 && gekozenZijdeB !== null);

  const zijdeLabelA = gekozenZijdeA
    ? (zijdenA.find(z => z.id === gekozenZijdeA)?.label ?? gekozenZijdeA)
    : null;

  const zijdeLabelB = gekozenZijdeB
    ? (zijdenB.find(z => z.id === gekozenZijdeB)?.label ?? gekozenZijdeB)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onSluiten}
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.3)" }}
      />

      {/* Dialog */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 51,
        background: "white",
        borderRadius: 14,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        width: 540,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 48px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>
              Verstek-relatie toevoegen
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Stap {stap} van 3 — {huidigBlad.label}
            </div>
          </div>
          <button
            onClick={onSluiten}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ── Stap 1: Zijde-selectie eigen blad ── */}
          {stap === 1 && (
            <div>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                Tik op de zijde van <strong>{huidigBlad.label}</strong> die verstek-gesneden wordt.
              </p>

              <div style={{ background: "#f8fafc", borderRadius: 8, padding: 8, marginBottom: 12 }}>
                <MiniCanvasBlad
                  blad={huidigBlad}
                  state={state}
                  width={496}
                  height={220}
                  onZijdeKlik={zijdeId => setGekozenZijdeA(zijdeId)}
                  geselecteerdeZijdeId={gekozenZijdeA ?? undefined}
                  geblokkeerdeZijden={geblokkeerdeZijdenA}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {zijdenA.map(z => {
                  const geblokkeerd = geblokkeerdeZijdenA.includes(z.id);
                  const gekoppeld = geblokkeerd ? gekoppeldeZijde(state, huidigBlad.id, z.id) : null;
                  return (
                    <button
                      key={z.id}
                      onClick={() => !geblokkeerd && setGekozenZijdeA(z.id)}
                      disabled={geblokkeerd}
                      title={gekoppeld ? `Gekoppeld aan ${gekoppeld.bladNaam} ${gekoppeld.zijdeId}` : undefined}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 16,
                        border: "1px solid",
                        borderColor: geblokkeerd ? "#e2e8f0" : gekozenZijdeA === z.id ? "#0d9488" : "#cbd5e1",
                        background: gekozenZijdeA === z.id ? "#0d9488" : geblokkeerd ? "#f8fafc" : "white",
                        color: gekozenZijdeA === z.id ? "white" : geblokkeerd ? "#94a3b8" : "#374151",
                        fontSize: 12,
                        cursor: geblokkeerd ? "not-allowed" : "pointer",
                        minHeight: 32,
                      }}
                    >
                      {z.label}
                      {gekoppeld && <span style={{ marginLeft: 4, opacity: 0.7 }}>↔</span>}
                    </button>
                  );
                })}
              </div>

              {gekozenZijdeA && (
                <p style={{ fontSize: 12, color: "#0d9488", fontWeight: 500 }}>
                  ✓ Geselecteerd: {zijdeLabelA}
                </p>
              )}
            </div>
          )}

          {/* ── Stap 2: Blad-selectie ── */}
          {stap === 2 && (
            <div>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                Koppelen aan welk blad? Zijde <strong>{zijdeLabelA}</strong> van {huidigBlad.label} wordt verstek aan:
              </p>

              {andreBladenList.length === 0 ? (
                <div style={{
                  background: "#fef3c7", border: "1px solid #fcd34d",
                  borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#92400e",
                }}>
                  Er zijn geen andere bladen om mee te koppelen. Voeg eerst een ander blad toe in stap 2.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {andreBladenList.map(blad => {
                    const geselecteerd = gekozenBladB?.id === blad.id;
                    return (
                      <button
                        key={blad.id}
                        onClick={() => setGekozenBladB(blad)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "2px solid",
                          borderColor: geselecteerd ? "#0d9488" : "#e2e8f0",
                          background: geselecteerd ? "#f0fdf4" : "white",
                          cursor: "pointer",
                          textAlign: "left",
                          minHeight: 72,
                        }}
                      >
                        <div style={{ flexShrink: 0 }}>
                          <MiniCanvasBlad blad={blad} state={state} width={100} height={56} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{blad.label}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {blad.lengte} × {blad.breedte} mm · {oppervlakteM2(blad).toFixed(2)} m²
                          </div>
                        </div>
                        {geselecteerd && (
                          <div style={{ marginLeft: "auto", color: "#0d9488", fontSize: 16, fontWeight: 700 }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Stap 3: Zijde-selectie ander blad + hoek + notitie ── */}
          {stap === 3 && gekozenBladB && (
            <div>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                Welke zijde van <strong>{gekozenBladB.label}</strong> sluit verstek aan op {zijdeLabelA} van {huidigBlad.label}?
              </p>

              <div style={{ background: "#f8fafc", borderRadius: 8, padding: 8, marginBottom: 12 }}>
                <MiniCanvasBlad
                  blad={gekozenBladB}
                  state={state}
                  width={496}
                  height={220}
                  onZijdeKlik={zijdeId => setGekozenZijdeB(zijdeId)}
                  geselecteerdeZijdeId={gekozenZijdeB ?? undefined}
                  geblokkeerdeZijden={geblokkeerdeZijdenB}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {zijdenB.map(z => {
                  const geblokkeerd = geblokkeerdeZijdenB.includes(z.id);
                  const gekoppeld = geblokkeerd ? gekoppeldeZijde(state, gekozenBladB.id, z.id) : null;
                  return (
                    <button
                      key={z.id}
                      onClick={() => !geblokkeerd && setGekozenZijdeB(z.id)}
                      disabled={geblokkeerd}
                      title={gekoppeld ? `Gekoppeld aan ${gekoppeld.bladNaam}` : undefined}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 16,
                        border: "1px solid",
                        borderColor: geblokkeerd ? "#e2e8f0" : gekozenZijdeB === z.id ? "#0d9488" : "#cbd5e1",
                        background: gekozenZijdeB === z.id ? "#0d9488" : geblokkeerd ? "#f8fafc" : "white",
                        color: gekozenZijdeB === z.id ? "white" : geblokkeerd ? "#94a3b8" : "#374151",
                        fontSize: 12,
                        cursor: geblokkeerd ? "not-allowed" : "pointer",
                        minHeight: 32,
                      }}
                    >
                      {z.label}
                      {gekoppeld && <span style={{ marginLeft: 4, opacity: 0.7 }}>↔</span>}
                    </button>
                  );
                })}
              </div>

              {gekozenZijdeB && (
                <p style={{ fontSize: 12, color: "#0d9488", fontWeight: 500, marginBottom: 16 }}>
                  ✓ Geselecteerd: {zijdeLabelB}
                </p>
              )}

              {/* Hoek-dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>
                  Verstekhoek
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {HOEK_OPTIES.map(h => (
                    <button
                      key={h}
                      onClick={() => setGekozenHoek(h)}
                      style={{
                        flex: 1,
                        padding: "7px 4px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor: gekozenHoek === h ? "#0d9488" : "#e2e8f0",
                        background: gekozenHoek === h ? "#0d9488" : "white",
                        color: gekozenHoek === h ? "white" : "#374151",
                        fontSize: 12,
                        fontWeight: gekozenHoek === h ? 600 : 400,
                        cursor: "pointer",
                        minHeight: 36,
                      }}
                    >
                      {h}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Notitie */}
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 500 }}>
                  Notitie (optioneel)
                </label>
                <textarea
                  value={notitie}
                  onChange={e => setNotitie(e.target.value)}
                  placeholder="Bijv. bovenzijde verlijmen na plaatsing"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    color: "#374151",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          gap: 8,
        }}>
          <div>
            {stap > 1 && (
              <button
                onClick={vorigeStap}
                style={{
                  padding: "8px 16px", borderRadius: 7,
                  border: "1px solid #e2e8f0", background: "white",
                  color: "#475569", fontSize: 13, cursor: "pointer", minHeight: 40,
                }}
              >
                ← Vorige
              </button>
            )}
          </div>
          <button
            onClick={stap === 3 ? handleOpslaan : volgendeStap}
            disabled={!geldigeKeuze}
            style={{
              padding: "8px 20px", borderRadius: 7, border: "none",
              background: geldigeKeuze ? "#0d9488" : "#e2e8f0",
              color: geldigeKeuze ? "white" : "#94a3b8",
              fontSize: 13, fontWeight: 500, cursor: geldigeKeuze ? "pointer" : "not-allowed",
              minHeight: 40,
            }}
          >
            {stap === 3 ? "Toepassen" : "Volgende →"}
          </button>
        </div>
      </div>
    </>
  );
}
