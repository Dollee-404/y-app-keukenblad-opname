/**
 * Domeintypes voor de Keukenblad Opname extensie.
 * Gegenereerd op basis van seed-data.json (versie 1.0.0).
 *
 * Importeer als:
 *   import seed from './seed-data.json';
 *   import type { Opname, Blad, Sparing } from './seed-types';
 */

// ============================================================
// SEED-DATA SHAPE (komt 1-op-1 overeen met seed-data.json)
// ============================================================

export type SeedData = {
  versie: string;
  gegenereerd_op: string;
  bron: string;
  bedrijf: Bedrijf;
  verkopers: Verkoper[];
  montagepartners: Montagepartner[];
  materialen: Record<MateriaalCode, MateriaalDef>;
  materiaal_afkortingen: Record<MateriaalCode, string>;
  producenten: ProducentCode[];
  afwerkingen: AfwerkingCode[];
  diktes_mm: number[];
  zichtzijden: ZichtzijdeDef[];
  werkstukken: WerkstukType[];
  werkstuk_categorieen: Record<WerkstukCategorieCode, WerkstukCategorieDef>;
  sparing_typen: SparingTypeDef[];
  boorgat_doelen: BoorgatDoel[];
  inbouwwijzen: InbouwwijzeDef[];
  producten_kookplaten: KookplaatProduct[];
  producten_spoelbakken: SpoelbakProduct[];
  accessoires: AccessoireType[];
  randafwerking_codes: RandafwerkingDef[];
  accessoires_catalogus: AccessoireCatalogusItem[];
  kleuren_accessoires: string[];
  etages: string[];
  mlp_statussen: MLPStatus[];
  clausules: Record<string, string>;
  betalingsregelingen: string[];
  productie_routes: string[];
};

// ============================================================
// CODES & ENUMS (string-literal unions)
// ============================================================

export type MateriaalCode =
  | 'DEKTON' | 'SILESTONE' | 'COMPOSIET' | 'KWARTSCOMPOSIET'
  | 'KERAMIEK' | 'NATUURSTEEN' | 'KWARTSIET' | 'SOFT_KWARTSIET'
  | 'GRANIET' | 'MARMER' | 'NEOLITH';

export type ProducentCode =
  | 'CAESARSTONE' | 'COSENTINO' | 'DIRESCO' | 'MARAZZI' | 'NEOLITH'
  | 'SILESTONE' | 'TECHNISTONE' | 'TUIJTELAARS' | 'VASTO';

export type AfwerkingCode =
  | 'ANTICATO' | 'GEPOLIJST' | 'GEZOET' | 'GLANS' | 'LEATHER' | 'MAT'
  | 'POLIS' | 'RIVERWASHED' | 'SATIN' | 'SATINATO' | 'SILK' | 'SUÉDE'
  | 'ULTRASOFT' | 'VELVET' | 'GEPOLIJST OF LEATHER' | 'GEPOLIJST OF MAT'
  | 'GEPOLIJST - GLANS' | 'GLANS - GEZOET' | 'GEPOLIJST - MAT' | 'GEBORSTELD';

export type Dikte = 6 | 8 | 12 | 13 | 20 | 30;

export type ZichtzijdeCode =
  | 'A1-12' | 'A1-20' | 'A1-DF' | 'A1-DKF'
  | 'T1-EF'
  | 'DV20' | 'DV30' | 'DV32' | 'DV38' | 'DV40' | 'DV42'
  | 'DV50' | 'DV60' | 'DV70' | 'DV80' | 'DV90' | 'DV100'
  | 'GEFRIJND' | 'WATERKERING' | 'KF' | 'VERSTEK';

export type WerkstukType =
  | 'Bladdeel A' | 'Bladdeel B' | 'Bladdeel C' | 'Bladdeel D'
  | 'Bladdeel E' | 'Bladdeel F' | 'Bladdeel G' | 'Bladdeel H'
  | 'Spatplint' | 'Plint' | 'Wand' | 'Achterwand'
  | 'Vensterbank' | 'Stol' | 'Schijnstol' | 'Schopplaat'
  | 'Plafondplaat' | 'Zijwanden' | 'Planchet'
  | 'Wastafelblad' | 'Tafelblad' | 'Openhaardplateau' | 'Eiland';

export type WerkstukCategorieCode = 'WB' | 'RW' | 'VB' | 'PL' | 'ST' | 'OV';

export type SparingTypeCode = 'BOORGAT' | 'SPOELBAK' | 'KOOKPLAAT' | 'KOOF' | 'KOLOM' | 'HOEK';

export type BoorgatDoelCode = 'KRAAN' | 'QUOOKER' | 'ELEKTRA' | 'DUBBELE_WCD' | 'ZEEPPOMP' | 'DOWNDRAFT' | 'DOORVOER' | 'OVERIG';

export type InbouwwijzeCode = 'VLAKBOUW' | 'ONDERBOUW' | 'OPBOUW' | 'NIS' | 'VERSTEK';

export type AccessoireType =
  | 'Spoelbak' | 'Kraan' | 'Quooker' | 'Zeeppomp'
  | 'Stroomvoorziening' | 'Downdraft' | 'Overig';

export type MLPStatus = 'Ja' | 'Nee' | 'In overleg' | 'Ja, datum:' | 'Af fabriek' | 'N.v.t.';

// ============================================================
// SEED-DATA DEFINITIES
// ============================================================

export type Bedrijf = {
  naam: string;
  handelsnaam_van: string;
  adres: string;
  telefoon: string;
  email: string;
  website: string;
  iban: string;
  bic: string;
  kvk: string;
  btw: string;
  btw_percentage: number;
};

export type Verkoper = {
  naam: string;
  email: string;
  default: boolean;
};

export type Montagepartner = {
  naam: string;
  adres: string;
  contact: string;
  email: string;
  telefoon: string;
};

export type MateriaalDef = {
  label: string;
  kleuren: string[];
};

export type ZichtzijdeDef = {
  code: ZichtzijdeCode;
  label: string;
  type: 'facet_blad' | 'facet_rugwand' | 'verstek' | 'profiel' | 'waterkering' | 'klein_facet' | 'verstek_naad';
  dikte?: number;
  hoogte?: number;
  beschrijving?: string;
};

export type WerkstukCategorieDef = {
  label: string;
  werkstukken: WerkstukType[];
  code: WerkstukCategorieCode;
};

export type SparingTypeDef = {
  code: SparingTypeCode;
  label: string;
  geometrie: 'cirkel' | 'rechthoek';
  vereist_diameter: boolean;
};

export type BoorgatDoel = {
  code: BoorgatDoelCode;
  label: string;
  default_diameter_mm: number | null;
};

export type MaatReferentie =
  | { type: 'LINKSONDER' }
  | { type: 'LINKERRAND'; offsetVanaf: 'onder' | 'boven' }
  | { type: 'RECHTERRAND'; offsetVanaf: 'onder' | 'boven' }
  | { type: 'MIDDEN_BLAD' }
  | { type: 'VORIGE_SPARING'; sparingId: string }
  | { type: 'VORIG_BOORGAT'; boorgatId: string };

export type Boorgat = {
  id: string;
  bladId: string;
  doel: BoorgatDoelCode;
  diameter: number;
  doorboring: boolean;
  positie: Point;
  referentie?: MaatReferentie;
  groepId?: string;
  groepVolgnummer?: number;
  notitie?: string;
  gekoppeldAan?: {
    type: 'SPOELBAK' | 'KOOKPLAAT';
    sparingId: string;
    offsetX: number;
    offsetY: number;
  };
};

export type InbouwwijzeDef = {
  code: InbouwwijzeCode;
  label: string;
  waarschuwing?: string;
};

export type KookplaatProduct = {
  merk: string;
  model: string;
  inbouwwijze: InbouwwijzeCode;
  sparing_boven_mm: [number, number];
  sparing_onder_mm: [number, number];
  radius_mm: number;
  trede_mm: number;
  opmerking?: string;
};

export type SpoelbakProduct = {
  merk: string;
  model: string;
  inbouwwijze: InbouwwijzeCode;
  sparing_boven_mm: [number, number];
  sparing_onder_mm: [number, number];
  radius_mm: number;
  trede_mm: number;
  opmerking?: string;
};

// ============================================================
// OPNAME-MODEL (hoofd-datatype dat de extensie produceert)
// ============================================================

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type FileRef = {
  id: string;          // ERPNext file id van bridge.uploadFile()
  filename: string;
  url?: string;        // optioneel, voor preview
};

export type Adres = {
  naam: string;
  straat: string;
  postcodePlaats: string;
  email?: string;
  telefoon?: string;
};

export type Opname = {
  // METADATA
  ordernummer: string;                  // bv "09-250226-BAKKER-ALBLASSERDAM"
  datum: string;                        // ISO date
  type: 'OFFERTE' | 'OPDRACHTBEVESTIGING';
  status: 'CONCEPT' | 'INGEDIEND' | 'GOEDGEKEURD' | 'IN_PRODUCTIE' | 'GELEVERD';
  verkoper: { naam: string; email: string; telefoon: string };

  // KLANT — opdrachtgever betaalt, afleveradres is bouwplaats
  opdrachtgever: Adres;
  afleveradres: Adres & {
    gelijkAanOpdrachtgever: boolean;     // "IDEM"
    etage: string;                       // uit seed.etages
    klantRegeltLift: boolean;
  };
  uwReferentie?: string;                 // bv "ZIJLMANS - VAN VLIMMEREN"

  // MATERIAAL (project-default, kan per blad overschreven worden)
  materiaal: {
    soort: MateriaalCode;
    producent: ProducentCode;
    afwerking: AfwerkingCode;
    kleur: string;                       // type/kleur uit materialen[soort].kleuren
    bijzonderheden?: string;
  };
  materiaalKeuze?: MateriaalKeuze; // sprint-4 project-level materiaal (structured form)

  // BLADEN
  bladen: Blad[];

  // SPARINGEN op project-niveau (refereren naar blad-id)
  sparingen: Sparing[];

  // ACCESSOIRES
  accessoires: AccessoireRegel[];

  // SERVICES
  meting: ServiceStap;
  levering: ServiceStap;
  plaatsing: ServiceStap;
  plaatsingExclusief?: string[];         // bv ["loodgieterswerk", "aansluiten apparatuur"]

  // PRIJS (optioneel — kan ook achteraf)
  prijs?: PrijsBlock;
  betaling?: string;                     // uit seed.betalingsregelingen

  // INMETING (de fysieke opname zelf — niet in Excel)
  inmeting?: {
    inmeter: string;
    datumInmeting: string;
    fotos: FileRef[];
    veldnotities: string;
    schetsAchtergrond?: FileRef;
    handtekeningKlant?: FileRef;
  };

  // VERSTEK-RELATIES
  verstekRelaties?: VerstekRelatie[];

  // VRIJ TEKSTVELD
  bijzonderheden: string;
  geactiveerdeClausules: string[];       // keys uit seed.clausules
};

export type Blad = {
  id: string;                             // "P1", "P2"...
  label: string;                          // "BLAD A", "ACHTERWAND"
  werkstukType: WerkstukType;
  categorie: WerkstukCategorieCode;       // WB / RW / VB / PL / ST / OV

  // afmetingen (bounding box; voor rechthoekige stukken volstaat dit)
  lengte: number;                         // mm
  breedte: number;                        // mm
  dikte: Dikte;                           // mm (kan afwijken van materiaal-default)

  // optionele override van materiaal-eigenschappen
  materiaalOverride?: Partial<Opname['materiaal']>;
  materiaalKeuze?: MateriaalKeuze;     // sprint-4 per-blad materiaal override
  randafwerkingen?: Randafwerking[];   // sprint-4 per-zijde randafwerking
  materiaalcodeOverride?: string;      // bv "20DV40" — automatische afleiding volgt later
  // Werkplaats-PDF altijd portrait (Vasto-conventie). Override hier voor uitzonderingen.
  orientation?: 'portrait' | 'landscape';

  // geometrie (alleen invullen als niet-rechthoekig)
  outline?: Point[];                      // polygoon in lokale mm-coords (0,0 = linksonder)
  overhang?: Rect;

  // randafwerking per zijde
  randen: Rand[];

  // sparingen op dit blad (kookplaat, spoelbak, vrije rechthoek)
  sparingen?: Sparing[];

  // boorgaten op dit blad (kraan, elektra, etc.)
  boorgaten?: Boorgat[];

  // L-vorm hoekuitsparingen
  hoekuitsparingen?: Rect[];

  // afgeleide productcode (bv "COM20WB") — kan ook on-the-fly worden berekend
  productCode?: string;
};

export type Rand = {
  zijde: 'voorkant' | 'achterkant' | 'links' | 'rechts' | number;  // number = segmentindex
  zichtzijde: ZichtzijdeCode;
  lengteMm?: number;                      // afgeleid uit blad-afmetingen
  inVerstekMet?: string;                  // id van aansluitend blad
  notitie?: string;                       // "Schuine zijde", "Koppelnaad", "IN VERSTEK MET ACHTERWAND"
};

// Sprint 4 additions
export type MateriaalKeuze = {
  soort: MateriaalCode;
  dikte_mm: number;
  kleur_code: string;
  kleur_label: string;
  leverancier?: string;
};

export type ZijdeId = string;

export type RandafwerkingType = 'GEEN' | 'FACET' | 'VERSTEK';

export type Randafwerking = {
  zijdeId: ZijdeId;
  code: string;
  label: string;
  type: RandafwerkingType;
  hoogte_mm?: number;
  verstek?: boolean;
};

export type VerstekRelatie = {
  id: string;
  bladA_id: string;
  zijdeA_id: ZijdeId;
  bladB_id: string;
  zijdeB_id: ZijdeId;
  hoek_graden: number;
  notitie?: string;
};

export type AccessoireRegel = {
  id: string;
  sku?: string;
  naam: string;
  aantal: number;
  kleur_code?: string;
  notitie?: string;
};

export type RandafwerkingDef = {
  code: string;
  label: string;
  type: RandafwerkingType;
  hoogte_mm?: number;
};

export type AccessoireCatalogusItem = {
  sku: string;
  naam: string;
  eenheid: string;
  default_aantal: number;
};

export type Sparing = {
  id: string;
  type: SparingTypeCode;
  bladId: string;
  inbouwwijze: InbouwwijzeCode;

  // referentie naar productcatalogus
  productMerk?: string;
  productModel?: string;

  // positie midden van sparing, vanaf linksonder blad (mm)
  positie: Point;

  // afmetingen rechthoek (bij vlakbouw: de boven-maten)
  breedte: number;
  hoogte: number;

  // vlakbouw extra (dubbele lijn: boven + onder)
  vlakbouw?: {
    breedteOnder: number;
    hoogteOnder: number;
    radiusMm: number;
    tredeMm: number;
  };

  // hoekafronding (niet-vlakbouw)
  radiusMm?: number;

  referentie?: MaatReferentie;
  notitie?: string;
};

export type Accessoire = {
  type: AccessoireType;
  aantal: number;
  omschrijving: string;                   // bv "50SP (50x40)" of "Caressi CAPP50R10 C60"
  kleur?: string;
  prijs?: number | 'INBEGREPEN';
};

export type ServiceStap = {
  uitvoeren: boolean;
  status?: MLPStatus;
  datum?: string;
  toelichting?: string;
};

export type PrijsBlock = {
  blad?: number | 'INBEGREPEN';
  accessoires?: number | 'INBEGREPEN';
  metingLeveringMontage?: number | 'INBEGREPEN';
  totaalExclBTW?: number;
  btwPercentage: number;
  totaalInclBTW?: number;
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Genereert de Vasto/KBF productcode zoals "COM20WB", "COM20RW".
 * Patroon: [MAT-AFK][DIKTE][CATEGORIE]
 */
export function bouwProductCode(
  materiaal: MateriaalCode,
  dikte: Dikte,
  categorie: WerkstukCategorieCode,
  seed: SeedData
): string {
  const afk = seed.materiaal_afkortingen[materiaal];
  return `${afk}${dikte}${categorie}`;
}

/**
 * Bepaalt automatisch de werkstuk-categorie op basis van het werkstuk-type.
 */
export function categorieVoorWerkstuk(
  ws: WerkstukType,
  seed: SeedData
): WerkstukCategorieCode {
  for (const [code, def] of Object.entries(seed.werkstuk_categorieen)) {
    if (def.werkstukken.includes(ws)) return code as WerkstukCategorieCode;
  }
  return 'OV';
}

/**
 * Geeft alle kleuren voor een materiaal terug.
 */
export function kleurenVoorMateriaal(
  m: MateriaalCode,
  seed: SeedData
): string[] {
  return seed.materialen[m]?.kleuren ?? [];
}

/**
 * Berekent oppervlakte (m²) van een blad — voor automatische
 * Quotation-regelgeneratie in ERPNext.
 */
export function oppervlakteM2(blad: Blad): number {
  return (blad.lengte * blad.breedte) / 1_000_000;
}

/**
 * Berekent totale randlengte (strekkende meter) per zichtzijde-code,
 * over alle bladen — voor Quotation-regels per randafwerking.
 */
export function randlengtePerZichtzijde(opname: Opname): Record<string, number> {
  const totalen: Record<string, number> = {};
  for (const blad of opname.bladen) {
    for (const rand of blad.randen) {
      if (rand.lengteMm == null) continue;
      totalen[rand.zichtzijde] = (totalen[rand.zichtzijde] ?? 0) + rand.lengteMm / 1000;
    }
  }
  return totalen;
}

/**
 * Detecteert of opname een vlakbouw kookplaat bevat — voor het tonen
 * van de waarschuwing uit de clausules.
 */
export function heeftVlakbouwKookplaat(opname: Opname): boolean {
  return opname.sparingen.some(
    s => s.type === 'KOOKPLAAT' && s.inbouwwijze === 'VLAKBOUW'
  );
}

/**
 * Default opname-skeleton voor een nieuwe opname.
 */
export function legeOpname(seed: SeedData): Opname {
  const defaultVerkoper = seed.verkopers.find(v => v.default) ?? seed.verkopers[0];
  return {
    ordernummer: '',
    datum: new Date().toISOString().split('T')[0],
    type: 'OPDRACHTBEVESTIGING',
    status: 'CONCEPT',
    verkoper: {
      naam: defaultVerkoper.naam,
      email: defaultVerkoper.email,
      telefoon: seed.bedrijf.telefoon,
    },
    opdrachtgever: { naam: '', straat: '', postcodePlaats: '' },
    afleveradres: {
      naam: '', straat: '', postcodePlaats: '',
      gelijkAanOpdrachtgever: true,
      etage: 'BEGANE GROND',
      klantRegeltLift: false,
    },
    materiaal: {
      soort: 'COMPOSIET',
      producent: 'VASTO',
      afwerking: 'GEPOLIJST',
      kleur: '',
    },
    bladen: [],
    sparingen: [],
    accessoires: [],
    meting:    { uitvoeren: false },
    levering:  { uitvoeren: false },
    plaatsing: { uitvoeren: false },
    bijzonderheden: '',
    geactiveerdeClausules: [],
  };
}
