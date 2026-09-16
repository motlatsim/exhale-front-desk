// netlify/functions/tracker-get.js
// Public, unauthenticated on purpose — this is what a family's status
// link (track.html) calls. Access control is the token itself (a long
// random string staff generate from the drawer), not a login. Returns
// only what a family needs to see their own progress and balance — no
// phone/email/notes, and nothing about other families.

const NOTION_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";

const STAGE_STEPS = [
  "Lead", "Design Selection", "Quotation", "Deposit Confirmed", "Artwork",
  "Artwork Approval", "Manufacturing", "Ready to Install", "Installation",
  "After-Installation Service"
];

exports.handler = async function (event) {
  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  const t = ((event.queryStringParameters && event.queryStringParameters.token) || "").trim();
  if (!t) return { statusCode: 400, body: JSON.stringify({ error: "Missing link." }) };

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ filter: { property: "Tracker Token", rich_text: { equals: t } }, page_size: 1 })
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Notion query failed" }) };

    const page = (data.results || [])[0];
    if (!page) return { statusCode: 404, body: JSON.stringify({ error: "This link isn't valid — ask Exhale Memorials for a new one." }) };

    const p = page.properties || {};
    const title = p["Name"] && p["Name"].title;
    const name = title && title.length ? title.map(x => x.plain_text).join("") : "";
    const richText = key => {
      const rt = p[key] && p[key].rich_text;
      return rt && rt.length ? rt.map(x => x.plain_text).join("") : "";
    };
    const stage = (p["Status"] && p["Status"].select && p["Status"].select.name) || "Lead";
    const quoted = (p["Quoted Value"] && p["Quoted Value"].number) || 0;
    const paid = (p["Amount Paid"] && p["Amount Paid"].number) || 0;

    let installments = [];
    try { installments = JSON.parse(richText("Installments") || "[]"); } catch (e) { installments = []; }
    const nextInstallment = installments
      .filter(i => !i.paid && i.due)
      .sort((a, b) => new Date(a.due) - new Date(b.due))[0] || null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        contact: name,
        deceasedName: richText("Deceased Name"),
        interest: (p["Interested In"] && p["Interested In"].select && p["Interested In"].select.name) || "",
        stage,
        stageIndex: STAGE_STEPS.indexOf(stage),
        stages: STAGE_STEPS,
        isLost: stage === "Lost",
        quotedValue: quoted,
        amountPaid: paid,
        balance: Math.max(0, quoted - paid),
        nextInstallment,
        unveiling: richText("Unveiling Date"),
        installedDate: (p["Installed Date"] && p["Installed Date"].date && p["Installed Date"].date.start) || ""
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
