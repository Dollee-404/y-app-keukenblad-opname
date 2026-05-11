import { useState } from "react";
import type { Opname } from "../data/seed-types";
import type { OpnameAction } from "../state/opnameReducer";
import BladList from "./step2/BladList";
import NieuwBladDialog from "./step2/NieuwBladDialog";
import Canvas from "./step2/Canvas";
import SegmentPanel from "./step2/SegmentPanel";
import HoekUithapDialog from "./step2/HoekUithapDialog";
import {
  rechthoekOutline,
  segmentLengtes,
  bewerkSegmentLengte,
} from "../drawing/bladHelpers";
import type { Blad } from "../data/seed-types";

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
}

export default function Step2Tekening({ state, dispatch }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toonNieuwDialog, setToonNieuwDialog] = useState(false);
  const [actieveSegment, setActieveSegment] = useState<number | null>(null);
  const [actieveHoek, setActieveHoek] = useState<number | null>(null);
  const [lijstOpen, setLijstOpen] = useState(false);

  const geselecteerdBlad = state.bladen.find(b => b.id === selectedId) ?? null;

  function handleToevoegen(blad: Blad) {
    dispatch({ type: "BLAD_TOEVOEGEN", blad });
    setSelectedId(blad.id);
    setToonNieuwDialog(false);
    setLijstOpen(false);
  }

  function handleVerwijder(id: string) {
    dispatch({ type: "BLAD_VERWIJDEREN", id });
    if (selectedId === id) {
      const rest = state.bladen.filter(b => b.id !== id);
      setSelectedId(rest.length > 0 ? rest[rest.length - 1].id : null);
    }
  }

  function handleSegmentTap(segmentIndex: number) {
    setActieveHoek(null);
    setActieveSegment(segmentIndex);
  }

  function handleHoekTap(cornerIndex: number) {
    setActieveSegment(null);
    setActieveHoek(cornerIndex);
  }

  function handleSegmentOpslaan(nieuweLengte: number) {
    if (!geselecteerdBlad || actieveSegment === null) return;
    const huidig = geselecteerdBlad.outline ?? rechthoekOutline(geselecteerdBlad.lengte, geselecteerdBlad.breedte);
    const nieuweOutline = bewerkSegmentLengte(huidig, actieveSegment, nieuweLengte);

    // Update ook lengte/breedte als de bounding box verandert
    const xs = nieuweOutline.map(p => p.x);
    const ys = nieuweOutline.map(p => p.y);
    const nieuwL = Math.max(...xs) - Math.min(...xs);
    const nieuwB = Math.max(...ys) - Math.min(...ys);

    dispatch({
      type: "BLAD_BIJWERKEN",
      id: geselecteerdBlad.id,
      patch: { outline: nieuweOutline, lengte: Math.round(nieuwL), breedte: Math.round(nieuwB) },
    });
    setActieveSegment(null);
  }

  function handleHoekToepassen(nieuweOutline: typeof geselecteerdBlad.outline) {
    if (!geselecteerdBlad || !nieuweOutline) return;
    dispatch({
      type: "BLAD_BIJWERKEN",
      id: geselecteerdBlad.id,
      patch: { outline: nieuweOutline },
    });
    setActieveHoek(null);
  }

  const huidigOutline = geselecteerdBlad
    ? (geselecteerdBlad.outline ?? rechthoekOutline(geselecteerdBlad.lengte, geselecteerdBlad.breedte))
    : null;

  const huidigeLengteSegment =
    geselecteerdBlad && huidigOutline && actieveSegment !== null
      ? segmentLengtes(huidigOutline)[actieveSegment]
      : 0;

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Layout: BladList sidebar + Canvas ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Sidebar — desktop: altijd zichtbaar, tablet portrait: drawer */}
        <aside className={[
          "bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-200",
          /* Desktop: vaste breedte */
          "hidden md:flex md:w-64 lg:w-72 flex-col",
        ].join(" ")}>
          <BladList
            bladen={state.bladen}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setActieveSegment(null); setActieveHoek(null); }}
            onVerwijder={handleVerwijder}
            onNieuw={() => setToonNieuwDialog(true)}
          />
        </aside>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Toolbar boven canvas */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 min-h-[48px]">
            {/* Mobiel: lijst-toggle */}
            <button
              onClick={() => setLijstOpen(o => !o)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Bladenlijst"
            >
              ☰
            </button>

            {geselecteerdBlad ? (
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-800">{geselecteerdBlad.label}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {geselecteerdBlad.lengte} × {geselecteerdBlad.breedte} × {geselecteerdBlad.dikte} mm
                </span>
              </div>
            ) : (
              <span className="flex-1 text-sm text-slate-400">Selecteer een blad</span>
            )}

            {/* Mobiel: + Nieuw */}
            <button
              onClick={() => setToonNieuwDialog(true)}
              className="md:hidden min-h-[44px] px-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              + Nieuw
            </button>
          </div>

          {/* Canvas / lege staat */}
          <div className="flex-1 relative overflow-hidden">
            {geselecteerdBlad ? (
              <Canvas
                blad={geselecteerdBlad}
                onSegmentTap={handleSegmentTap}
                onHoekTap={handleHoekTap}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <p className="text-slate-400">Geen blad geselecteerd</p>
                <button
                  onClick={() => setToonNieuwDialog(true)}
                  className="min-h-[52px] px-6 bg-teal-600 text-white text-base font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                >
                  + Nieuw blad toevoegen
                </button>
              </div>
            )}
          </div>

          {/* Segment-invoer panel (vast onderaan) */}
          {actieveSegment !== null && geselecteerdBlad && (
            <SegmentPanel
              segmentIndex={actieveSegment}
              huidigeLengte={huidigeLengteSegment}
              onOpslaan={handleSegmentOpslaan}
              onSluiten={() => setActieveSegment(null)}
            />
          )}
        </div>
      </div>

      {/* Mobiel drawer voor bladenlijst */}
      {lijstOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setLijstOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="font-semibold text-slate-800">Bladen</span>
              <button
                onClick={() => setLijstOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <BladList
                bladen={state.bladen}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setLijstOpen(false); setActieveSegment(null); setActieveHoek(null); }}
                onVerwijder={handleVerwijder}
                onNieuw={() => { setToonNieuwDialog(true); setLijstOpen(false); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dialogen */}
      {toonNieuwDialog && (
        <NieuwBladDialog
          onToevoegen={handleToevoegen}
          onAnnuleer={() => setToonNieuwDialog(false)}
        />
      )}

      {actieveHoek !== null && geselecteerdBlad && huidigOutline && (
        <HoekUithapDialog
          cornerIndex={actieveHoek}
          outline={huidigOutline}
          bladLengte={geselecteerdBlad.lengte}
          bladBreedte={geselecteerdBlad.breedte}
          onToepassen={handleHoekToepassen}
          onSluiten={() => setActieveHoek(null)}
        />
      )}
    </div>
  );
}
