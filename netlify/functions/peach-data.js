// netlify/functions/peach-data.js
// Talks to Peach's REST API server-side using PEACH_API_TOKEN.
// The browser never sees the token — it just calls this function.
//
// NOTE: Peach's public API docs (peach.apidocumentation.com) only document
// /events, apps, and contacts endpoints. The conversation/message/reply
// endpoints below are best-guess, modeled on the equivalent MCP tool shapes
// (peach_list_conversations, peach_list_messages, peach_reply_to_conversation).
// If these paths are wrong, Peach will return a 404/error body — that response
// is passed straight through unmodified so it can be inspected directly at
// this function's URL, the same way we diagnosed the Pipedrive function.

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
      const res = await fetch(`${BASE}/conversations/${body.conversation_id}/reply`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: body.text })
      });
      const text = await res.text();
      return { statusCode: res.status, body: text };
    }

    if (qs.conversation_id) {
      const res = await fetch(`${BASE}/conversations/${qs.conversation_id}/messages`, { headers });
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
