// netlify/functions/stage-log-list.js
// Lists entries from the "Stage Log" Notion database — one row per family
// stage change, written by crm-update.js. Baseline rows (Baseline=true)
// record each existing family's stage at the time this log was introduced
// and should be excluded from timing stats by the caller.

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-query-all");

const STAGE_LOG_DATABASE_ID = process.env.NOTION_STAGE_LOG_DB_ID;

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };
  if (!STAGE_LOG_DATABASE_ID) return { statusCode: 200, body: JSON.stringify({ entries: [], notConfigured: true }) };

  try {
    const notionHeaders = {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };
    const pages = await notionQueryAll(STAGE_LOG_DATABASE_ID, {
      sorts: [{ property: "Changed At", direction: "descending" }]
    }, notionHeaders);

    const entries = pages.map(page => {
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

    return { statusCode: 200, body: JSON.stringify({ entries }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
