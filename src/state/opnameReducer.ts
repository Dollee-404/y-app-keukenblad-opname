import seedRaw from "../data/seed-data.json";
import { legeOpname } from "../data/seed-types";
import type { SeedData, Opname, Adres, Blad, Sparing, Boorgat, MateriaalKeuze, Randafwerking, AccessoireRegel, ZijdeId } from "../data/seed-types";

const seed = seedRaw as unknown as SeedData;

export const initialState: Opname = legeOpname(seed);

export type OpnameAction =
  | { type: "SET_VERKOPER"; payload: Opname["verkoper"] }
  | { type: "SET_INMETER"; payload: string }
  | { type: "SET_MEETDATUM"; payload: string }
  | { type: "SET_OPDRACHTGEVER"; payload: Partial<Adres> }
  | { type: "SET_AFLEVERADRES"; payload: Partial<Omit<Opname["afleveradres"], "gelijkAanOpdrachtgever">> }
  | { type: "SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER"; payload: boolean }
  | { type: "SET_ETAGE"; payload: string }
  | { type: "SET_KLANT_REGELT_LIFT"; payload: boolean }
  | { type: "SET_UW_REFERENTIE"; payload: string }
  | { type: "BLAD_TOEVOEGEN"; blad: Blad }
  | { type: "BLAD_VERWIJDEREN"; id: string }
  | { type: "BLAD_BIJWERKEN"; id: string; patch: Partial<Blad> }
  | { type: "SEGMENT_SELECTEREN"; bladId: string; segmentIndex: number }
  | { type: "SEGMENT_DESELECTEREN" }
  | { type: "SPARING_TOEVOEGEN"; bladId: string; sparing: Sparing }
  | { type: "SPARING_VERWIJDEREN"; bladId: string; id: string; verwijderGekoppeld?: boolean }
  | { type: "SPARING_BIJWERKEN"; bladId: string; id: string; patch: Partial<Sparing> }
  | { type: "BOORGAT_TOEVOEGEN"; bladId: string; boorgat: Boorgat }
  | { type: "BOORGAT_VERWIJDEREN"; bladId: string; id: string }
  | { type: "BOORGAT_BIJWERKEN"; bladId: string; id: string; patch: Partial<Boorgat> }
  | { type: "MATERIAAL_INSTELLEN"; keuze: MateriaalKeuze }
  | { type: "BLAD_MATERIAAL_OVERRIDE"; bladId: string; keuze: MateriaalKeuze | null }
  | { type: "RANDAFWERKING_BIJWERKEN"; bladId: string; randafwerking: Randafwerking }
  | { type: "RANDAFWERKING_VERWIJDEREN"; bladId: string; zijdeId: ZijdeId }
  | { type: "ACCESSOIRE_TOEVOEGEN"; regel: AccessoireRegel }
  | { type: "ACCESSOIRE_BIJWERKEN"; id: string; patch: Partial<AccessoireRegel> }
  | { type: "ACCESSOIRE_VERWIJDEREN"; id: string };

export function opnameReducer(state: Opname, action: OpnameAction): Opname {
  switch (action.type) {
    case "SET_VERKOPER":
      return { ...state, verkoper: action.payload };

    case "SET_INMETER":
      return {
        ...state,
        inmeting: {
          ...state.inmeting,
          inmeter: action.payload,
          datumInmeting: state.inmeting?.datumInmeting ?? state.datum,
          fotos: state.inmeting?.fotos ?? [],
          veldnotities: state.inmeting?.veldnotities ?? "",
        },
      };

    case "SET_MEETDATUM":
      return { ...state, datum: action.payload };

    case "SET_OPDRACHTGEVER": {
      const bijgewerkt: Adres = { ...state.opdrachtgever, ...action.payload };
      const nieuwState = { ...state, opdrachtgever: bijgewerkt };
      if (state.afleveradres.gelijkAanOpdrachtgever) {
        nieuwState.afleveradres = {
          ...state.afleveradres,
          naam: bijgewerkt.naam,
          straat: bijgewerkt.straat,
          postcodePlaats: bijgewerkt.postcodePlaats,
          email: bijgewerkt.email,
          telefoon: bijgewerkt.telefoon,
        };
      }
      return nieuwState;
    }

    case "SET_AFLEVERADRES":
      return {
        ...state,
        afleveradres: { ...state.afleveradres, ...action.payload },
      };

    case "SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER":
      if (action.payload) {
        return {
          ...state,
          afleveradres: {
            ...state.afleveradres,
            gelijkAanOpdrachtgever: true,
            naam: state.opdrachtgever.naam,
            straat: state.opdrachtgever.straat,
            postcodePlaats: state.opdrachtgever.postcodePlaats,
            email: state.opdrachtgever.email,
            telefoon: state.opdrachtgever.telefoon,
          },
        };
      }
      return {
        ...state,
        afleveradres: { ...state.afleveradres, gelijkAanOpdrachtgever: false },
      };

    case "SET_ETAGE":
      return {
        ...state,
        afleveradres: { ...state.afleveradres, etage: action.payload },
      };

    case "SET_KLANT_REGELT_LIFT":
      return {
        ...state,
        afleveradres: { ...state.afleveradres, klantRegeltLift: action.payload },
      };

    case "SET_UW_REFERENTIE":
      return { ...state, uwReferentie: action.payload };

    case "BLAD_TOEVOEGEN":
      return { ...state, bladen: [...state.bladen, action.blad] };

    case "BLAD_VERWIJDEREN":
      return { ...state, bladen: state.bladen.filter((b) => b.id !== action.id) };

    case "BLAD_BIJWERKEN":
      return {
        ...state,
        bladen: state.bladen.map((b) =>
          b.id === action.id ? { ...b, ...action.patch } : b
        ),
      };

    case "SEGMENT_SELECTEREN":
    case "SEGMENT_DESELECTEREN":
      return state;

    case "SPARING_TOEVOEGEN":
      return {
        ...state,
        bladen: state.bladen.map(b =>
          b.id === action.bladId
            ? { ...b, sparingen: [...(b.sparingen ?? []), action.sparing] }
            : b
        ),
      };

    case "SPARING_VERWIJDEREN":
      return {
        ...state,
        bladen: state.bladen.map(b => {
          if (b.id !== action.bladId) return b;
          const sparingen = (b.sparingen ?? []).filter(s => s.id !== action.id);
          let boorgaten = b.boorgaten ?? [];
          if (action.verwijderGekoppeld) {
            boorgaten = boorgaten.filter(bg => bg.gekoppeldAan?.sparingId !== action.id);
          } else {
            boorgaten = boorgaten.map(bg =>
              bg.gekoppeldAan?.sparingId === action.id
                ? { ...bg, gekoppeldAan: undefined }
                : bg
            );
          }
          const boorgatSchoon = boorgaten.map(bg =>
            bg.referentie?.type === "VORIGE_SPARING" && bg.referentie.sparingId === action.id
              ? { ...bg, referentie: undefined }
              : bg
          );
          const sparingenSchoon = sparingen.map(s =>
            s.referentie?.type === "VORIGE_SPARING" && s.referentie.sparingId === action.id
              ? { ...s, referentie: undefined }
              : s
          );
          return { ...b, sparingen: sparingenSchoon, boorgaten: boorgatSchoon };
        }),
      };

    case "SPARING_BIJWERKEN": {
      return {
        ...state,
        bladen: state.bladen.map(b => {
          if (b.id !== action.bladId) return b;
          const newSparings = (b.sparingen ?? []).map(s =>
            s.id === action.id ? { ...s, ...action.patch } : s
          );
          if (action.patch.positie) {
            const updated = newSparings.find(s => s.id === action.id);
            if (updated) {
              const newBoorgaten = (b.boorgaten ?? []).map(bg =>
                bg.gekoppeldAan?.sparingId === action.id
                  ? { ...bg, positie: { x: updated.positie.x + bg.gekoppeldAan.offsetX, y: updated.positie.y + bg.gekoppeldAan.offsetY } }
                  : bg
              );
              return { ...b, sparingen: newSparings, boorgaten: newBoorgaten };
            }
          }
          return { ...b, sparingen: newSparings };
        }),
      };
    }

    case "BOORGAT_TOEVOEGEN": {
      const gekoppeldSparingId = action.boorgat.gekoppeldAan?.sparingId;
      return {
        ...state,
        bladen: state.bladen.map(b => {
          if (b.id !== action.bladId) return b;
          // Prevent duplicate gekoppelde kraan per spoelbak (e.g. double-click on stap 4)
          if (gekoppeldSparingId && (b.boorgaten ?? []).some(bg => bg.gekoppeldAan?.sparingId === gekoppeldSparingId)) {
            return b;
          }
          return { ...b, boorgaten: [...(b.boorgaten ?? []), action.boorgat] };
        }),
      };
    }

    case "BOORGAT_BIJWERKEN":
      return {
        ...state,
        bladen: state.bladen.map(b =>
          b.id === action.bladId
            ? {
                ...b,
                boorgaten: (b.boorgaten ?? []).map(bg =>
                  bg.id === action.id ? { ...bg, ...action.patch } : bg
                ),
              }
            : b
        ),
      };

    case "BOORGAT_VERWIJDEREN": {
      return {
        ...state,
        bladen: state.bladen.map(b => {
          if (b.id !== action.bladId) return b;
          const verwijderd = (b.boorgaten ?? []).find(bg => bg.id === action.id);
          const resterend = (b.boorgaten ?? []).filter(bg => bg.id !== action.id);

          // Hernummer groep-leden na verwijdering
          const groepId = verwijderd?.groepId;
          let volgnummer = 1;
          const hernummerd = resterend.map(bg => {
            if (!groepId || bg.groepId !== groepId) return bg;
            return { ...bg, groepVolgnummer: volgnummer++ };
          });

          // Silent fix: verwijder referenties naar het verwijderde boorgat
          const schoongemaakt = hernummerd.map(bg =>
            bg.referentie?.type === "VORIG_BOORGAT" && bg.referentie.boorgatId === action.id
              ? { ...bg, referentie: undefined }
              : bg
          );
          const sparingenSchoon = (b.sparingen ?? []).map(s =>
            s.referentie?.type === "VORIG_BOORGAT" && s.referentie.boorgatId === action.id
              ? { ...s, referentie: undefined }
              : s
          );
          return { ...b, boorgaten: schoongemaakt, sparingen: sparingenSchoon };
        }),
      };
    }

    case "MATERIAAL_INSTELLEN":
      return { ...state, materiaalKeuze: action.keuze };

    case "BLAD_MATERIAAL_OVERRIDE":
      return {
        ...state,
        bladen: state.bladen.map(b =>
          b.id === action.bladId
            ? { ...b, materiaalKeuze: action.keuze ?? undefined }
            : b
        ),
      };

    case "RANDAFWERKING_BIJWERKEN":
      return {
        ...state,
        bladen: state.bladen.map(b => {
          if (b.id !== action.bladId) return b;
          const rest = (b.randafwerkingen ?? []).filter(r => r.zijdeId !== action.randafwerking.zijdeId);
          return { ...b, randafwerkingen: [...rest, action.randafwerking] };
        }),
      };

    case "RANDAFWERKING_VERWIJDEREN":
      return {
        ...state,
        bladen: state.bladen.map(b =>
          b.id === action.bladId
            ? { ...b, randafwerkingen: (b.randafwerkingen ?? []).filter(r => r.zijdeId !== action.zijdeId) }
            : b
        ),
      };

    case "ACCESSOIRE_TOEVOEGEN":
      return { ...state, accessoires: [...state.accessoires, action.regel] };

    case "ACCESSOIRE_BIJWERKEN":
      return {
        ...state,
        accessoires: state.accessoires.map(a =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      };

    case "ACCESSOIRE_VERWIJDEREN":
      return { ...state, accessoires: state.accessoires.filter(a => a.id !== action.id) };
  }
}
