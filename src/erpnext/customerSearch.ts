import { fetchList, createDocument } from "../bridge";

export interface CustomerSummary {
  name: string;
  customer_name: string;
  customer_primary_address: string | null;
  email_id: string | null;
  mobile_no: string | null;
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

export async function createCustomer(naam: string): Promise<{ name: string }> {
  return createDocument<{ name: string }>("Customer", {
    customer_name: naam,
    customer_type: "Company",
  });
}
