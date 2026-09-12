// netlify/functions/catalog-save.js
// Creates or updates one item in the "Catalog" Notion database.
// Pass an existing "id" to update that item; omit it to create a new one.

const { requireKey } = require("./_require-key");

const CATALOG_DATABASE_ID = "c8b6094c0afa47c1b2ba5a6def53d340";
const VALID_CATEGORIES = ["Tombstones", "Plaques", "Grave Restorations", "Memorial Books", "Other"];

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

  const properties = {
    "Name": { title: [{ text: { content: name.slice(0, 2000) } }] },
    "Price": { number: data.price === null || data.price === undefined || data.price === "" ? null : Number(data.price) },
    "Description": { rich_text: [{ text: { content: String(data.description || "").slice(0, 2000) } }] },
    "Active": { checkbox: data.active !== false }
  };
  if (data.category && VALID_CATEGORIES.includes(data.category)) {
    properties["Category"] = { select: { name: data.category } };
  }

  try {
    const pageId = (data.id || "").trim();
    const url = pageId ? `https://api.notion.com/v1/pages/${pageId}` : "https://api.notion.com/v1/pages";
    const method = pageId ? "PATCH" : "POST";
    const body = pageId ? { properties } : { parent: { database_id: CATALOG_DATABASE_ID }, properties };

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
