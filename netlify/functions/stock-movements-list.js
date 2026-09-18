// netlify/functions/stock-movements-list.js
// Lists entries from the "Stock Movements" Notion database — the log
// behind Truck Qty / Workshop Qty on a Consumables item, the same way
// Payments Ledger is the log behind a family's Amount Paid.
// Pass item_id to scope to one item's history; omit it for the full feed.

const { requireKey } = require("./_require-key");

const STOCK_MOVEMENTS_DATABASE_ID = "e9719b735c214ae8941b9d15bc1193b6";

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  const itemId = ((event.queryStringParameters && event.queryStringParameters.item_id) || "").trim();

  try {
    const body = {
      sorts: [{ property: "Movement Date", direction: "descending" }],
      page_size: 100
    };
    if (itemId) body.filter = { property: "Item", relation: { contains: itemId } };

    const res = await fetch(`https://api.notion.com/v1/databases/${STOCK_MOVEMENTS_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Notion query failed" }) };

    const movements = (data.results || []).map(page => {
      const p = page.properties || {};
      const title = p["Movement"] && p["Movement"].title;
      const itemRel = (p["Item"] && p["Item"].relation) || [];
      const supplierRel = (p["Supplier"] && p["Supplier"].relation) || [];
      const familyRel = (p["Family"] && p["Family"].relation) || [];
      const proofFiles = (p["Receipt Photo"] && p["Receipt Photo"].files) || [];
      return {
        id: page.id,
        label: title && title.length ? title.map(t => t.plain_text).join("") : "Movement",
        itemId: itemRel.length ? itemRel[0].id : "",
        type: (p["Type"] && p["Type"].select && p["Type"].select.name) || "",
        location: (p["Location"] && p["Location"].select && p["Location"].select.name) || "",
        qty: (p["Qty"] && p["Qty"].number) || 0,
        supplierId: supplierRel.length ? supplierRel[0].id : "",
        familyId: familyRel.length ? familyRel[0].id : "",
        unitCost: (p["Unit Cost"] && p["Unit Cost"].number) || 0,
        date: (p["Movement Date"] && p["Movement Date"].date && p["Movement Date"].date.start) || "",
        loggedBy: (p["Logged By"] && p["Logged By"].rich_text && p["Logged By"].rich_text.map(t => t.plain_text).join("")) || "",
        notes: (p["Notes"] && p["Notes"].rich_text && p["Notes"].rich_text.map(t => t.plain_text).join("")) || "",
        receiptUrl: proofFiles.length ? (proofFiles[0].file ? proofFiles[0].file.url : (proofFiles[0].external ? proofFiles[0].external.url : "")) : ""
      };
    });

    return { statusCode: 200, body: JSON.stringify({ movements }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
