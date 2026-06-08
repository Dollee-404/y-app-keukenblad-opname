import { useState, useRef } from "react";
import type { Opname } from "../../data/seed-types";
import type { OpnameAction } from "../../state/opnameReducer";
import { totaalM2, totaalAccessoires, globaleWaarschuwingen } from "../../state/helpers";
import { markeerVerzonden } from "../../storage/conceptOpslag";
import { opnameNaarQuotation } from "../../erpnext/quotationMapper";
import { laadGeldigeItemCodes, valideerOpname } from "../../erpnext/itemCodeValidation";
import { zorgDatKlantBestaat } from "../../erpnext/customerSearch";
import * as bridge from "../../erpnextClient";
import BladKaart from "./BladKaart";

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
  onNavigeer: (stap: number, bladId?: string, subSection?: string) => void;
  online?: boolean;
}

export default function Step4Overzicht({ state, dispatch, onNavigeer, online = true }: Props) {
  // quotationName aanwezig bij mount = opname was al eerder verzonden (hervat concept)
  const quotationNameOpMount = useRef(state.quotationName);
  const [busy, setBusy] = useState<null | 'werkplaats' | 'zaagbrief' | 'erpnext'>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [succes, setSucces] = useState<{ naam: string; url: string } | null>(null);

  const geenBladen = state.bladen.length === 0;

  function maakFilenaam(type: string): string {
    const datum = new Date().toISOString().slice(0, 10);
    const nr = state.ordernummer ?? 'concept';
    return `${type}-${nr}-${datum}.pdf`;
  }

  async function handleDownloadWerkplaatstekening() {
    setBusy('werkplaats');
    setFout(null);
    try {
      const { genereerWerkplaatstekening } = await import('../../pdf/index');
      const { downloadBlob } = await import('../../utils/downloadBlob');
      const blob = genereerWerkplaatstekening(state);
      downloadBlob(blob, maakFilenaam('werkplaatstekening'));
    } catch (err) {
      console.error(err);
      setFout('Werkplaatstekening genereren mislukt: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadZaagbrief() {
    setBusy('zaagbrief');
    setFout(null);
    try {
      const { genereerZaagbrief } = await import('../../pdf/index');
      const { downloadBlob } = await import('../../utils/downloadBlob');
      const blob = genereerZaagbrief(state);
      downloadBlob(blob, maakFilenaam('zaagbrief'));
    } catch (err) {
      console.error(err);
      setFout('Zaagbrief genereren mislukt: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(null);
    }
  }

  async function handleVerzendNaarERPNext() {
    setBusy('erpnext');
    setFout(null);
    setSucces(null);
    try {
      // JIT cache-load als pre-load in App.tsx faalde (idempotent)
      await laadGeldigeItemCodes();
      // Valideert alle item_codes vóór mapping — gooit bij ongeldige combinatie
      valideerOpname(state);

      const payload = opnameNaarQuotation(state);

      // Zorg dat de klant bestaat in ERPNext (aanmaken als nieuw)
      const klantDocNaam = await zorgDatKlantBestaat(state.opdrachtgever);
      (payload as unknown as Record<string, unknown>).party_name = klantDocNaam;

      const erpUrl = bridge.getErpNextAppUrl();

      if (state.quotationName) {
        try {
          await bridge.updateDocument('Quotation', state.quotationName, payload as unknown as Record<string, unknown>);
          markeerVerzonden();
          setSucces({
            naam: state.quotationName,
            url: `${erpUrl}/app/quotation/${state.quotationName}`,
          });
        } catch (updateErr) {
          // Quotation verwijderd in ERPNext (bijv. tijdens opruimen) — maak nieuw aan
          if (updateErr instanceof Error && updateErr.message.includes('404')) {
            const result = await bridge.createDocument<{ name: string }>('Quotation', payload as unknown as Record<string, unknown>);
            markeerVerzonden();
            dispatch({ type: 'SET_QUOTATION_NAME', name: result.name });
            setSucces({
              naam: result.name,
              url: `${erpUrl}/app/quotation/${result.name}`,
            });
          } else {
            throw updateErr;
          }
        }
      } else {
        const result = await bridge.createDocument<{ name: string }>('Quotation', payload as unknown as Record<string, unknown>);
        markeerVerzonden();
        dispatch({ type: 'SET_QUOTATION_NAME', name: result.name });
        setSucces({
          naam: result.name,
          url: `${erpUrl}/app/quotation/${result.name}`,
        });
      }
    } catch (err) {
      console.error('[erpnext-verzenden]', err);
      setFout(opbouwFoutmelding(err));
    } finally {
      setBusy(null);
    }
  }

  function opbouwFoutmelding(err: unknown): string {
    if (!(err instanceof Error)) return 'Onbekende fout bij verzenden';
    const msg = err.message;
    if (msg.includes('Geen Y-App context'))
      return 'Niet verbonden met Y-App. Open de extensie via de Y-App browser-tab.';
    if (msg.includes('timeout'))
      return 'ERPNext reageert niet (timeout). Probeer het over een minuut opnieuw.';
    if (msg.includes('nog geen keukenblad-items geconfigureerd'))
      return msg;
    if (msg.includes('niet geconfigureerd in ERPNext'))
      return msg;
    if (msg.includes('Klant moet geselecteerd zijn'))
      return 'Selecteer eerst een klant in stap 1';
    if (msg.includes('Opname heeft geen bladen'))
      return 'Voeg eerst een blad toe in stap 2';
    if (msg.includes('LinkValidation') || msg.includes('does not exist'))
      return `Klant bestaat niet in ERPNext. Voeg de klant eerst toe als Customer in ERPNext, of controleer de spelling.`;
    if (msg.includes('exc_type'))
      return `ERPNext-fout: ${msg.replace(/.*exc_type.*?:\s*/, '').trim()}`;
    return `Verzenden mislukt: ${msg}`;
  }

  const klantnaam =
    state.opdrachtgever?.naam || state.afleveradres?.naam || null;

  const datumFormatted = state.datum
    ? new Date(state.datum).toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const warnings = globaleWaarschuwingen(state);
  const visibleWarnings = warnings.slice(0, 2);
  const extraWarnings = warnings.length - visibleWarnings.length;

  return (
    <div className="overzicht-page" style={{ maxWidth: 1024, margin: "0 auto", padding: "24px 16px" }}>
      {/* Stap 11.5 — Verzonden-banner als opname al eerder naar ERPNext is gestuurd */}
      {quotationNameOpMount.current && !succes && (
        <div style={{
          background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 8,
          padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1e40af",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>
            Deze opname is reeds verzonden als Quotation <strong>{quotationNameOpMount.current}</strong>.
            Klik op "Bijwerken in ERPNext" om wijzigingen door te sturen, of start een nieuwe opname via "+ Nieuw".
          </span>
        </div>
      )}
      {/* Amber banner als geen klant */}
      {!klantnaam && (
        <div style={{
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "#92400e",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>Geen klant gekozen</span>
          <button
            onClick={() => onNavigeer(1)}
            style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            Ga naar stap 1 →
          </button>
        </div>
      )}

      {/* Zone 1 — Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", margin: 0 }}>
            {klantnaam || "Nog geen klant"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Inmeting {datumFormatted || "—"}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>
          {state.verkoper?.naam && <div>Verkoper: {state.verkoper.naam}</div>}
          {state.inmeting?.inmeter && <div>Inmeter: {state.inmeting.inmeter}</div>}
        </div>
      </header>

      {/* Zone 2 — Key metrics */}
      <div style={{
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 0",
        marginBottom: 24,
        display: "flex",
        alignItems: "baseline",
        gap: 32,
      }}>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{state.bladen.length}</span>
          <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>bladen</span>
        </div>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{totaalM2(state).toFixed(2)}</span>
          <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>m²</span>
        </div>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{totaalAccessoires(state)}</span>
          <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>accessoires</span>
        </div>

        {/* Globale warnings rechts */}
        {warnings.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {visibleWarnings.map((tekst, i) => (
              <span
                key={i}
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fcd34d",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {tekst}
              </span>
            ))}
            {extraWarnings > 0 && (
              <span style={{ fontSize: 12, color: "#92400e" }}>
                {extraWarnings} meer waarschuwing{extraWarnings !== 1 ? "en" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Zone 3 — Bladen-grid */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {state.bladen.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Nog geen bladen — voeg toe in stap 2</p>
          ) : (
            state.bladen.map((blad) => (
              <BladKaart
                key={blad.id}
                blad={blad}
                state={state}
                onBewerken={() => onNavigeer(2, blad.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* Zone 4 — Accessoires */}
      <section style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
            Accessoires{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>({totaalAccessoires(state)} stuks)</span>
          </span>
          <button
            onClick={() => onNavigeer(3, undefined, 'accessoires')}
            style={{ background: "none", border: "none", color: "#0d9488", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            Bewerken ↗
          </button>
        </div>
        {(state.accessoires ?? []).length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Geen accessoires toegevoegd</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
            {(state.accessoires ?? []).map((a) => (
              <div key={a.id} style={{ fontSize: 13, color: "#334155" }}>
                {a.aantal}× {a.naam}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Succes-toast ERPNext */}
      {succes && (
        <div
          onClick={() => window.open(succes.url, '_blank')}
          style={{
            background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8,
            padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#166534",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span>
            {state.quotationName
              ? `Quotation ${succes.naam} bijgewerkt in ERPNext — klik om te openen`
              : `Quotation ${succes.naam} aangemaakt in ERPNext — klik om te openen`}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setSucces(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#166534", lineHeight: 1, padding: "0 0 0 12px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Fout-toast */}
      {fout && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8,
          padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#991b1b",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{fout}</span>
          <button
            onClick={() => setFout(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#991b1b", lineHeight: 1, padding: "0 0 0 12px" }}
          >
            ×
          </button>
        </div>
      )}
      {/* Zone 5+6 — Actie-footer: één rij rechts uitgelijnd */}
      <footer style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
        {/* Tertiary: PDF-output knoppen */}
        <button
          onClick={handleDownloadWerkplaatstekening}
          disabled={geenBladen || busy !== null}
          title={geenBladen ? "Voeg eerst een blad toe in stap 2" : undefined}
          style={{
            padding: "9px 16px", fontSize: 14, borderRadius: 7,
            border: `1px solid ${geenBladen ? "#cbd5e1" : "#94a3b8"}`,
            background: "transparent",
            color: geenBladen ? "#cbd5e1" : "#64748b",
            cursor: geenBladen ? "not-allowed" : "pointer",
            fontWeight: 500, opacity: busy === 'werkplaats' ? 0.6 : 1,
          }}
        >
          {busy === 'werkplaats' ? 'Bezig…' : 'Werkplaatstekening'}
        </button>
        <button
          onClick={handleDownloadZaagbrief}
          disabled={geenBladen || busy !== null}
          title={geenBladen ? "Voeg eerst een blad toe in stap 2" : undefined}
          style={{
            padding: "9px 16px", fontSize: 14, borderRadius: 7,
            border: `1px solid ${geenBladen ? "#cbd5e1" : "#94a3b8"}`,
            background: "transparent",
            color: geenBladen ? "#cbd5e1" : "#64748b",
            cursor: geenBladen ? "not-allowed" : "pointer",
            fontWeight: 500, opacity: busy === 'zaagbrief' ? 0.6 : 1,
          }}
        >
          {busy === 'zaagbrief' ? 'Bezig…' : 'Zaagbrief'}
        </button>

        {/* Visuele scheiding */}
        <div style={{ width: 12 }} />

        {/* Primary: Verzenden naar ERPNext (stap 11.7 — disabled bij offline) */}
        {(() => {
          const geenKlant = !state.opdrachtgever?.naam;
          const erpDisabled = geenKlant || geenBladen || busy !== null || !online;
          const erpTitle = !online
            ? "Geen internet — kan niet verzenden naar ERPNext"
            : geenKlant
            ? "Selecteer eerst een klant in stap 1"
            : geenBladen
            ? "Voeg eerst een blad toe in stap 2"
            : undefined;
          const erpTekst = busy === 'erpnext'
            ? 'Bezig…'
            : state.quotationName
            ? 'Bijwerken in ERPNext'
            : 'Verzenden naar ERPNext';
          return (
            <button
              onClick={handleVerzendNaarERPNext}
              disabled={erpDisabled}
              title={erpTitle}
              style={{
                padding: "9px 20px", fontSize: 14, borderRadius: 7,
                border: "none",
                background: erpDisabled ? "#94a3b8" : "#0d9488",
                color: "white",
                cursor: erpDisabled ? "not-allowed" : "pointer",
                fontWeight: 600, opacity: busy === 'erpnext' ? 0.7 : 1,
                minWidth: 200,
              }}
            >
              {erpTekst}
            </button>
          );
        })()}
      </footer>
    </div>
  );
}
