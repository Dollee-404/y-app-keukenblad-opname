import type { Blad } from "../../data/seed-types";
import { oppervlakteM2 } from "../../data/seed-types";
import { rechthoekOutline } from "../../drawing/bladHelpers";

interface Props {
  bladen: Blad[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onVerwijder: (id: string) => void;
  onNieuw: () => void;
}

function BladThumbnail({ blad }: { blad: Blad }) {
  const outline = blad.outline ?? rechthoekOutline(blad.lengte, blad.breedte);
  const xs = outline.map(p => p.x);
  const ys = outline.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const points = outline.map(p => `${p.x - minX},${p.y - minY}`).join(" ");
  const pad = Math.max(w, h) * 0.05;
  const vb = `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`;

  return (
    <svg viewBox={vb} className="w-10 h-10 flex-shrink-0" aria-hidden>
      <polygon points={points} fill="white" stroke="#475569" strokeWidth={Math.max(w, h) * 0.04} />
    </svg>
  );
}

export default function BladList({ bladen, selectedId, onSelect, onVerwijder, onNieuw }: Props) {
  const totaalM2 = bladen.reduce((s, b) => s + oppervlakteM2(b), 0);

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: "12px 12px 8px" }}>
        <button
          onClick={onNieuw}
          className="w-full bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-1"
          style={{ padding: "10px", fontSize: 13, borderRadius: 6 }}
        >
          <span>+</span> Nieuw blad
        </button>
      </div>

      {bladen.length > 0 && (
        <div
          style={{
            padding: "4px 8px",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#94a3b8",
          }}
        >
          {bladen.length} {bladen.length === 1 ? "blad" : "bladen"} — {totaalM2.toFixed(2)} m²
        </div>
      )}

      {bladen.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <p className="text-sm text-slate-400">
            Nog geen bladen.<br />Tik op <strong>+ Nieuw blad</strong> om te beginnen.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {bladen.map((blad) => (
            <li key={blad.id}>
              <div className="flex items-center">
                <button
                  onClick={() => onSelect(blad.id)}
                  className={[
                    "flex-1 flex items-center gap-3 px-3 py-2 min-h-[52px] text-left transition-colors",
                    selectedId === blad.id
                      ? "bg-teal-50 border-l-2 border-teal-500"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="bg-slate-100 rounded p-1">
                    <BladThumbnail blad={blad} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{blad.label}</p>
                    <p className="text-xs text-slate-400">{blad.lengte} × {blad.breedte} × {blad.dikte} mm</p>
                  </div>
                </button>
                <button
                  onClick={() => onVerwijder(blad.id)}
                  className="px-3 py-2 min-h-[52px] text-slate-400 hover:text-red-500 transition-colors text-lg"
                  aria-label={`Verwijder ${blad.label}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
