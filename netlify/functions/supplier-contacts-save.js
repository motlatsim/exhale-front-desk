// netlify/functions/supplier-contacts-save.js
// Creates or updates one entry in the "Supplier Contacts" Notion database.
// Pass an existing "id" to update that supplier; omit it to create a new one.

const { requireKey } = require("./_require-key");

const SUPPLIER_CONTACTS_DATABASE_ID = "bf0e65e02f2e43bcb1e4ccefeeeb094f";
const VALID_CATEGORIES = ["Equipment", "Consumables", "Supplies", "Tools"];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const name = (data.name || "").trim();
  if (!name) return { statusCode: 400, body: JSON.stringify({ error: "Name is required." }) };

  const category = Array.isArray(data.category) ? data.category.filter(c => VALID_CATEGORIES.includes(c)) : [];

  const properties = {
    "Name": { title: [{ text: { content: name.slice(0, 2000) } }] },
    "Phone": { phone_number: data.phone ? String(data.phone).slice(0, 200) : null },
    "Email": { email: data.email ? String(data.email).slice(0, 200) : null },
    "Category": { multi_select: category.map(c => ({ name: c })) },
    "Town": { rich_text: [{ text: { content: String(data.town || "").slice(0, 200) } }] },
    "Notes": { rich_text: [{ text: { content: String(data.notes || "").slice(0, 2000) } }] },
    "Active": { checkbox: data.active !== false }
  };

  try {
    const pageId = (data.id || "").trim();
    const url = pageId ? `https://api.notion.com/v1/pages/${pageId}` : "https://api.notion.com/v1/pages";
    const method = pageId ? "PATCH" : "POST";
    const body = pageId ? { properties } : { parent: { database_id: SUPPLIER_CONTACTS_DATABASE_ID }, properties };

    const res = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: result.message || "Notion save failed" }) };

    return { statusCode: 200, body: JSON.stringify({ success: true, id: result.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
