// netlify/functions/stock-items-save.js
// Creates or updates one item in the "Consumables" Notion database.
// Pass an existing "id" to update that item; omit it to create a new one.
// Does not touch Truck Qty / Workshop Qty — those only change through a
// logged movement (stock-movements-add.js), so there's one auditable path
// to every stock change instead of two that can drift apart.

const { requireKey } = require("./_require-key");

const CONSUMABLES_DATABASE_ID = "893da7b9284a4f0ab924458fcc26b592";
const VALID_CATEGORIES = ["Raw material", "Blasting media", "Fuel", "Engraving supplies", "Other"];
const VALID_UNITS = ["kg", "L", "units", "slabs", "bags"];

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
  if (!name) return { statusCode: 400, body: JSON.stringify({ error: "Item name is required." }) };

  const properties = {
    "Item name": { title: [{ text: { content: name.slice(0, 2000) } }] },
    "Reorder threshold": { number: data.reorderThreshold === null || data.reorderThreshold === undefined || data.reorderThreshold === "" ? null : Number(data.reorderThreshold) },
    "Unit Cost": { number: data.unitCost === null || data.unitCost === undefined || data.unitCost === "" ? null : Number(data.unitCost) },
    "Supplier": { rich_text: [{ text: { content: String(data.supplierText || "").slice(0, 2000) } }] }
  };
  if (data.category && VALID_CATEGORIES.includes(data.category)) {
    properties["Category"] = { select: { name: data.category } };
  }
  if (data.unit && VALID_UNITS.includes(data.unit)) {
    properties["Unit"] = { select: { name: data.unit } };
  }
  if (data.supplierContactId) {
    properties["Supplier Contact"] = { relation: [{ id: data.supplierContactId }] };
  } else if (data.supplierContactId === null) {
    properties["Supplier Contact"] = { relation: [] };
  }

  try {
    const pageId = (data.id || "").trim();
    const url = pageId ? `https://api.notion.com/v1/pages/${pageId}` : "https://api.notion.com/v1/pages";
    const method = pageId ? "PATCH" : "POST";
    const body = pageId ? { properties } : { parent: { database_id: CONSUMABLES_DATABASE_ID }, properties };

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
