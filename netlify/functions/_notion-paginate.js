// netlify/functions/_notion-paginate.js
// Shared helper for querying a full Notion database. A single query()
// call caps at 100 results and Notion paginates the rest behind
// start_cursor/has_more — several functions here were quietly dropping
// everything past the newest 100 records. This loops until has_more is
// false, keeping whatever filter/sort was passed in.

async function notionQueryAll(token, databaseId, body) {
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  };

  const results = [];
  let cursor = undefined;

  do {
    const payload = Object.assign({}, body, { page_size: 100 });
    if (cursor) payload.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, status: res.status, message: data.message || "Notion query failed" };
    }

    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return { ok: true, results };
}

module.exports = { notionQueryAll };
