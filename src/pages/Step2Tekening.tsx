import { useState, useRef, useCallback } from "react";
import type { Opname, Sparing } from "../data/seed-types";
import type { OpnameAction } from "../state/opnameReducer";
import BladList from "./step2/BladList";
import NieuwBladDialog from "./step2/NieuwBladDialog";
import Canvas from "./step2/Canvas";
import SegmentPanel from "./step2/SegmentPanel";
import HoekUithapDialog from "./step2/HoekUithapDialog";
import SparingDialog from "./step2/SparingDialog";
import SparingPanel from "./step2/SparingPanel";
import CanvasToolbar from "./step2/CanvasToolbar";
import CanvasStatusBar from "./step2/CanvasStatusBar";
import BladInfoPanel from "./step2/BladInfoPanel";
import {
  rechthoekOutline,
  segmentLengtes,
  bewerkSegmentLengte,
  segmentMidden,
  uitwaartsNormaal,
} from "../drawing/bladHelpers";
import type { Blad } from "../data/seed-types";

interface Viewport { x: number; y: number; scale: number }

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
}

export default function Step2Tekening({ state, dispatch }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toonNieuwDialog, setToonNieuwDialog] = useState(false);
  const [toonSparingDialog, setToonSparingDialog] = useState(false);
  const [actieveSegment, setActieveSegment] = useState<number | null>(null);
  const [actieveHoek, setActieveHoek] = useState<number | null>(null);
  const [activeSparingId, setActiveSparingId] = useState<string | null>(null);
  const [lijstOpen, setLijstOpen] = useState(false);
  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<(() => void) | null>(null);

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
    setActiveSparingId(null);
    setActieveSegment(segmentIndex);
  }

  function handleHoekTap(cornerIndex: number) {
    setActieveSegment(null);
    setActiveSparingId(null);
    setActieveHoek(cornerIndex);
  }

  function handleSparingTap(id: string) {
    setActieveSegment(null);
    setActieveHoek(null);
    setActiveSparingId(prev => (prev === id ? null : id));
  }

  function handleSparingToevoegen(sparing: Sparing) {
    if (!geselecteerdBlad) return;
    dispatch({ type: "SPARING_TOEVOEGEN", bladId: geselecteerdBlad.id, sparing });
    setToonSparingDialog(false);
    setActiveSparingId(sparing.id);
  }

  function handleSparingBijwerken(id: string, patch: Partial<Sparing>) {
    if (!geselecteerdBlad) return;
    dispatch({ type: "SPARING_BIJWERKEN", bladId: geselecteerdBlad.id, id, patch });
  }

  function handleSparingVerwijderen(id: string) {
    if (!geselecteerdBlad) return;
    dispatch({ type: "SPARING_VERWIJDEREN", bladId: geselecteerdBlad.id, id });
    setActiveSparingId(null);
  }

  function handleSegmentOpslaan(nieuweLengte: number) {
    if (!geselecteerdBlad || actieveSegment === null) return;
    const huidig = geselecteerdBlad.outline ?? rechthoekOutline(geselecteerdBlad.lengte, geselecteerdBlad.breedte);
    const nieuweOutline = bewerkSegmentLengte(huidig, actieveSegment, nieuweLengte);
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
    dispatch({ type: "BLAD_BIJWERKEN", id: geselecteerdBlad.id, patch: { outline: nieuweOutline } });
    setActieveHoek(null);
  }

  const huidigOutline = geselecteerdBlad
    ? (geselecteerdBlad.outline ?? rechthoekOutline(geselecteerdBlad.lengte, geselecteerdBlad.breedte))
    : null;

  const huidigeLengteSegment =
    geselecteerdBlad && huidigOutline && actieveSegment !== null
      ? segmentLengtes(huidigOutline)[actieveSegment]
      : 0;

  // Bereken floating positie voor SegmentPanel (in pixels binnen canvas-container)
  const segmentPopoverPos = useCallback((): { left: number; top: number } | null => {
    if (actieveSegment === null || !huidigOutline || !canvasContainerRef.current) return null;
    const mid = segmentMidden(huidigOutline, actieveSegment);
    const norm = uitwaartsNormaal(huidigOutline, actieveSegment);
    const offsetMm = 60;
    const anchorX = (mid.x + norm.x * offsetMm) * vp.scale + vp.x;
    const anchorY = (mid.y + norm.y * offsetMm) * vp.scale + vp.y;
    const container = canvasContainerRef.current;
    const panelW = 360;
    const panelH = 110;
    const margin = 8;
    const left = Math.max(margin, Math.min(anchorX - panelW / 2, container.clientWidth - panelW - margin));
    const top = Math.max(margin, Math.min(anchorY - panelH / 2, container.clientHeight - panelH - margin));
    return { left, top };
  }, [actieveSegment, huidigOutline, vp]);

  const popoverPos = segmentPopoverPos();

  const sparingPopoverPos = useCallback((): { left: number; top: number } | null => {
    if (!activeSparingId || !geselecteerdBlad?.sparingen || !canvasContainerRef.current) return null;
    const sparing = geselecteerdBlad.sparingen.find(s => s.id === activeSparingId);
    if (!sparing) return null;
    const anchorX = sparing.positie.x * vp.scale + vp.x;
    const anchorY = (sparing.positie.y - sparing.hoogte / 2) * vp.scale + vp.y - 16;
    const container = canvasContainerRef.current;
    const panelW = 330;
    const panelH = 155;
    const margin = 8;
    const left = Math.max(margin, Math.min(anchorX - panelW / 2, container.clientWidth - panelW - margin));
    const top = Math.max(margin, Math.min(anchorY - panelH, container.clientHeight - panelH - margin));
    return { left, top };
  }, [activeSparingId, geselecteerdBlad, vp]);

  const sparingPopPos = sparingPopoverPos();
  const actieveSparing = geselecteerdBlad?.sparingen?.find(s => s.id === activeSparingId) ?? null;

  return (
    <div className="flex flex-row h-full min-h-0 overflow-hidden">

      {/* Kolom 1: BladList (desktop: altijd zichtbaar) */}
      <aside
        className="hidden md:flex flex-col bg-white flex-shrink-0 overflow-y-auto"
        style={{ width: 240, borderRight: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        <BladList
          bladen={state.bladen}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setActieveSegment(null); setActieveHoek(null); }}
          onVerwijder={handleVerwijder}
          onNieuw={() => setToonNieuwDialog(true)}
        />
      </aside>

      {/* Kolom 2: Canvas */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <CanvasToolbar
          blad={geselecteerdBlad}
          state={state}
          onHoekKnippen={() => geselecteerdBlad && setActieveHoek(0)}
          onZoomIn={() => setVp(v => ({ ...v, scale: Math.min(20, v.scale * 1.2) }))}
          onZoomOut={() => setVp(v => ({ ...v, scale: Math.max(0.05, v.scale / 1.2) }))}
          onFitScreen={() => fitRef.current?.()}
          onSparingToevoegen={() => setToonSparingDialog(true)}
          onDrawerOpen={() => setLijstOpen(true)}
        />

        {/* SVG-area: relatief → floating popover en dialog worden hier verankerd */}
        <div ref={canvasContainerRef} className="flex-1 min-h-0 relative overflow-hidden" style={{ padding: 24 }}>
          {geselecteerdBlad ? (
            <Canvas
              blad={geselecteerdBlad}
              selectedSegmentIndex={actieveSegment}
              activeSparingId={activeSparingId}
              vp={vp}
              onVpChange={setVp}
              onFitRef={fitRef}
              onSegmentTap={handleSegmentTap}
              onHoekTap={handleHoekTap}
              onSparingTap={handleSparingTap}
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

          {/* Floating SegmentPanel */}
          {actieveSegment !== null && geselecteerdBlad && popoverPos && (
            <div style={{ position: "absolute", left: popoverPos.left, top: popoverPos.top, zIndex: 20 }}>
              <SegmentPanel
                segmentIndex={actieveSegment}
                huidigeLengte={huidigeLengteSegment}
                onOpslaan={handleSegmentOpslaan}
                onSluiten={() => setActieveSegment(null)}
              />
            </div>
          )}

          {/* Floating SparingPanel */}
          {actieveSparing && sparingPopPos && (
            <div style={{ position: "absolute", left: sparingPopPos.left, top: sparingPopPos.top, zIndex: 20 }}>
              <SparingPanel
                sparing={actieveSparing}
                onBijwerken={(patch) => handleSparingBijwerken(actieveSparing.id, patch)}
                onVerwijderen={() => handleSparingVerwijderen(actieveSparing.id)}
                onSluiten={() => setActiveSparingId(null)}
              />
            </div>
          )}

          {/* SparingDialog */}
          {toonSparingDialog && geselecteerdBlad && (
            <SparingDialog
              blad={geselecteerdBlad}
              state={state}
              onToevoegen={handleSparingToevoegen}
              onSluiten={() => setToonSparingDialog(false)}
            />
          )}

          {/* HoekUithapDialog: gecentreerd binnen canvas-area */}
          {actieveHoek !== null && geselecteerdBlad && huidigOutline && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 30,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.3)",
                }}
                onClick={() => setActieveHoek(null)}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <HoekUithapDialog
                  cornerIndex={actieveHoek}
                  outline={huidigOutline}
                  bladLengte={geselecteerdBlad.lengte}
                  bladBreedte={geselecteerdBlad.breedte}
                  onToepassen={handleHoekToepassen}
                  onSluiten={() => setActieveHoek(null)}
                />
              </div>
            </div>
          )}
        </div>

        <CanvasStatusBar />
      </div>

      {/* Kolom 3: BladInfoPanel */}
      <BladInfoPanel blad={geselecteerdBlad} state={state} />

      {/* Mobiel drawer voor bladenlijst */}
      {lijstOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setLijstOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
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
    </div>
  );
}
