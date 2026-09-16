// netlify/functions/lookbook.js
// Public, unauthenticated on purpose — this is what the marketing site's
// lookbook page (exhaleat.com) calls cross-origin to show live prices
// from the Catalog database. No auth, no write access, only Active items,
// and only the fields a shopper needs to see (no staff-only bookkeeping).

const CATALOG_DATABASE_ID = "c8b6094c0afa47c1b2ba5a6def53d340";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const token = process.env.NOTION_API_KEY;
  if (!token) return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${CATALOG_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filter: { property: "Active", checkbox: { equals: true } },
        sorts: [{ property: "Category", direction: "ascending" }],
        page_size: 100
      })
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify({ error: data.message || "Notion query failed" }) };

    const items = (data.results || []).map(page => {
      const p = page.properties || {};
      const title = p["Name"] && p["Name"].title;
      const name = title && title.length ? title.map(t => t.plain_text).join("") : "Untitled item";
      const desc = p["Description"] && p["Description"].rich_text;
      const photos = (p["Photo"] && p["Photo"].files) || [];
      const photoUrl = photos.length ? (photos[0].file ? photos[0].file.url : (photos[0].external ? photos[0].external.url : "")) : "";
      return {
        name,
        category: (p["Category"] && p["Category"].select && p["Category"].select.name) || "",
        price: (p["Price"] && p["Price"].number) || 0,
        description: desc && desc.length ? desc.map(t => t.plain_text).join("") : "",
        photoUrl
      };
    });

    return { statusCode: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, body: JSON.stringify({ items }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
