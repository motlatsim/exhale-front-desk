// netlify/functions/supplier-contacts-list.js
// Lists entries from the "Supplier Contacts" Notion database — a callable
// directory (phone/email) for regular suppliers, separate from the
// "Suppliers" database which tracks item-by-item procurement research.

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-paginate");

const SUPPLIER_CONTACTS_DATABASE_ID = "bf0e65e02f2e43bcb1e4ccefeeeb094f";

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  try {
    const q = await notionQueryAll(token, SUPPLIER_CONTACTS_DATABASE_ID, { sorts: [{ property: "Name", direction: "ascending" }] });
    if (!q.ok) return { statusCode: q.status, body: JSON.stringify({ error: q.message }) };

    const suppliers = q.results.map(page => {
      const p = page.properties || {};
      const title = p["Name"] && p["Name"].title;
      return {
        id: page.id,
        name: title && title.length ? title.map(t => t.plain_text).join("") : "Untitled supplier",
        phone: (p["Phone"] && p["Phone"].phone_number) || "",
        email: (p["Email"] && p["Email"].email) || "",
        category: ((p["Category"] && p["Category"].multi_select) || []).map(o => o.name),
        town: (p["Town"] && p["Town"].rich_text && p["Town"].rich_text.map(t => t.plain_text).join("")) || "",
        notes: (p["Notes"] && p["Notes"].rich_text && p["Notes"].rich_text.map(t => t.plain_text).join("")) || "",
        active: p["Active"] ? !!p["Active"].checkbox : true
      };
    });

    return { statusCode: 200, body: JSON.stringify({ suppliers }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
