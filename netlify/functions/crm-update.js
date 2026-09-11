// netlify/functions/crm-update.js
// Updates an existing "Website Enquiries" page — used by the CRM app
// when you move a card between stages, toggle deposit paid, set an
// installed date, or save notes. The browser never sees NOTION_API_KEY.

const VALID_STATUSES = [
  "Lead", "Design Selection", "Quotation", "Deposit Confirmed", "Artwork",
  "Artwork Approval", "Manufacturing", "Ready to Install", "Installation",
  "After-Installation Service", "Lost"
];
const VALID_INTERESTS = ["Tombstones", "Plaques", "Grave Restorations", "Memorial Books", "Not sure yet"];
const VALID_TOWNS = ["Lusikisiki", "Port St Johns", "Flagstaff", "Other"];
const { requireKey } = require("./_require-key");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const pageId = (data.id || "").trim();
  if (!pageId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing enquiry id." }) };
  }

  const properties = {};

  if (data.name !== undefined) {
    properties["Name"] = { title: [{ text: { content: String(data.name).slice(0, 2000) } }] };
  }
  if (data.phone !== undefined) {
    properties["Phone"] = { phone_number: data.phone };
  }
  if (data.email !== undefined) {
    properties["Email"] = { email: data.email || null };
  }
  if (data.interest !== undefined && VALID_INTERESTS.includes(data.interest)) {
    properties["Interested In"] = { select: { name: data.interest } };
  }
  if (data.town !== undefined) {
    properties["Town"] = data.town && VALID_TOWNS.includes(data.town) ? { select: { name: data.town } } : { select: null };
  }
  if (data.status !== undefined && VALID_STATUSES.includes(data.status)) {
    properties["Status"] = { select: { name: data.status } };
  }
  if (data.notes !== undefined) {
    properties["Notes"] = { rich_text: [{ text: { content: String(data.notes).slice(0, 2000) } }] };
  }
  if (data.deposit_paid !== undefined) {
    properties["Deposit Paid"] = { checkbox: !!data.deposit_paid };
  }
  if (data.deposit_date !== undefined) {
    properties["Deposit Date"] = data.deposit_date ? { date: { start: data.deposit_date } } : { date: null };
  }
  if (data.installed_date !== undefined) {
    properties["Installed Date"] = data.installed_date ? { date: { start: data.installed_date } } : { date: null };
  }
  if (data.in_memory_of !== undefined) {
    properties["In Memory Of"] = { rich_text: [{ text: { content: String(data.in_memory_of).slice(0, 2000) } }] };
  }
  if (data.quoted_value !== undefined) {
    properties["Quoted Value"] = { number: data.quoted_value === null || data.quoted_value === "" ? null : Number(data.quoted_value) };
  }
  if (data.amount_paid !== undefined) {
    properties["Amount Paid"] = { number: data.amount_paid === null || data.amount_paid === "" ? null : Number(data.amount_paid) };
  }
  if (data.payment_plan !== undefined) {
    properties["Payment Plan"] = { rich_text: [{ text: { content: String(data.payment_plan).slice(0, 2000) } }] };
  }
  if (data.production_progress !== undefined) {
    properties["Production Progress"] = { number: data.production_progress === null || data.production_progress === "" ? null : Number(data.production_progress) };
  }
  if (data.assigned_to !== undefined) {
    properties["Assigned To"] = { rich_text: [{ text: { content: String(data.assigned_to).slice(0, 2000) } }] };
  }

  if (Object.keys(properties).length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nothing to update." }) };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ properties })
    });
    const result = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: result.message || "Notion update failed" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
