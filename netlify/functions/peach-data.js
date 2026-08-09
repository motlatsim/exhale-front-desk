// netlify/functions/peach-data.js
// Fetches escalated Peach conversations server-side using PEACH_API_TOKEN.
// The browser never sees the token — it just calls this function.
//
// NOTE: Peach's public API docs (peach.apidocumentation.com) only document
// /events, apps, and contacts endpoints. GET /conversations?escalated=true
// works (confirmed). A /messages endpoint (both nested under a conversation
// and as a flat resource) returned Peach's website 404 page rather than a
// JSON API error on every attempt — it's likely not part of the public v1
// REST API at all. Message threads and replies are handled by linking out
// to the real Peach inbox (app.trypeach.ai) instead of guessing further.

const BASE = "https://app.trypeach.ai/api/v1";

exports.handler = async function (event, context) {
  const token = process.env.PEACH_API_TOKEN;

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "PEACH_API_TOKEN not set" }) };
  }

  const headers = { "Authorization": token, "Content-Type": "application/json" };

  try {
    const res = await fetch(`${BASE}/conversations?escalated=true&status=open`, { headers });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
