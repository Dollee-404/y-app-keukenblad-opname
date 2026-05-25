import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import App from "../App";
import seedRaw from "../data/seed-data.json";
import { legeOpname } from "../data/seed-types";
import type { SeedData, Opname } from "../data/seed-types";

// Bridge volledig mocken — geen Y-App context nodig voor deze tests
vi.mock("../bridge", () => ({
  IN_YAPP_CONTEXT: false,
  HOST_ORIGIN: "*",
  INSTANCE_ID: "",
  ERPNEXT_URL: "",
  LANG: "nl",
  fetchList: vi.fn().mockResolvedValue([]),
  fetchDocument: vi.fn().mockResolvedValue({}),
  createDocument: vi.fn().mockResolvedValue({ name: "TEST-MOCK-001" }),
  updateDocument: vi.fn().mockResolvedValue({}),
  callMethod: vi.fn().mockResolvedValue(null),
  fetchPrivateFile: vi.fn().mockResolvedValue(new Blob()),
  getActiveInstanceId: vi.fn().mockReturnValue(""),
  getErpNextAppUrl: vi.fn().mockReturnValue("https://erp.test"),
  fetchAll: vi.fn().mockResolvedValue([]),
}));

const seed = seedRaw as unknown as SeedData;
const CONCEPT_KEY = "kbf-opname-concept-v1";

function maakOpnameMetBladen(aantal: number, extra?: Partial<Opname>): Opname {
  const base = legeOpname(seed);
  base.opdrachtgever = { naam: "Test Klant", straat: "Teststraat 1", postcodePlaats: "1234 AB" };
  for (let i = 0; i < aantal; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (base.bladen as any[]).push({
      id: `test-blad-${i}`,
      label: `Bladdeel ${String.fromCharCode(65 + i)}`,
      werkstukType: "Bladdeel A",
      categorie: "WB",
      lengte: 1958,
      breedte: 800,
      dikte: 20,
      randen: [],
      randafwerkingen: [],
      sparingen: [],
    });
  }
  return { ...base, ...extra };
}

function zetConceptInStorage(opname: Opname, verzonden: boolean) {
  localStorage.setItem(
    CONCEPT_KEY,
    JSON.stringify({ opname, versie: 1, verzonden, laatstGewijzigd: new Date().toISOString() })
  );
}

async function navigeerNaarStep4() {
  fireEvent.click(screen.getByRole("button", { name: /4 overzicht/i }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /werkplaatstekening/i })).toBeInTheDocument()
  );
}

// ─── Scenario 4 — "Nieuwe opname" knop met confirm ───────────────────────────

describe("Scenario 4 — Nieuwe opname met confirm", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("annuleren: confirm=false behoudt concept en bladen in localStorage", async () => {
    zetConceptInStorage(maakOpnameMetBladen(2), false);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/concept hervat/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /nieuw/i }));

    expect(window.confirm).toHaveBeenCalled();
    const stored = localStorage.getItem(CONCEPT_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).opname.bladen).toHaveLength(2);
  });

  it("bevestigen: confirm=true wist localStorage en toont schone stap 1", async () => {
    zetConceptInStorage(maakOpnameMetBladen(2), false);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/concept hervat/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /nieuw/i }));

    // wisConcept() is synchroon — direct na click leeg
    expect(localStorage.getItem(CONCEPT_KEY)).toBeNull();
    // Stap 1 actief → TopBar toont "geen klant"
    expect(screen.getByText(/nog geen klant/i)).toBeInTheDocument();
  });
});

// ─── Scenario 5 — Verzonden-banner bij hervatten ──────────────────────────────

describe("Scenario 5 — Verzonden-banner", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("toont banner met quotationName als verzonden=true", async () => {
    const opname = maakOpnameMetBladen(1, { quotationName: "SAL-QTN-2026-0042" });
    zetConceptInStorage(opname, true);

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/opname hervat/i)).toBeInTheDocument()
    );

    await navigeerNaarStep4();

    expect(screen.getByText(/reeds verzonden als Quotation/i)).toBeInTheDocument();
    expect(screen.getByText("SAL-QTN-2026-0042")).toBeInTheDocument();
  });

  it("toont GEEN banner als verzonden=false", async () => {
    zetConceptInStorage(maakOpnameMetBladen(1), false);

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/concept hervat/i)).toBeInTheDocument()
    );

    await navigeerNaarStep4();

    expect(screen.queryByText(/reeds verzonden/i)).not.toBeInTheDocument();
  });

  it("ERPNext-knop toont 'Bijwerken' als quotationName aanwezig is", async () => {
    const opname = maakOpnameMetBladen(1, { quotationName: "SAL-QTN-2026-0042" });
    zetConceptInStorage(opname, true);

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/opname hervat/i)).toBeInTheDocument()
    );

    await navigeerNaarStep4();

    expect(screen.getByRole("button", { name: /bijwerken in erpnext/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^verzenden naar erpnext$/i })).not.toBeInTheDocument();
  });
});

// ─── Scenario 6 — Verzonden-banner verdwijnt na nieuwe opname ────────────────

describe("Scenario 6 — Nieuwe opname wist verzonden-banner", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("na bevestigen '+ Nieuw': banner weg, localStorage leeg, stap 1 actief", async () => {
    const opname = maakOpnameMetBladen(1, { quotationName: "SAL-QTN-2026-0042" });
    zetConceptInStorage(opname, true);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/opname hervat/i)).toBeInTheDocument()
    );

    await navigeerNaarStep4();
    expect(screen.getByText(/reeds verzonden als Quotation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /nieuw/i }));

    // Synchroon: localStorage gewist, step 1, banner weg
    expect(localStorage.getItem(CONCEPT_KEY)).toBeNull();
    expect(screen.queryByText(/reeds verzonden/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nog geen klant/i)).toBeInTheDocument();
  });
});
