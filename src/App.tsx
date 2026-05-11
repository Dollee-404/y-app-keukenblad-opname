import { useReducer, useState } from "react";
import { opnameReducer, initialState } from "./state/opnameReducer";
import StepIndicator from "./components/StepIndicator";
import Step1Klant from "./pages/Step1Klant";

export default function App() {
  const [state, dispatch] = useReducer(opnameReducer, initialState);
  const [debugOpen, setDebugOpen] = useState(false);
  const huidigStap: number = 1;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Keukenblad Opname</h1>
            <p className="text-xs text-slate-400">De Keukenbladenfabriek</p>
          </div>
          <span className="text-xs text-slate-400">v0.1.0</span>
        </div>
      </header>

      {/* Stappen-indicator */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto">
          <StepIndicator huidigStap={huidigStap} />
        </div>
      </div>

      {/* Hoofd-content */}
      <main className="max-w-xl mx-auto px-4 py-6">
        {huidigStap === 1 && <Step1Klant state={state} dispatch={dispatch} />}
        {huidigStap === 2 && <div className="text-center text-slate-400 py-16">Tekening — volgt in sprint 3</div>}
        {huidigStap === 3 && <div className="text-center text-slate-400 py-16">Specificaties — volgt in sprint 4</div>}
        {huidigStap === 4 && <div className="text-center text-slate-400 py-16">Overzicht — volgt in sprint 5</div>}
      </main>

      {/* Debug JSON-preview (alleen in dev) */}
      {import.meta.env.DEV && (
        <div className="max-w-xl mx-auto px-4 pb-8">
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
