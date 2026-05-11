import { useState } from "react";
import type { Point } from "../../data/seed-types";
import { knipHoekUit } from "../../drawing/bladHelpers";

interface Props {
  cornerIndex: number;
  outline: Point[];
  bladLengte: number;
  bladBreedte: number;
  onToepassen: (nieuweOutline: Point[]) => void;
  onSluiten: () => void;
}

function pointsAttr(pts: Point[]): string {
  return pts.map(p => `${p.x},${p.y}`).join(" ");
}

export default function HoekUithapDialog({
  cornerIndex,
  outline,
  bladLengte,
  bladBreedte,
  onToepassen,
  onSluiten,
}: Props) {
  const [breedte, setBreedte] = useState("200");
  const [hoogte, setHoogte] = useState("100");

  const b = Number(breedte);
  const h = Number(hoogte);
  const geldig = b > 0 && h > 0;

  // Preview-outline: voorvertoon de uithap
  const previewOutline = geldig
    ? knipHoekUit(outline, cornerIndex, b, h)
    : outline;

  // Maak een kleine preview SVG
  const allX = previewOutline.map(p => p.x);
  const allY = previewOutline.map(p => p.y);
  const vbMinX = Math.min(...allX) - 30;
  const vbMinY = Math.min(...allY) - 30;
  const vbW = Math.max(...allX) - vbMinX + 60;
  const vbH = Math.max(...allY) - vbMinY + 60;

  function handleToepassen() {
    if (!geldig) return;
    onToepassen(knipHoekUit(outline, cornerIndex, b, h));
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Hoek wegknippen</h2>
          <p className="text-sm text-slate-500 mt-1">Hoekpunt {cornerIndex + 1}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Breedte uithap (mm)</label>
              <input
                type="number"
                inputMode="numeric"
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={breedte}
                onChange={(e) => setBreedte(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hoogte uithap (mm)</label>
              <input
                type="number"
                inputMode="numeric"
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={hoogte}
                onChange={(e) => setHoogte(e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Mini-preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-2">Voorvertoon</p>
            <svg
              viewBox={`${vbMinX} ${vbMinY} ${vbW} ${vbH}`}
              className="w-full max-h-40"
              aria-label="Voorvertoon uithap"
            >
              <polygon
                points={pointsAttr(previewOutline)}
                fill="white"
                stroke="#0f766e"
                strokeWidth={Math.max(bladLengte, bladBreedte) * 0.01}
              />
              <circle
                cx={outline[cornerIndex].x}
                cy={outline[cornerIndex].y}
                r={Math.max(bladLengte, bladBreedte) * 0.02}
                fill="#f43f5e"
                opacity={geldig ? 0.4 : 0.9}
              />
            </svg>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button
            onClick={onSluiten}
            className="flex-1 min-h-[44px] border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleToepassen}
            disabled={!geldig}
            className="flex-1 min-h-[44px] bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Toepassen
          </button>
        </div>
      </div>
    </div>
  );
}
