// netlify/functions/payments-list.js
// Lists ledger entries from the "Payments Ledger" Notion database — the
// real transaction log behind "Paid so far". Every entry carries its own
// proof (POP / deposit slip / merchant slip): Exhale takes no cash in the
// office, so nothing here is trusted without one.
//
// Pass family_id to scope to one family's history (used by the drawer);
// omit it for the full ledger feed (used by Reports' cash-collected panel).

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-query-all");

const PAYMENTS_DATABASE_ID = "429d47d244b54a1a891b5b6a7548baa9";

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  const familyId = ((event.queryStringParameters && event.queryStringParameters.family_id) || "").trim();

  try {
    const notionHeaders = {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };
    const body = { sorts: [{ property: "Payment Date", direction: "descending" }] };
    if (familyId) body.filter = { property: "Family", relation: { contains: familyId } };

    const pages = await notionQueryAll(PAYMENTS_DATABASE_ID, body, notionHeaders);

    const payments = pages.map(page => {
      const p = page.properties || {};
      const title = p["Payment Item"] && p["Payment Item"].title;
      const proofFiles = (p["Receipt Proof"] && p["Receipt Proof"].files) || [];
      const familyRel = (p["Family"] && p["Family"].relation) || [];
      return {
        id: page.id,
        label: title && title.length ? title.map(t => t.plain_text).join("") : "Payment",
        amount: (p["Amount"] && p["Amount"].number) || 0,
        method: (p["Method"] && p["Method"].select && p["Method"].select.name) || "",
        date: (p["Payment Date"] && p["Payment Date"].date && p["Payment Date"].date.start) || "",
        familyId: familyRel.length ? familyRel[0].id : "",
        proofUrl: proofFiles.length ? (proofFiles[0].file ? proofFiles[0].file.url : (proofFiles[0].external ? proofFiles[0].external.url : "")) : ""
      };
    });

    return { statusCode: 200, body: JSON.stringify({ payments }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
