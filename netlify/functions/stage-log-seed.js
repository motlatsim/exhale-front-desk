// netlify/functions/stage-log-seed.js
// One-off, idempotent migration: creates a single Baseline Stage Log row
// for every existing family that doesn't already have one, so stage
// timing reports have a starting point instead of a gap for families
// that existed before Stage Log did. From is left blank, To is the
// family's current Status, Changed At is the page's last-edited time
// (the closest available stand-in for "when we started tracking this").
// Safe to call more than once — families that already have a Baseline
// row are skipped.

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-paginate");

const ENQUIRIES_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  const stageLogDbId = process.env.NOTION_STAGE_LOG_DB_ID;
  if (!stageLogDbId) return { statusCode: 400, body: JSON.stringify({ error: "NOTION_STAGE_LOG_DB_ID not set — create the Stage Log database first." }) };

  const notionHeaders = { "Authorization": `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" };

  try {
    const [familiesQ, baselinesQ] = await Promise.all([
      notionQueryAll(token, ENQUIRIES_DATABASE_ID, {}),
      notionQueryAll(token, stageLogDbId, { filter: { property: "Baseline", checkbox: { equals: true } } })
    ]);
    if (!familiesQ.ok) return { statusCode: familiesQ.status, body: JSON.stringify({ error: familiesQ.message }) };
    if (!baselinesQ.ok) return { statusCode: baselinesQ.status, body: JSON.stringify({ error: baselinesQ.message }) };

    const alreadySeeded = new Set(
      baselinesQ.results
        .map(page => {
          const rel = (page.properties["Family"] && page.properties["Family"].relation) || [];
          return rel.length ? rel[0].id : null;
        })
        .filter(Boolean)
    );

    let created = 0, skipped = 0, failed = 0;

    for (const page of familiesQ.results) {
      if (alreadySeeded.has(page.id)) { skipped++; continue; }
      const p = page.properties || {};
      const titleProp = p["Name"] && p["Name"].title;
      const familyName = titleProp && titleProp.length ? titleProp.map(t => t.plain_text).join("") : "Family";
      const currentStatus = (p["Status"] && p["Status"].select && p["Status"].select.name) || "Lead";

      try {
        const res = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({
            parent: { database_id: stageLogDbId },
            properties: {
              "Change": { title: [{ text: { content: `${familyName} — baseline (${currentStatus})`.slice(0, 200) } }] },
              "Family": { relation: [{ id: page.id }] },
              "To": { select: { name: currentStatus } },
              "Changed At": { date: { start: page.last_edited_time } },
              "Baseline": { checkbox: true }
            }
          })
        });
        if (res.ok) created++; else failed++;
      } catch (err) {
        failed++;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, created, skipped, failed, totalFamilies: familiesQ.results.length }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
