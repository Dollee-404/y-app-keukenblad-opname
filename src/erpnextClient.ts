/**
 * ERPNext REST-client — same-origin, met de Frappe-sessiecookie.
 *
 * Vervangt de oude Y-App `postMessage`-bridge: de opname draait nu zelf op een
 * Frappe-route (`/opname`, zie T2) en praat rechtstreeks met de REST-API i.p.v.
 * via een host-iframe. De publieke interface is bewust identiek aan `bridge.ts`
 * gebleven (fetchList/fetchDocument/updateDocument/callMethod/createDocument/
 * fetchPrivateFile/fetchAll + ListParams) zodat de rest van de opname ongewijzigd
 * blijft werken.
 *
 * Auth: GEEN eigen credentials. De browser stuurt de Frappe-sessiecookie mee via
 * `credentials: "include"`. Voor schrijf-calls (POST/PUT/DELETE) eist Frappe een
 * geldig CSRF-token; dat wordt geïnjecteerd als `window.csrf_token` door
 * `www/opname.html` (boot-loop) en hier meegestuurd als `X-Frappe-CSRF-Token`.
 */

// ─── ERPNext list queries ────────────────────────────────────────────────────

export interface ListParams {
  fields?: string[];
  filters?: unknown[][];
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}

/** CSRF-token dat www/opname.html als window.csrf_token injecteert. */
function csrfToken(): string {
  return (window as unknown as { csrf_token?: string }).csrf_token ?? "";
}

/**
 * Verwerkt een fetch-response. Bij non-2xx gooit hij een nette Error met de
 * statuscode én — indien aanwezig — de Frappe-foutdetails (`_server_messages` /
 * `exception` / `message`). Niets wordt stil geslikt.
 */
async function verwerk<T>(res: Response, sleutel: "data" | "message"): Promise<T> {
  if (res.ok) {
    const body = (await res.json()) as Record<string, unknown>;
    return body[sleutel] as T;
  }

  let detail = res.statusText || "";
  try {
    const body = (await res.json()) as Record<string, unknown>;
    if (typeof body._server_messages === "string") {
      const berichten = JSON.parse(body._server_messages) as string[];
      detail = berichten
        .map((m) => {
          try {
            return (JSON.parse(m) as { message?: string }).message ?? m;
          } catch {
            return m;
          }
        })
        .join("; ");
    } else if (typeof body.exception === "string") {
      detail = body.exception;
    } else if (typeof body.message === "string") {
      detail = body.message;
    }
  } catch {
    // body is geen JSON — laat detail op statusText staan
  }

  throw new Error(`ERPNext API error: ${res.status}${detail ? ` — ${detail}` : ""}`);
}

/** Headers voor een schrijf-call: JSON + CSRF-token. */
function schrijfHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Frappe-CSRF-Token": csrfToken(),
  };
}

export async function fetchList<T>(doctype: string, listParams?: ListParams): Promise<T[]> {
  const qs = new URLSearchParams();
  if (listParams?.fields) qs.set("fields", JSON.stringify(listParams.fields));
  if (listParams?.filters) qs.set("filters", JSON.stringify(listParams.filters));
  if (listParams?.limit_page_length != null)
    qs.set("limit_page_length", String(listParams.limit_page_length));
  if (listParams?.limit_start != null)
    qs.set("limit_start", String(listParams.limit_start));
  if (listParams?.order_by) qs.set("order_by", listParams.order_by);

  const res = await fetch(`/api/resource/${encodeURIComponent(doctype)}?${qs}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return verwerk<T[]>(res, "data");
}

export async function fetchDocument<T>(doctype: string, name: string): Promise<T> {
  const res = await fetch(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );
  return verwerk<T>(res, "data");
}

export async function updateDocument<T>(
  doctype: string,
  name: string,
  data: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      credentials: "include",
      headers: schrijfHeaders(),
      body: JSON.stringify(data),
    },
  );
  return verwerk<T>(res, "data");
}

export async function callMethod<T>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`/api/method/${method}`, {
    method: "POST",
    credentials: "include",
    headers: schrijfHeaders(),
    body: JSON.stringify(args),
  });
  return verwerk<T>(res, "message");
}

/** Nieuw document aanmaken via de REST-resource-endpoint. */
export async function createDocument<T>(
  doctype: string,
  doc: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    credentials: "include",
    headers: schrijfHeaders(),
    body: JSON.stringify(doc),
  });
  return verwerk<T>(res, "data");
}

/** Privé-bestand ophalen als base64. Retourneert { contentType, base64 }. */
export async function fetchPrivateFile(
  filePath: string,
): Promise<{ contentType: string; base64: string }> {
  const res = await fetch(filePath, { method: "GET", credentials: "include" });
  if (!res.ok) {
    throw new Error(`ERPNext API error: ${res.status} — bestand ${filePath}`);
  }
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const buffer = await res.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { contentType, base64: btoa(binary) };
}

// ─── Same-origin helpers (vervangen de oude Y-App URL-params) ────────────────

/**
 * Of de opname met ERPNext kan praten. Same-origin + sessiecookie is altijd
 * "verbonden"; de oude Y-App-context-check vervalt. Behouden als export zodat
 * bestaande call-sites (Step1Klant) ongewijzigd blijven.
 */
export const IN_YAPP_CONTEXT = true;

/** Basis-URL van de ERPNext-site die deze app serveert (same-origin). */
export function getErpNextAppUrl(): string {
  return window.location.origin;
}

/** Paginerende fetchList — haalt alle records op ongeacht aantal. */
export async function fetchAll<T>(
  doctype: string,
  fields: string[],
  filters: unknown[][] = [],
  orderBy = "modified desc",
  pageSize = 500,
): Promise<T[]> {
  const all: T[] = [];
  let start = 0;
  while (true) {
    const batch = await fetchList<T>(doctype, {
      fields,
      filters,
      order_by: orderBy,
      limit_page_length: pageSize,
      limit_start: start,
    });
    all.push(...batch);
    if (batch.length < pageSize) break;
    start += pageSize;
  }
  return all;
}
