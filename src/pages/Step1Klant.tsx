import { useState, useEffect } from "react";
import seedRaw from "../data/seed-data.json";
import type { SeedData } from "../data/seed-types";
import type { OpnameAction } from "../state/opnameReducer";
import type { Opname } from "../data/seed-types";
import { searchCustomers } from "../erpnext/customerSearch";
import type { CustomerSummary } from "../erpnext/customerSearch";
import { IN_YAPP_CONTEXT, callMethod } from "../bridge";

const seed = seedRaw as unknown as SeedData;

interface Props {
  state: Opname;
  dispatch: React.Dispatch<OpnameAction>;
}

type KlantModus = "bestaand" | "nieuw";

const inputKlasse =
  "w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

const labelKlasse = "block text-sm font-medium text-slate-700 mb-1";

export default function Step1Klant({ state, dispatch }: Props) {
  const [klantModus, setKlantModus] = useState<KlantModus>("bestaand");

  // — Zoeken —
  const [zoekQuery, setZoekQuery] = useState("");
  const [zoekResultaten, setZoekResultaten] = useState<CustomerSummary[]>([]);
  const [zoekLaden, setZoekLaden] = useState(false);
  const [zoekFout, setZoekFout] = useState<string | null>(null);

  // Inmeter default = ingelogde Y-App gebruiker
  useEffect(() => {
    if (!IN_YAPP_CONTEXT || state.inmeting?.inmeter) return;
    (async () => {
      try {
        const username = await callMethod<string>("frappe.auth.get_logged_user");
        try {
          const info = await callMethod<{ full_name?: string }>(
            "frappe.client.get_value",
            { doctype: "User", filters: { name: username }, fieldname: "full_name" }
          );
          dispatch({ type: "SET_INMETER", payload: info?.full_name ?? username });
        } catch {
          dispatch({ type: "SET_INMETER", payload: username });
        }
      } catch {
        // niet in Y-App context of methode niet beschikbaar — laat leeg
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced customer search
  useEffect(() => {
    if (zoekQuery.length < 2) { setZoekResultaten([]); return; }
    const timer = setTimeout(async () => {
      setZoekLaden(true);
      setZoekFout(null);
      try {
        setZoekResultaten(await searchCustomers(zoekQuery));
      } catch (e) {
        setZoekFout(e instanceof Error ? e.message : "Fout bij zoeken");
        setZoekResultaten([]);
      } finally {
        setZoekLaden(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [zoekQuery]);

  function selecteerKlant(klant: CustomerSummary) {
    dispatch({
      type: "SET_OPDRACHTGEVER",
      payload: {
        naam: klant.customer_name,
        straat: "",
        postcodePlaats: "",
        email: klant.email_id ?? undefined,
        telefoon: klant.mobile_no ?? undefined,
      },
    });
    setZoekQuery(klant.customer_name);
    setZoekResultaten([]);
  }

  const gelijkAanOpdrachtgever = state.afleveradres.gelijkAanOpdrachtgever;

  return (
    <div className="space-y-8">

      {/* Sectie A — Project & verkoper */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Project & verkoper</h2>

        <div>
          <label className={labelKlasse}>Verkoper</label>
          <select
            className={inputKlasse}
            value={state.verkoper.naam}
            onChange={(e) => {
              const v = seed.verkopers.find((v) => v.naam === e.target.value);
              if (v) dispatch({ type: "SET_VERKOPER", payload: { naam: v.naam, email: v.email, telefoon: seed.bedrijf.telefoon } });
            }}
          >
            {seed.verkopers.map((v) => (
              <option key={v.email} value={v.naam}>{v.naam}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelKlasse}>Inmeter</label>
          <input
            type="text"
            className={inputKlasse}
            placeholder="Naam inmeter"
            value={state.inmeting?.inmeter ?? ""}
            onChange={(e) => dispatch({ type: "SET_INMETER", payload: e.target.value })}
          />
        </div>

        <div>
          <label className={labelKlasse}>Meetdatum</label>
          <input
            type="date"
            className={inputKlasse}
            value={state.datum}
            onChange={(e) => dispatch({ type: "SET_MEETDATUM", payload: e.target.value })}
          />
        </div>

        <div>
          <label className={labelKlasse}>
            Uw referentie{" "}
            <span className="text-slate-400 font-normal">(optioneel)</span>
          </label>
          <input
            type="text"
            className={inputKlasse}
            placeholder="bv. ZIJLMANS - VAN VLIMMEREN"
            value={state.uwReferentie ?? ""}
            onChange={(e) => dispatch({ type: "SET_UW_REFERENTIE", payload: e.target.value })}
          />
        </div>
      </section>

      {/* Sectie B — Opdrachtgever */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Opdrachtgever</h2>

        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["bestaand", "nieuw"] as KlantModus[]).map((modus) => (
            <button
              key={modus}
              onClick={() => setKlantModus(modus)}
              className={[
                "flex-1 min-h-[44px] text-sm font-medium transition-colors",
                klantModus === modus ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {modus === "bestaand" ? "Bestaande klant" : "Nieuwe klant"}
            </button>
          ))}
        </div>

        {klantModus === "bestaand" ? (
          <div className="space-y-2">
            {!IN_YAPP_CONTEXT && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Geen Y-App context — zoeken werkt niet in standalone modus
              </p>
            )}
            <div className="relative">
              <input
                type="text"
                className={inputKlasse}
                placeholder="Zoek op klantnaam (min. 2 tekens)"
                value={zoekQuery}
                onChange={(e) => setZoekQuery(e.target.value)}
              />
              {zoekLaden && (
                <div className="absolute right-3 top-3">
                  <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {zoekFout && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{zoekFout}</p>
            )}
            {zoekResultaten.length > 0 && (
              <ul className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {zoekResultaten.map((k) => (
                  <li key={k.name}>
                    <button
                      onClick={() => selecteerKlant(k)}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors min-h-[44px]"
                    >
                      <span className="text-sm font-medium text-slate-800">{k.customer_name}</span>
                      {k.email_id && <span className="block text-xs text-slate-400">{k.email_id}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {zoekQuery.length >= 2 && !zoekLaden && zoekResultaten.length === 0 && !zoekFout && (
              <p className="text-sm text-slate-400 px-1">Geen klanten gevonden voor "{zoekQuery}"</p>
            )}
            {state.opdrachtgever.naam && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-medium text-teal-800">{state.opdrachtgever.naam}</p>
                {state.opdrachtgever.straat && (
                  <p className="text-xs text-teal-600">{state.opdrachtgever.straat}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(["naam", "straat", "postcodePlaats"] as const).map((veld) => (
              <div key={veld}>
                <label className={labelKlasse}>
                  {veld === "naam" ? "Naam" : veld === "straat" ? "Straat + huisnummer" : "Postcode + plaats"}
                </label>
                <input
                  type="text"
                  className={inputKlasse}
                  value={state.opdrachtgever[veld]}
                  onChange={(e) => dispatch({ type: "SET_OPDRACHTGEVER", payload: { [veld]: e.target.value } })}
                />
              </div>
            ))}
            <div>
              <label className={labelKlasse}>E-mail <span className="text-slate-400 font-normal">(optioneel)</span></label>
              <input
                type="email"
                className={inputKlasse}
                value={state.opdrachtgever.email ?? ""}
                onChange={(e) => dispatch({ type: "SET_OPDRACHTGEVER", payload: { email: e.target.value } })}
              />
            </div>
            <div>
              <label className={labelKlasse}>Telefoon <span className="text-slate-400 font-normal">(optioneel)</span></label>
              <input
                type="tel"
                className={inputKlasse}
                value={state.opdrachtgever.telefoon ?? ""}
                onChange={(e) => dispatch({ type: "SET_OPDRACHTGEVER", payload: { telefoon: e.target.value } })}
              />
            </div>

          </div>
        )}
      </section>

      {/* Sectie C — Afleveradres */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Afleveradres</h2>

        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded accent-teal-600"
            checked={gelijkAanOpdrachtgever}
            onChange={(e) => dispatch({ type: "SET_AFLEVER_GELIJK_AAN_OPDRACHTGEVER", payload: e.target.checked })}
          />
          <span className="text-sm text-slate-700">Afleveradres is gelijk aan opdrachtgever</span>
        </label>

        {!gelijkAanOpdrachtgever && (
          <div className="space-y-4 pt-2">
            {(["naam", "straat", "postcodePlaats"] as const).map((veld) => (
              <div key={veld}>
                <label className={labelKlasse}>
                  {veld === "naam" ? "Naam" : veld === "straat" ? "Straat + huisnummer" : "Postcode + plaats"}
                </label>
                <input
                  type="text"
                  className={inputKlasse}
                  value={state.afleveradres[veld]}
                  onChange={(e) => dispatch({ type: "SET_AFLEVERADRES", payload: { [veld]: e.target.value } })}
                />
              </div>
            ))}
          </div>
        )}

        {/* Etage — vrij tekstveld met seed-suggesties via datalist (niet opgeslagen in ERPNext) */}
        <div>
          <label className={labelKlasse}>Etage</label>
          <input
            type="text"
            list="etage-suggesties"
            className={inputKlasse}
            placeholder="Begane grond, 1e etage, ..."
            value={state.afleveradres.etage}
            onChange={(e) => dispatch({ type: "SET_ETAGE", payload: e.target.value })}
          />
          <datalist id="etage-suggesties">
            {seed.etages.map((e) => <option key={e} value={e} />)}
          </datalist>
        </div>

        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded accent-teal-600"
            checked={state.afleveradres.klantRegeltLift}
            onChange={(e) => dispatch({ type: "SET_KLANT_REGELT_LIFT", payload: e.target.checked })}
          />
          <span className="text-sm text-slate-700">Klant regelt lift indien nodig</span>
        </label>
      </section>

    </div>
  );
}
