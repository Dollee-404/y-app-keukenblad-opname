import { useState, useEffect } from "react";

interface Props {
  segmentIndex: number;
  huidigeLengte: number;
  onOpslaan: (nieuweLengte: number) => void;
  onSluiten: () => void;
}

export default function SegmentPanel({ segmentIndex, huidigeLengte, onOpslaan, onSluiten }: Props) {
  const [waarde, setWaarde] = useState(Math.round(huidigeLengte).toString());

  useEffect(() => {
    setWaarde(Math.round(huidigeLengte).toString());
  }, [huidigeLengte, segmentIndex]);

  function aanpassen(delta: number) {
    setWaarde(v => String(Math.max(1, (Number(v) || 0) + delta)));
  }

  function handleOpslaan() {
    const n = Number(waarde);
    if (n > 0) onOpslaan(n);
  }

  const label = `Zijde ${segmentIndex + 1}`;

  return (
    <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">{label} — maat aanpassen</h3>
          <button
            onClick={onSluiten}
            className="text-slate-400 hover:text-slate-600 text-xl px-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => aanpassen(-100)}
            className="min-h-[44px] min-w-[44px] border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors px-3"
          >
            −100
          </button>
          <button
            onClick={() => aanpassen(-10)}
            className="min-h-[44px] min-w-[44px] border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors px-3"
          >
            −10
          </button>
          <input
            type="number"
            inputMode="numeric"
            className="flex-1 min-h-[44px] border border-slate-300 rounded-lg text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={waarde}
            onChange={(e) => setWaarde(e.target.value)}
          />
          <span className="text-sm text-slate-500">mm</span>
          <button
            onClick={() => aanpassen(10)}
            className="min-h-[44px] min-w-[44px] border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors px-3"
          >
            +10
          </button>
          <button
            onClick={() => aanpassen(100)}
            className="min-h-[44px] min-w-[44px] border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors px-3"
          >
            +100
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onSluiten}
            className="flex-1 min-h-[44px] border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleOpslaan}
            className="flex-1 min-h-[44px] bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Toepassen
          </button>
        </div>
      </div>
    </div>
  );
}
