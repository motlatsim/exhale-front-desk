// netlify/functions/catalog-list.js
// Lists items from the "Catalog" Notion database — the priced items
// staff can add to a family's proposal.

const { requireKey } = require("./_require-key");

const CATALOG_DATABASE_ID = "c8b6094c0afa47c1b2ba5a6def53d340";

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${CATALOG_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ page_size: 100 })
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Notion query failed" }) };

    const items = (data.results || []).map(page => {
      const p = page.properties || {};
      const title = p["Name"] && p["Name"].title;
      const name = title && title.length ? title.map(t => t.plain_text).join("") : "Untitled item";
      const desc = p["Description"] && p["Description"].rich_text;
      const photos = (p["Photo"] && p["Photo"].files) || [];
      const photoUrl = photos.length ? (photos[0].file ? photos[0].file.url : (photos[0].external ? photos[0].external.url : "")) : "";
      return {
        id: page.id,
        name,
        category: (p["Category"] && p["Category"].select && p["Category"].select.name) || "",
        price: (p["Price"] && p["Price"].number) || 0,
        description: desc && desc.length ? desc.map(t => t.plain_text).join("") : "",
        active: p["Active"] ? !!p["Active"].checkbox : true,
        photoUrl
      };
    });

    return { statusCode: 200, body: JSON.stringify({ items }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
