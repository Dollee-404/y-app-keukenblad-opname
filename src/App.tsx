import { useReducer, useState, useEffect, useRef } from "react";
import { laadGeldigeItemCodes } from "./erpnext/itemCodeValidation";
import { opnameReducer, initialState, legeInitialState } from "./state/opnameReducer";
import { opslaanConcept, laadConceptInfo, wisConcept, bestaatConcept } from "./storage/conceptOpslag";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import TopBar from "./components/TopBar";
import ConfirmModal from "./components/ConfirmModal";
import Step1Klant from "./pages/Step1Klant";
import Step2Tekening from "./pages/Step2Tekening";
import Step3Specs from "./pages/step3/Step3Specs";
import Step4Overzicht from "./pages/step4/Step4Overzicht";

const searchParams = new URLSearchParams(window.location.search);
const leegParam = searchParams.has("leeg");
const inYappParam = Boolean(searchParams.get("host"));
const startState = (leegParam || inYappParam) ? legeInitialState : initialState;
const startStap = (leegParam || inYappParam) ? 1 : (import.meta.env.DEV ? 3 : 1);

export default function App() {
  const [state, dispatch] = useReducer(opnameReducer, startState);
  const [debugOpen, setDebugOpen] = useState(false);
  const [huidigStap, setHuidigStap] = useState<number>(startStap);
  const [navigatieContext, setNavigatieContext] = useState<{
    bladId?: string;
    subSection?: string;
  }>({});
  const [conceptToast, setConceptToast] = useState<string | null>(null);
  const [confirmNieuweOpname, setConfirmNieuweOpname] = useState(false);
  const online = useNetworkStatus();

  // Aantal state-changes dat nog overgeslagen wordt voor auto-save begint.
  // Initieel 1 (voor de eerste render); +1 extra als er een concept geladen wordt.
  const skipAutoSave = useRef(1);

  // Pre-load item-codes cache
  useEffect(() => {
    laadGeldigeItemCodes().catch(err =>
      console.warn('[item-codes] Pre-load mislukt:', err)
    );
  }, []);

  // Stap 11.3 — Herstel concept bij app-open (loopt vóór auto-save effect)
  useEffect(() => {
    const info = laadConceptInfo();
    if (info) {
      skipAutoSave.current = 2; // skip initiële render + LAAD_OPNAME render
      dispatch({ type: 'LAAD_OPNAME', opname: info.opname });
      const datum = new Date(info.laatstGewijzigd).toLocaleString('nl-NL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      setConceptToast(
        info.verzonden
          ? `Opname hervat — reeds verzonden op ${datum}`
          : `Concept hervat — laatste wijziging ${datum}`
      );
      setTimeout(() => setConceptToast(null), 6000);
    }
  }, []);

  // Stap 11.2 — Auto-save debounced 500ms; slaat eerste renders over
  useEffect(() => {
    if (skipAutoSave.current > 0) {
      skipAutoSave.current--;
      return;
    }
    const timer = setTimeout(() => opslaanConcept(state), 500);
    return () => clearTimeout(timer);
  }, [state]);

  // Stap 11.2 — Onmiddellijke save bij tab-sluiten (vóór debounce vuurt)
  useEffect(() => {
    const handler = () => opslaanConcept(state);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state]);

  function naarStapMetContext(stap: number, bladId?: string, subSection?: string) {
    setNavigatieContext({ bladId, subSection });
    setHuidigStap(stap);
  }

  // Stap 11.4 — Nieuwe opname met bevestiging als er een concept aanwezig is
  function handleNieuweOpname() {
    if (bestaatConcept()) {
      setConfirmNieuweOpname(true);
      return;
    }
    voerNieuweOpnameUit();
  }

  function voerNieuweOpnameUit() {
    wisConcept();
    skipAutoSave.current = 0;
    dispatch({ type: 'RESET_OPNAME' });
    setHuidigStap(1);
    setConceptToast(null);
    setConfirmNieuweOpname(false);
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <TopBar
        state={state}
        huidigStap={huidigStap}
        online={online}
        onStap={(nr) => naarStapMetContext(nr)}
        onNaarStap1={() => naarStapMetContext(1)}
        onVolgende={() => naarStapMetContext(huidigStap + 1)}
        onNieuweOpname={handleNieuweOpname}
      />
      {/* Stap 11.3 — Concept-hervat toast */}
      {conceptToast && (
        <div style={{
          background: '#f0fdfa', borderBottom: '1px solid #5eead4',
          padding: '6px 16px', fontSize: 12, color: '#0f766e',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span>{conceptToast}</span>
          <button
            onClick={() => setConceptToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#0f766e', lineHeight: 1, padding: '0 0 0 12px' }}
          >×</button>
        </div>
      )}
      {/* Stap 11.6 — Offline-banner */}
      {!online && (
        <div style={{
          background: '#fef3c7', borderBottom: '1px solid #fcd34d',
          padding: '6px 16px', fontSize: 12, color: '#92400e',
          flexShrink: 0,
        }}>
          Geen internet — opnames worden lokaal bewaard, verzenden naar ERPNext is uitgeschakeld
        </div>
      )}

      {huidigStap === 1 && (
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto w-full px-4 py-6">
            <Step1Klant state={state} dispatch={dispatch} />
          </div>

          {import.meta.env.DEV && (
            <div className="max-w-xl mx-auto w-full px-4 pb-8">
              <button
                onClick={() => setDebugOpen((o) => !o)}
                className="w-full min-h-[44px] text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {debugOpen ? "▲ Verberg" : "▼ Toon"} JSON-preview (debug)
              </button>
              {debugOpen && (
                <pre className="mt-2 p-4 bg-slate-900 text-green-400 text-xs rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(state, null, 2)}
                </pre>
              )}
            </div>
          )}
        </main>
      )}

      {huidigStap === 2 && (
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Step2Tekening state={state} dispatch={dispatch} selectedBladId={navigatieContext.bladId} />
        </main>
      )}

      {huidigStap === 3 && (
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Step3Specs state={state} dispatch={dispatch} selectedSubSection={navigatieContext.subSection} />
        </main>
      )}

      {huidigStap === 4 && (
        <main className="flex-1 overflow-y-auto">
          <Step4Overzicht state={state} dispatch={dispatch} onNavigeer={naarStapMetContext} online={online} />
        </main>
      )}

      {confirmNieuweOpname && (
        <ConfirmModal
          bericht="Er is een actief concept. Dit wordt verwijderd als je een nieuwe opname start. Doorgaan?"
          onBevestigen={voerNieuweOpnameUit}
          onAnnuleren={() => setConfirmNieuweOpname(false)}
        />
      )}
    </div>
  );
}
