// netlify/functions/_notion-query-all.js
// Shared helper for querying a Notion database to exhaustion. The Notion
// API caps a single query at 100 results and signals more with has_more /
// next_cursor — every list function used to send one request and silently
// drop everything past the first page. This loops until has_more is false,
// keeping the caller's sort/filter, and returns every result combined.

async function notionQueryAll(databaseId, body, notionHeaders) {
  const results = [];
  let cursor = undefined;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify(Object.assign({}, body, { page_size: 100 }, cursor ? { start_cursor: cursor } : {}))
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || "Notion query failed");
      err.statusCode = res.status;
      throw err;
    }
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return results;
}

module.exports = { notionQueryAll };
