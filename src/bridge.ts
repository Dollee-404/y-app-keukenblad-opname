/**
 * Bridge naar Y-App host via postMessage RPC.
 *
 * Wire protocol (versie 1 — conform ExtensionHost.tsx):
 *   extensie → parent  { id, type: "yapp-ext.rpc",       method, args }
 *   parent → extensie  { id, type: "yapp-ext.rpc.reply", ok: true,  result }
 *                    | { id, type: "yapp-ext.rpc.reply", ok: false, error }
 *
 * Wanneer buiten Y-App geopend (bijv. direct localhost:5174): geen crash,
 * maar IN_YAPP_CONTEXT = false en alle RPC-calls returnen een fout.
 */

type RpcReply =
  | { id: number; type: "yapp-ext.rpc.reply"; ok: true; result: unknown }
  | { id: number; type: "yapp-ext.rpc.reply"; ok: false; error: string };

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

const pending = new Map<number, Pending>();
let nextId = 1;

const params = new URLSearchParams(window.location.search);

export const HOST_ORIGIN = params.get("host") ?? "*";
export const INSTANCE_ID = params.get("instance") ?? "";
export const ERPNEXT_URL = params.get("erpUrl") ?? "";
export const LANG = params.get("lang") ?? "nl";

export const IN_YAPP_CONTEXT =
  window.parent !== window && Boolean(params.get("host"));

if (!IN_YAPP_CONTEXT) {
  console.warn(
    "[bridge] Geen Y-App context — alleen UI-test. Bridge-calls zijn niet beschikbaar."
  );
}

window.addEventListener("message", (event: MessageEvent) => {
  if (HOST_ORIGIN !== "*" && event.origin !== HOST_ORIGIN) return;
  const data = event.data as RpcReply;
  if (!data || data.type !== "yapp-ext.rpc.reply") return;
  const p = pending.get(data.id);
  if (!p) return;
  pending.delete(data.id);
  if (data.ok) {
    p.resolve((data as Extract<RpcReply, { ok: true }>).result);
  } else {
    p.reject(new Error((data as Extract<RpcReply, { ok: false }>).error));
  }
});

function rpc<T>(method: string, args: unknown[] = []): Promise<T> {
  if (!IN_YAPP_CONTEXT) {
    return Promise.reject(
      new Error(`[bridge] Geen Y-App context — '${method}' niet beschikbaar`)
    );
  }
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    window.parent.postMessage(
      { id, type: "yapp-ext.rpc", method, args },
      HOST_ORIGIN
    );
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`[bridge] timeout: ${method} (30s)`));
      }
    }, 30_000);
  });
}

// ─── ERPNext list queries ────────────────────────────────────────────────────

export interface ListParams {
  fields?: string[];
  filters?: unknown[][];
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}

export function fetchList<T>(doctype: string, listParams?: ListParams): Promise<T[]> {
  return rpc<T[]>("fetchList", [doctype, listParams]);
}

export function fetchDocument<T>(doctype: string, name: string): Promise<T> {
  return rpc<T>("fetchDocument", [doctype, name]);
}

export function updateDocument<T>(
  doctype: string,
  name: string,
  data: Record<string, unknown>
): Promise<T> {
  return rpc<T>("updateDocument", [doctype, name, data]);
}

export function callMethod<T>(
  method: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  return rpc<T>("callMethod", [method, args]);
}

/** Nieuw document aanmaken via frappe.client.insert */
export function createDocument<T>(
  doctype: string,
  doc: Record<string, unknown>
): Promise<T> {
  return callMethod<T>("frappe.client.insert", { doc: { doctype, ...doc } });
}

/** Privé-bestand ophalen als base64. Retourneert { contentType, base64 }. */
export function fetchPrivateFile(
  filePath: string
): Promise<{ contentType: string; base64: string }> {
  return rpc("fetchPrivateFile", [filePath]);
}

// ─── Lokale helpers (geen RPC) ───────────────────────────────────────────────

export function getActiveInstanceId(): string {
  return INSTANCE_ID;
}

export function getErpNextAppUrl(): string {
  return ERPNEXT_URL;
}

/** Paginerende fetchList — haalt alle records op ongeacht aantal. */
export async function fetchAll<T>(
  doctype: string,
  fields: string[],
  filters: unknown[][] = [],
  orderBy = "modified desc",
  pageSize = 500
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
