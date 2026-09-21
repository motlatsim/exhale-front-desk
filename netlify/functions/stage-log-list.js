// netlify/functions/stage-log-list.js
// Lists entries from the "Stage Log" Notion database — one row per
// pipeline stage move, written by crm-update.js. Pass family_id to scope
// to one family's history; omit it for the full feed. Requires
// NOTION_STAGE_LOG_DB_ID (the database doesn't exist until the owner
// creates it in Notion — see crm-update.js's logStageChange).

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-paginate");

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  const stageLogDbId = process.env.NOTION_STAGE_LOG_DB_ID;
  if (!stageLogDbId) return { statusCode: 200, body: JSON.stringify({ stageLog: [] }) };

  const familyId = ((event.queryStringParameters && event.queryStringParameters.family_id) || "").trim();

  try {
    const body = { sorts: [{ property: "Changed At", direction: "descending" }] };
    if (familyId) body.filter = { property: "Family", relation: { contains: familyId } };

    const q = await notionQueryAll(token, stageLogDbId, body);
    if (!q.ok) return { statusCode: q.status, body: JSON.stringify({ error: q.message }) };

    const stageLog = q.results.map(page => {
      const p = page.properties || {};
      const familyRel = (p["Family"] && p["Family"].relation) || [];
      return {
        id: page.id,
        familyId: familyRel.length ? familyRel[0].id : "",
        from: (p["From"] && p["From"].select && p["From"].select.name) || "",
        to: (p["To"] && p["To"].select && p["To"].select.name) || "",
        changedAt: (p["Changed At"] && p["Changed At"].date && p["Changed At"].date.start) || "",
        lostReason: (p["Lost Reason"] && p["Lost Reason"].select && p["Lost Reason"].select.name) || "",
        baseline: !!(p["Baseline"] && p["Baseline"].checkbox)
      };
    });

    return { statusCode: 200, body: JSON.stringify({ stageLog }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
