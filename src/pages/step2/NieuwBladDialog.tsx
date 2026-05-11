import { useState, useEffect, useRef } from "react";
import seedRaw from "../../data/seed-data.json";
import type { SeedData, WerkstukType, WerkstukCategorieCode, Dikte, Blad } from "../../data/seed-types";
import { categorieVoorWerkstuk } from "../../data/seed-types";
import { rechthoekOutline } from "../../drawing/bladHelpers";

const seed = seedRaw as unknown as SeedData;

interface Props {
  onToevoegen: (blad: Blad) => void;
  onAnnuleer: () => void;
}

let teller = 0;
function nieuweId(): string {
  return `b-${++teller}`;
}

const inputKlasse =
  "w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const labelKlasse = "block text-sm font-medium text-slate-700 mb-1";

export default function NieuwBladDialog({ onToevoegen, onAnnuleer }: Props) {
  const [werkstukType, setWerkstukType] = useState<WerkstukType>("Bladdeel A");
  const [lengte, setLengte] = useState("");
  const [breedte, setBreedte] = useState("");
  const [dikte, setDikte] = useState<Dikte>(20);
  const [label, setLabel] = useState("");
  const lengteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lengteRef.current?.focus();
  }, []);

  function defaultLabel(ws: WerkstukType): string {
    return ws.toUpperCase();
  }

  function handleToevoegen() {
    const l = Number(lengte);
    const b = Number(breedte);
    if (!l || !b) return;
    const categorie: WerkstukCategorieCode = categorieVoorWerkstuk(werkstukType, seed);
    const nieuwBlad: Blad = {
      id: nieuweId(),
      label: label.trim() || defaultLabel(werkstukType),
      werkstukType,
      categorie,
      lengte: l,
      breedte: b,
      dikte,
      outline: rechthoekOutline(l, b),
      randen: [],
    };
    onToevoegen(nieuwBlad);
  }

  const kanToevoegen = Number(lengte) > 0 && Number(breedte) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Nieuw blad toevoegen</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Werkstuktype */}
          <div>
            <label className={labelKlasse}>Werkstuktype</label>
            <select
              className={inputKlasse}
              value={werkstukType}
              onChange={(e) => {
                const ws = e.target.value as WerkstukType;
                setWerkstukType(ws);
                setLabel("");
              }}
            >
              {Object.values(seed.werkstuk_categorieen).map((cat) => (
                <optgroup key={cat.code} label={cat.label}>
                  {cat.werkstukken.map((ws) => (
                    <option key={ws} value={ws}>{ws}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Afmetingen */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelKlasse}>Lengte (mm)</label>
              <input
                ref={lengteRef}
                type="number"
                inputMode="numeric"
                className={inputKlasse}
                placeholder="bijv. 1958"
                value={lengte}
                onChange={(e) => setLengte(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className={labelKlasse}>Breedte (mm)</label>
              <input
                type="number"
                inputMode="numeric"
                className={inputKlasse}
                placeholder="bijv. 640"
                value={breedte}
                onChange={(e) => setBreedte(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className={labelKlasse}>Dikte (mm)</label>
              <select
                className={inputKlasse}
                value={dikte}
                onChange={(e) => setDikte(Number(e.target.value) as Dikte)}
              >
                {seed.diktes_mm.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optioneel label */}
          <div>
            <label className={labelKlasse}>
              Label{" "}
              <span className="text-slate-400 font-normal">(optioneel)</span>
            </label>
            <input
              type="text"
              className={inputKlasse}
              placeholder={defaultLabel(werkstukType)}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button
            onClick={onAnnuleer}
            className="flex-1 min-h-[44px] border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleToevoegen}
            disabled={!kanToevoegen}
            className="flex-1 min-h-[44px] bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Toevoegen
          </button>
        </div>
      </div>
    </div>
  );
}
