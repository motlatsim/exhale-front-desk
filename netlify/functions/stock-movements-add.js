// netlify/functions/stock-movements-add.js
// Logs one entry in the "Stock Movements" Notion database, then re-sums
// every movement for that item and writes Truck Qty / Workshop Qty back
// onto the Consumables item — mirrors how payments-add.js re-sums the
// Payments Ledger onto a family's Amount Paid. Current stock and Stock
// Status are Notion formulas over Truck Qty + Workshop Qty, so they
// update on their own once those are patched.

const { requireKey } = require("./_require-key");

const CONSUMABLES_DATABASE_ID = "893da7b9284a4f0ab924458fcc26b592";
const STOCK_MOVEMENTS_DATABASE_ID = "e9719b735c214ae8941b9d15bc1193b6";

const TYPES_NEEDING_LOCATION = ["Delivery In", "Used on Job", "Lost or Damaged", "Adjustment Up", "Adjustment Down"];
const VALID_TYPES = ["Delivery In", "Move to Truck", "Move to Workshop", "Used on Job", "Lost or Damaged", "Adjustment Up", "Adjustment Down"];
const VALID_LOCATIONS = ["Truck", "Workshop"];

// Signed effect of one movement on Truck Qty and Workshop Qty.
function deltas(type, location, qty) {
  if (type === "Move to Truck") return { truck: qty, workshop: -qty };
  if (type === "Move to Workshop") return { truck: -qty, workshop: qty };
  const sign = (type === "Delivery In" || type === "Adjustment Up") ? 1 : -1;
  return {
    truck: location === "Truck" ? sign * qty : 0,
    workshop: location === "Workshop" ? sign * qty : 0
  };
}

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

  const itemId = (data.item_id || "").trim();
  const type = data.type;
  const location = data.location || "";
  const qty = Number(data.qty);
  const date = (data.date || "").trim();

  if (!itemId) return { statusCode: 400, body: JSON.stringify({ error: "Missing item_id." }) };
  if (!VALID_TYPES.includes(type)) return { statusCode: 400, body: JSON.stringify({ error: "Invalid movement type." }) };
  if (!qty || qty <= 0) return { statusCode: 400, body: JSON.stringify({ error: "Qty must be more than zero." }) };
  if (!date) return { statusCode: 400, body: JSON.stringify({ error: "Missing movement date." }) };
  if (TYPES_NEEDING_LOCATION.includes(type) && !VALID_LOCATIONS.includes(location)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Location (Truck or Workshop) is required for this movement type." }) };
  }

  const notionHeaders = { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
  const itemName = (data.item_name || "Item").slice(0, 100);
  const title = `${qty} × ${itemName} — ${type}`.slice(0, 200);

  const properties = {
    "Movement": { title: [{ text: { content: title } }] },
    "Item": { relation: [{ id: itemId }] },
    "Type": { select: { name: type } },
    "Qty": { number: qty },
    "Movement Date": { date: { start: date } }
  };
  if (VALID_LOCATIONS.includes(location)) properties["Location"] = { select: { name: location } };
  if (data.supplier_id) properties["Supplier"] = { relation: [{ id: data.supplier_id }] };
  if (data.family_id) properties["Family"] = { relation: [{ id: data.family_id }] };
  if (data.unit_cost !== undefined && data.unit_cost !== null && data.unit_cost !== "") properties["Unit Cost"] = { number: Number(data.unit_cost) };
  if (data.logged_by) properties["Logged By"] = { rich_text: [{ text: { content: String(data.logged_by).slice(0, 200) } }] };
  if (data.notes) properties["Notes"] = { rich_text: [{ text: { content: String(data.notes).slice(0, 2000) } }] };

  try {
    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({ parent: { database_id: STOCK_MOVEMENTS_DATABASE_ID }, properties })
    });
    const created = await createRes.json();
    if (!createRes.ok) return { statusCode: createRes.status, body: JSON.stringify({ error: created.message || "Could not log the movement." }) };

    // Re-sum every movement for this item and sync Truck Qty / Workshop Qty.
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${STOCK_MOVEMENTS_DATABASE_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({ filter: { property: "Item", relation: { contains: itemId } }, page_size: 100 })
    });
    const queryData = await queryRes.json();
    if (!queryRes.ok) return { statusCode: 200, body: JSON.stringify({ success: true, id: created.id, truckQty: null, workshopQty: null }) };

    const totals = (queryData.results || []).reduce((acc, page) => {
      const pp = page.properties;
      const t = pp["Type"] && pp["Type"].select && pp["Type"].select.name;
      const loc = pp["Location"] && pp["Location"].select && pp["Location"].select.name;
      const q = (pp["Qty"] && pp["Qty"].number) || 0;
      const d = deltas(t, loc, q);
      acc.truck += d.truck;
      acc.workshop += d.workshop;
      return acc;
    }, { truck: 0, workshop: 0 });

    const patchProperties = { "Truck Qty": { number: totals.truck }, "Workshop Qty": { number: totals.workshop } };
    if (type === "Delivery In") patchProperties["Last restocked"] = { date: { start: date } };

    const patchRes = await fetch(`https://api.notion.com/v1/pages/${itemId}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: patchProperties })
    });
    const patched = await patchRes.json();
    if (!patchRes.ok) return { statusCode: 200, body: JSON.stringify({ success: true, id: created.id, truckQty: null, workshopQty: null, warning: patched.message }) };

    return { statusCode: 200, body: JSON.stringify({ success: true, id: created.id, truckQty: totals.truck, workshopQty: totals.workshop }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
