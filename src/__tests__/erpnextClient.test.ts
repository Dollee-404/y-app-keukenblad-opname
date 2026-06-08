import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  fetchDocument,
  fetchList,
  createDocument,
  updateDocument,
  callMethod,
} from "../erpnextClient";

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    statusText: "",
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  (window as unknown as { csrf_token: string }).csrf_token = "TOK-123";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("erpnextClient — GET", () => {
  it("fetchDocument haalt /api/resource/{doctype}/{name} op en geeft data terug", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { name: "QTN-001", status: "Draft" } }));

    const doc = await fetchDocument<{ name: string }>("Quotation", "QTN-001");

    expect(doc).toEqual({ name: "QTN-001", status: "Draft" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/resource/Quotation/QTN-001");
    expect((init as RequestInit).method ?? "GET").toBe("GET");
    expect((init as RequestInit).credentials).toBe("include");
  });

  it("fetchList serialiseert filters + fields als JSON-querystring en geeft data-array terug", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ name: "C1" }] }));

    const rows = await fetchList<{ name: string }>("Customer", {
      fields: ["name"],
      filters: [["customer_name", "like", "%jan%"]],
      limit_page_length: 20,
    });

    expect(rows).toEqual([{ name: "C1" }]);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/resource/Customer");
    expect(decodeURIComponent(url)).toContain('["customer_name","like","%jan%"]');
    expect(decodeURIComponent(url)).toContain('["name"]');
    expect(url).toContain("limit_page_length=20");
  });
});

describe("erpnextClient — schrijf-calls + CSRF", () => {
  it("createDocument POST naar /api/resource/{doctype} met X-Frappe-CSRF-Token-header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { name: "QTN-NEW" } }));

    const res = await createDocument<{ name: string }>("Quotation", { party_name: "Jan" });

    expect(res).toEqual({ name: "QTN-NEW" });
    const [url, init] = fetchMock.mock.calls[0];
    const r = init as RequestInit;
    expect(url).toContain("/api/resource/Quotation");
    expect(r.method).toBe("POST");
    expect(r.credentials).toBe("include");
    expect((r.headers as Record<string, string>)["X-Frappe-CSRF-Token"]).toBe("TOK-123");
    expect(JSON.parse(r.body as string)).toEqual({ party_name: "Jan" });
  });

  it("updateDocument PUT naar /api/resource/{doctype}/{name} met CSRF-header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: { name: "QTN-001" } }));

    await updateDocument("Quotation", "QTN-001", { status: "Open" });

    const [url, init] = fetchMock.mock.calls[0];
    const r = init as RequestInit;
    expect(url).toContain("/api/resource/Quotation/QTN-001");
    expect(r.method).toBe("PUT");
    expect((r.headers as Record<string, string>)["X-Frappe-CSRF-Token"]).toBe("TOK-123");
  });

  it("callMethod POST naar /api/method/{method} en geeft message terug", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "admin@example.com" }));

    const user = await callMethod<string>("frappe.auth.get_logged_user");

    expect(user).toBe("admin@example.com");
    const [url, init] = fetchMock.mock.calls[0];
    const r = init as RequestInit;
    expect(url).toContain("/api/method/frappe.auth.get_logged_user");
    expect(r.method).toBe("POST");
    expect((r.headers as Record<string, string>)["X-Frappe-CSRF-Token"]).toBe("TOK-123");
  });
});

describe("erpnextClient — foutafhandeling", () => {
  it("gooit Error met statuscode bij non-2xx (geen stil slikken)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ exception: "DoesNotExistError" }, { status: 404 }),
    );

    await expect(fetchDocument("Quotation", "BESTAAT-NIET")).rejects.toThrow("404");
  });

  it("neemt _server_messages op in de foutmelding", async () => {
    const serverMessages = JSON.stringify([JSON.stringify({ message: "Niet toegestaan" })]);
    fetchMock.mockResolvedValue(
      jsonResponse({ _server_messages: serverMessages }, { status: 403 }),
    );

    await expect(callMethod("ping")).rejects.toThrow("Niet toegestaan");
  });
});
