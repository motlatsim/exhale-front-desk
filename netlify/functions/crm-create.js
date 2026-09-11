// netlify/functions/crm-create.js
// Creates a new "Website Enquiries" page from the CRM app directly —
// for walk-in or phone enquiries that didn't come through the website
// form. Mirrors exhaleat.com's create-lead.js (Notion write + Peach
// hand-off), but callable from the Front Desk / CRM app instead.

const { requireKey } = require("./_require-key");

const NOTION_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";
const VALID_INTERESTS = ["Tombstones", "Plaques", "Grave Restorations", "Memorial Books", "Not sure yet"];
const VALID_TOWNS = ["Lusikisiki", "Port St Johns", "Flagstaff", "Other"];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const notionToken = process.env.NOTION_API_KEY;
  if (!notionToken) {
    return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const name = (data.name || "").trim();
  const phone = (data.phone || "").trim();
  const email = (data.email || "").trim();
  const interest = (data.interest || "Not sure yet").trim();
  const town = (data.town || "").trim();
  const message = (data.message || "").trim();

  if (!name || !phone) {
    return { statusCode: 400, body: JSON.stringify({ error: "Name and phone number are required." }) };
  }

  const cleanedPhone = phone.replace(/[\s\-()]/g, "");
  const phoneLooksValid = /^\+?27\d{9}$/.test(cleanedPhone) || /^0\d{9}$/.test(cleanedPhone);

  function toE164(raw) {
    const cleaned = raw.replace(/[\s\-()]/g, "");
    if (/^\+27\d{9}$/.test(cleaned)) return cleaned;
    if (/^27\d{9}$/.test(cleaned)) return "+" + cleaned;
    if (/^0\d{9}$/.test(cleaned)) return "+27" + cleaned.slice(1);
    return cleaned;
  }

  try {
    const properties = {
      "Name": { title: [{ text: { content: name } }] },
      "Phone": { phone_number: phone },
      "Interested In": { select: { name: VALID_INTERESTS.includes(interest) ? interest : "Not sure yet" } },
      "Phone Looks Valid": { checkbox: phoneLooksValid },
      "Status": { select: { name: "Lead" } },
      "Source": { select: { name: "Front Desk (manual entry)" } },
      "Submitted At": { date: { start: new Date().toISOString() } }
    };
    if (email) properties["Email"] = { email };
    if (message) properties["Message"] = { rich_text: [{ text: { content: message.slice(0, 2000) } }] };
    if (town && VALID_TOWNS.includes(town)) properties["Town"] = { select: { name: town } };

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ parent: { database_id: NOTION_DATABASE_ID }, properties })
    });
    const notionData = await notionRes.json();
    if (!notionRes.ok) {
      throw new Error(notionData.message || "Could not save to Notion");
    }

    // Best-effort Peach hand-off, same as the website form
    const peachToken = process.env.PEACH_API_TOKEN;
    if (peachToken) {
      try {
        await fetch("https://app.trypeach.io/api/v1/events", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": peachToken },
          body: JSON.stringify({
            event_type: "connect_to_ai_agent",
            contact: { phone_number: toE164(phone), name },
            template_message: {
              whats_app_template_id: "wat_PxwevX542rXwub51ZrzEqAlM",
              liquid_values: { placeholder_1: name, placeholder_2: interest }
            },
            ai_agent: { id: "aiflw_WgzOAxPymYWNu3RpdQn9MwYq" }
          })
        });
      } catch (peachErr) {
        // non-fatal — the Notion entry above already exists
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, id: notionData.id }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
  }
};
