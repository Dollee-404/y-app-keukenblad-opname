import { fetchList, createDocument } from "../bridge";

export interface CustomerSummary {
  name: string;
  customer_name: string;
  customer_primary_address: string | null;
  email_id: string | null;
  mobile_no: string | null;
}

export interface NieuweKlant {
  naam: string;
  straat: string;
  postcodePlaats: string;
  email?: string;
  telefoon?: string;
}

const FIELDS = [
  "name",
  "customer_name",
  "customer_primary_address",
  "email_id",
  "mobile_no",
];

export async function searchCustomers(query: string): Promise<CustomerSummary[]> {
  return fetchList<CustomerSummary>("Customer", {
    fields: FIELDS,
    filters: [
      ["customer_name", "like", `%${query}%`],
      ["disabled", "=", 0],
    ],
    limit_page_length: 20,
    order_by: "customer_name asc",
  });
}

/** Splitst "1234 AB Amsterdam" in { pincode: "1234 AB", city: "Amsterdam" } */
function parsePostcodePlaats(waarde: string): { pincode: string; city: string } {
  const match = waarde.match(/^(\d{4}\s*[A-Za-z]{2})\s+(.+)$/);
  if (match) return { pincode: match[1].trim(), city: match[2].trim() };
  return { pincode: "", city: waarde.trim() };
}

export async function createCustomerWithAddress(klant: NieuweKlant): Promise<{ name: string }> {
  const customer = await createDocument<{ name: string }>("Customer", {
    customer_name: klant.naam,
    customer_type: "Company",
    ...(klant.email ? { email_id: klant.email } : {}),
    ...(klant.telefoon ? { mobile_no: klant.telefoon } : {}),
  });

  const { pincode, city } = parsePostcodePlaats(klant.postcodePlaats);

  await createDocument("Address", {
    address_title: klant.naam,
    address_type: "Billing",
    address_line1: klant.straat,
    pincode,
    city,
    links: [{ link_doctype: "Customer", link_name: customer.name }],
  });

  return customer;
}
