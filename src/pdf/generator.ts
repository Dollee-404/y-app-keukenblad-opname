import { jsPDF } from 'jspdf';
import type { Opname } from '../data/seed-types';
import { computeViewport, computeViewportLandscape } from './coordinateTransform';
import { renderPaginaHeader } from './renderHeader';
import { renderPaginaFooter } from './renderFooter';
// Landscape-variant beschikbaar via renderPaginaHeaderV2 / renderPaginaFooterV2.
// Niet aangeroepen door werkplaatstekening-generator — bewaard voor
// sprint 7 klantbevestiging en toekomstige A3-modus.
import { renderBladContour, renderHoekSymbolen } from './renderBlad';
import { renderSparingen } from './renderSparingen';
import { renderBoorgaten } from './renderBoorgaten';
import {
  renderBuitenmaten,
  renderUithapMaten,
  renderSparingMaten,
  renderBoorgatMaten,
  renderRandafwerkingLabels,
} from './renderMaatvoering';

export function genereerWerkplaatstekening(
  opname: Opname,
  options?: { bladIds?: string[] },
): Blob {
  const bladen = options?.bladIds
    ? opname.bladen.filter(b => options.bladIds!.includes(b.id))
    : opname.bladen;

  if (bladen.length === 0) throw new Error('Geen bladen om te renderen');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  bladen.forEach((blad, idx) => {
    // Default portrait conform Vasto-conventie. Individuele override via blad.orientation.
    const orientatie    = blad.orientation ?? 'portrait';
    if (idx > 0) doc.addPage('a4', orientatie);

    if (blad.lengte / blad.breedte > 5) {
      console.warn(`[kbf-pdf] Blad ${blad.id} heeft extreem ratio (${(blad.lengte / blad.breedte).toFixed(1)}:1) — tekening wordt erg smal`);
    }

    const vp            = orientatie === 'landscape' ? computeViewportLandscape(blad) : computeViewport(blad);
    const bladSparingen = (opname.sparingen ?? []).filter(s => s.bladId === blad.id);
    const boorgaten     = blad.boorgaten ?? [];
    const paginaInfo    = { paginaNr: idx + 1, totaalPaginas: bladen.length };

    renderPaginaHeader(doc, [blad], paginaInfo, opname);
    renderPaginaFooter(doc, opname, blad, paginaInfo);

    renderBladContour(doc, blad, vp);
    renderHoekSymbolen(doc, blad, vp);
    renderSparingen(doc, blad, vp, bladSparingen);
    renderBoorgaten(doc, blad, vp, boorgaten);
    renderBuitenmaten(doc, blad, vp);
    renderUithapMaten(doc, blad, vp);
    renderSparingMaten(doc, blad, vp, bladSparingen);
    renderBoorgatMaten(doc, boorgaten, blad, vp);
    renderRandafwerkingLabels(doc, blad, vp);
  });

  return doc.output('blob');
}
