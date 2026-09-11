// netlify/functions/crm-auth.js
// Checks the Front Desk / CRM password server-side and, on success,
// hands back CRM_SESSION_KEY — the value the browser must then send as
// x-crm-key on every call to the data functions. This moves the real
// gate off the client: previously any function URL was callable by
// anyone who knew it, regardless of whether they'd seen the password
// prompt. The hash below is the same one already embedded in
// index.html / crm.html, so the existing password keeps working.

const crypto = require("crypto");

const GATE_HASH = "6dc6da2a4d2f76400701a5c58c07d795098208a2b904f899ec76a024e55f8718";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const sessionKey = process.env.CRM_SESSION_KEY;
  if (!sessionKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "CRM_SESSION_KEY not set" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const password = String(data.password || "");
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  if (hash !== GATE_HASH) {
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, key: sessionKey }) };
};
