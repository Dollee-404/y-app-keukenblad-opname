import { useReducer, useState } from "react";
import { opnameReducer, initialState } from "./state/opnameReducer";
import StepIndicator from "./components/StepIndicator";
import Step1Klant from "./pages/Step1Klant";
import Step2Tekening from "./pages/Step2Tekening";

export default function App() {
  const [state, dispatch] = useReducer(opnameReducer, initialState);
  const [debugOpen, setDebugOpen] = useState(false);
  const [huidigStap, setHuidigStap] = useState<number>(1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-full flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Keukenblad Opname</h1>
            <p className="text-xs text-slate-400">De Keukenbladenfabriek</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tijdelijke stap-navigatie (sprint 5 volgt) */}
            <div className="flex gap-1">
              {[1, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setHuidigStap(s)}
                  className={[
                    "min-h-[32px] px-3 text-xs font-medium rounded-lg transition-colors",
                    huidigStap === s
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  ].join(" ")}
                >
                  Stap {s}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">v0.1.0</span>
          </div>
        </div>
      </header>

      {/* Stappen-indicator */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <StepIndicator huidigStap={huidigStap} />
        </div>
      </div>

      {/* Hoofd-content */}
      {huidigStap === 1 && (
        <main className="max-w-xl mx-auto w-full px-4 py-6">
          <Step1Klant state={state} dispatch={dispatch} />
        </main>
      )}

      {huidigStap === 2 && (
        <main className="flex-1 flex flex-col overflow-hidden">
          <Step2Tekening state={state} dispatch={dispatch} />
        </main>
      )}

      {huidigStap === 3 && (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400 py-16">Specificaties — volgt in sprint 4</div>
        </main>
      )}

      {huidigStap === 4 && (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400 py-16">Overzicht — volgt in sprint 5</div>
        </main>
      )}

      {/* Debug JSON-preview (alleen in dev) */}
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

    </div>
  );
}
