// netlify/functions/_require-key.js
// Shared guard for the data-bearing functions. Requires the x-crm-key
// header to match CRM_SESSION_KEY — a value only handed out by
// crm-auth.js after the real password is checked server-side. Without
// this, anyone who knew the function URL could read or edit family
// data without ever seeing the password prompt.

function requireKey(event) {
  const sessionKey = process.env.CRM_SESSION_KEY;
  if (!sessionKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "CRM_SESSION_KEY not set" }) };
  }
  const headers = event.headers || {};
  const provided = headers["x-crm-key"] || headers["X-Crm-Key"] || headers["X-CRM-Key"];
  if (provided !== sessionKey) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  return null;
}

module.exports = { requireKey };
