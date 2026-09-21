// netlify/functions/signoff-respond.js
// Public, unauthenticated on purpose — see signoff-get.js. Records the
// family's approval or change request against the record matching the
// token in the link they were sent.

const NOTION_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }
  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const t = (data.token || "").trim();
  const action = data.action;
  if (!t) return { statusCode: 400, body: JSON.stringify({ error: "Missing link." }) };
  if (!["approve", "changes"].includes(action)) return { statusCode: 400, body: JSON.stringify({ error: "Invalid action." }) };

  const notionHeaders = { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };

  try {
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({ filter: { property: "Signoff Token", rich_text: { equals: t } }, page_size: 1 })
    });
    const queryData = await queryRes.json();
    if (!queryRes.ok) return { statusCode: queryRes.status, body: JSON.stringify({ error: queryData.message || "Notion query failed" }) };

    const page = (queryData.results || [])[0];
    if (!page) return { statusCode: 404, body: JSON.stringify({ error: "This link isn't valid — ask Exhale Memorials for a new one." }) };

    const status = action === "approve" ? "Approved" : "Changes Requested";
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({
        properties: {
          "Signoff Status": { select: { name: status } },
          "Signoff Date": { date: { start: new Date().toISOString().slice(0, 10) } },
          "Signoff Note": { rich_text: [{ text: { content: String(data.note || "").slice(0, 2000) } }] }
        }
      })
    });
    const patched = await patchRes.json();
    if (!patchRes.ok) return { statusCode: patchRes.status, body: JSON.stringify({ error: patched.message || "Could not save your response." }) };

    return { statusCode: 200, body: JSON.stringify({ success: true, status }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
