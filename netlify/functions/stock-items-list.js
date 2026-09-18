// netlify/functions/stock-items-list.js
// Lists items from the "Consumables" Notion database — raw materials,
// blasting media, fuel, and engraving supplies. Truck Qty / Workshop Qty
// are only ever changed via stock-movements-add.js (the movement log);
// Current stock and Stock Status are Notion formulas computed from them.

const { requireKey } = require("./_require-key");

const CONSUMABLES_DATABASE_ID = "893da7b9284a4f0ab924458fcc26b592";

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${CONSUMABLES_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sorts: [{ property: "Item name", direction: "ascending" }], page_size: 100 })
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Notion query failed" }) };

    const items = (data.results || []).map(page => {
      const p = page.properties || {};
      const title = p["Item name"] && p["Item name"].title;
      const supplierRelation = (p["Supplier Contact"] && p["Supplier Contact"].relation) || [];
      return {
        id: page.id,
        name: title && title.length ? title.map(t => t.plain_text).join("") : "Untitled item",
        category: (p["Category"] && p["Category"].select && p["Category"].select.name) || "",
        unit: (p["Unit"] && p["Unit"].select && p["Unit"].select.name) || "",
        truckQty: (p["Truck Qty"] && p["Truck Qty"].number) || 0,
        workshopQty: (p["Workshop Qty"] && p["Workshop Qty"].number) || 0,
        currentStock: (p["Current stock"] && p["Current stock"].formula && p["Current stock"].formula.number) || 0,
        reorderThreshold: (p["Reorder threshold"] && p["Reorder threshold"].number) || 0,
        stockStatus: (p["Stock Status"] && p["Stock Status"].formula && p["Stock Status"].formula.string) || "",
        unitCost: (p["Unit Cost"] && p["Unit Cost"].number) || 0,
        lastRestocked: (p["Last restocked"] && p["Last restocked"].date && p["Last restocked"].date.start) || "",
        supplierText: (p["Supplier"] && p["Supplier"].rich_text && p["Supplier"].rich_text.map(t => t.plain_text).join("")) || "",
        supplierContactId: supplierRelation.length ? supplierRelation[0].id : ""
      };
    });

    return { statusCode: 200, body: JSON.stringify({ items }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
