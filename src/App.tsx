import { useReducer, useState } from "react";
import { opnameReducer, initialState, legeInitialState } from "./state/opnameReducer";

const leegParam = new URLSearchParams(window.location.search).has("leeg");
const startState = leegParam ? legeInitialState : initialState;
const startStap = leegParam ? 1 : (import.meta.env.DEV ? 3 : 1);
import TopBar from "./components/TopBar";
import Step1Klant from "./pages/Step1Klant";
import Step2Tekening from "./pages/Step2Tekening";
import Step3Specs from "./pages/step3/Step3Specs";
import Step4Overzicht from "./pages/step4/Step4Overzicht";

export default function App() {
  const [state, dispatch] = useReducer(opnameReducer, startState);
  const [debugOpen, setDebugOpen] = useState(false);
  const [huidigStap, setHuidigStap] = useState<number>(startStap);
  const [navigatieContext, setNavigatieContext] = useState<{
    bladId?: string;
    subSection?: string;
  }>({});

  function naarStapMetContext(stap: number, bladId?: string, subSection?: string) {
    setNavigatieContext({ bladId, subSection });
    setHuidigStap(stap);
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <TopBar
        state={state}
        huidigStap={huidigStap}
        onStap={(nr) => naarStapMetContext(nr)}
        onNaarStap1={() => naarStapMetContext(1)}
        onVolgende={() => naarStapMetContext(huidigStap + 1)}
      />

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
          <Step4Overzicht state={state} dispatch={dispatch} onNavigeer={naarStapMetContext} />
        </main>
      )}
    </div>
  );
}
