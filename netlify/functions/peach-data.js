// netlify/functions/peach-data.js
// Fetches escalated Peach conversations server-side using PEACH_API_TOKEN.
// Returns a consistent JSON shape and checks for non-OK upstream responses.

const BASE = 'https://app.trypeach.ai/api/v1';

exports.handler = async function (event, context) {
  const token = process.env.PEACH_API_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'PEACH_API_TOKEN not set' }) };
  }

  // Many APIs expect a Bearer token in the Authorization header. If Peach expects
  // a different format, you can tweak this — but Bearer is the common standard.
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(`${BASE}/conversations?escalated=true&status=open`, { headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('peach-data upstream error', res.status, text.slice ? text.slice(0, 500) : text);
      return { statusCode: 502, body: JSON.stringify({ error: `Peach API returned ${res.status}` }) };
    }

    const text = await res.text();
    // Try to parse JSON, but fall back to returning raw text if parsing fails.
    try {
      const data = JSON.parse(text);
      // Normalize into an object with conversations key when possible
      const conversations = data.conversations || data.data || (Array.isArray(data) ? data : []);
      return { statusCode: 200, body: JSON.stringify({ conversations }) };
    } catch (err) {
      // Non-JSON response — return as plain text under a safe key
      return { statusCode: 200, body: JSON.stringify({ conversations: [], raw: text }) };
    }
  } catch (err) {
    console.error('peach-data error', err && err.stack ? err.stack : err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error fetching Peach data' }) };
  }
};
