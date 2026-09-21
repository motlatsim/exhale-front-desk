// netlify/functions/payments-add.js
// Logs one payment against a family in the "Payments Ledger" Notion
// database, then re-sums every ledger entry for that family and writes
// the total back onto the family's "Amount Paid" field — so the rest of
// the app (pipeline, reports, the 50% production gate) keeps reading one
// familiar number without needing a Notion rollup.
//
// The proof image itself is attached in a second step from the browser,
// via notion-upload-file.js against the returned ledger entry id —
// mirrors the pattern already used for design/reference photos.

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-query-all");

const PAYMENTS_DATABASE_ID = "429d47d244b54a1a891b5b6a7548baa9";
const VALID_METHODS = ["Bank EFT", "Cash at Bank", "Speedpoint"];

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

  const familyId = (data.family_id || "").trim();
  const amount = Number(data.amount);
  const method = data.method;
  const date = (data.date || "").trim();
  if (!familyId) return { statusCode: 400, body: JSON.stringify({ error: "Missing family_id." }) };
  if (!amount || amount <= 0) return { statusCode: 400, body: JSON.stringify({ error: "Amount must be more than zero." }) };
  if (!VALID_METHODS.includes(method)) return { statusCode: 400, body: JSON.stringify({ error: "Invalid payment method." }) };
  if (!date) return { statusCode: 400, body: JSON.stringify({ error: "Missing payment date." }) };

  const notionHeaders = { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };
  const label = (data.label || "Payment").slice(0, 200);

  try {
    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: PAYMENTS_DATABASE_ID },
        properties: {
          "Payment Item": { title: [{ text: { content: label } }] },
          "Amount": { number: amount },
          "Method": { select: { name: method } },
          "Payment Date": { date: { start: date } },
          "Family": { relation: [{ id: familyId }] }
        }
      })
    });
    const created = await createRes.json();
    if (!createRes.ok) return { statusCode: createRes.status, body: JSON.stringify({ error: created.message || "Could not log the payment." }) };

    // Re-sum every ledger entry for this family and sync it onto Amount Paid.
    let payPages;
    try {
      payPages = await notionQueryAll(PAYMENTS_DATABASE_ID, { filter: { property: "Family", relation: { contains: familyId } } }, notionHeaders);
    } catch (err) {
      return { statusCode: 200, body: JSON.stringify({ success: true, id: created.id, totalPaid: null }) };
    }

    const totalPaid = payPages.reduce((sum, page) => {
      const amt = (page.properties["Amount"] && page.properties["Amount"].number) || 0;
      return sum + amt;
    }, 0);

    const patchRes = await fetch(`https://api.notion.com/v1/pages/${familyId}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: { "Amount Paid": { number: totalPaid } } })
    });
    const patched = await patchRes.json();
    if (!patchRes.ok) return { statusCode: 200, body: JSON.stringify({ success: true, id: created.id, totalPaid: null, warning: patched.message }) };

    return { statusCode: 200, body: JSON.stringify({ success: true, id: created.id, totalPaid }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
