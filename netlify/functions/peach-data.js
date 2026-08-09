// netlify/functions/peach-data.js
// Talks to Peach's REST API server-side using PEACH_API_TOKEN.
// The browser never sees the token — it just calls this function.
//
// NOTE: Peach's public API docs (peach.apidocumentation.com) only document
// /events, apps, and contacts endpoints. The conversation/message/reply
// endpoints below are best-guess, modeled on the equivalent MCP tool shapes
// (peach_list_conversations, peach_list_messages, peach_reply_to_conversation).
//
// Confirmed working: GET /conversations?escalated=true&status=open (flat
// resource, query-param filtered).
// Adjusted after a 404: /conversations/{id}/messages and
// /conversations/{id}/reply do NOT exist as nested paths. Messages are
// likely a flat resource too, filtered/created via conversation_id — same
// shape as the peach_list_messages / peach_reply_to_conversation MCP tools,
// which both take conversation_id as a flat parameter, not a path segment.

const BASE = "https://app.trypeach.ai/api/v1";

exports.handler = async function (event, context) {
  const token = process.env.PEACH_API_TOKEN;

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "PEACH_API_TOKEN not set" }) };
  }

  const headers = { "Authorization": token, "Content-Type": "application/json" };
  const qs = event.queryStringParameters || {};

  try {
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.conversation_id || !body.text) {
        return { statusCode: 400, body: JSON.stringify({ error: "conversation_id and text are required" }) };
      }
      const res = await fetch(`${BASE}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ conversation_id: body.conversation_id, text: body.text })
      });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    if (qs.conversation_id) {
      const res = await fetch(`${BASE}/messages?conversation_id=${qs.conversation_id}`, { headers });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    // Default: list escalated, open conversations
    const res = await fetch(`${BASE}/conversations?escalated=true&status=open`, { headers });
    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
