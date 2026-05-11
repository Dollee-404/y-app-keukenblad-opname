import seedRaw from "../data/seed-data.json";
import { legeOpname } from "../data/seed-types";
import type { SeedData, Opname, Adres, Blad } from "../data/seed-types";

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
  | { type: "BLAD_BIJWERKEN"; id: string; patch: Partial<Blad> };

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
  }
}
