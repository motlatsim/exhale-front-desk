// netlify/functions/signoff-get.js
// Public, unauthenticated on purpose — this is what the family's sign-off
// link calls. Access control is the token itself (a long random string
// generated when staff send the design for approval), not a login.
// Only returns what a family needs to review and approve a design —
// no phone/email/notes/financial fields.

const NOTION_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";

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
      body: JSON.stringify({ filter: { property: "Signoff Token", rich_text: { equals: t } }, page_size: 1 })
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
    const images = ((p["Design Images"] && p["Design Images"].files) || []).map(f => ({
      name: f.name || "",
      url: f.file ? f.file.url : (f.external ? f.external.url : "")
    })).filter(f => f.url);

    return {
      statusCode: 200,
      body: JSON.stringify({
        contact: name,
        deceasedName: richText("Deceased Name"),
        town: (p["Town"] && p["Town"].select && p["Town"].select.name) || "",
        interest: (p["Interested In"] && p["Interested In"].select && p["Interested In"].select.name) || "",
        memorialSpec: richText("Memorial Spec"),
        images,
        status: (p["Signoff Status"] && p["Signoff Status"].select && p["Signoff Status"].select.name) || "Sent",
        note: richText("Signoff Note")
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
