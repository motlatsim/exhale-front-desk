// netlify/functions/crm-auth.js
// Checks the Front Desk / CRM password server-side and, on success,
// hands back CRM_SESSION_KEY — the value the browser must then send as
// x-crm-key on every call to the data functions. This moves the real
// gate off the client: previously any function URL was callable by
// anyone who knew it, regardless of whether they'd seen the password
// prompt.
//
// The password hash lives in CRM_PASSWORD_HASH, never in this repo.
// An earlier version kept a bare SHA-256 literal here; because the repo
// is public that hash could be cracked offline on a GPU, where no amount
// of rate limiting helps. scrypt is salted and deliberately slow, so each
// guess costs real work whether it is made here or offline.
//
// Generate the value with: node tools/hash-password.js

const crypto = require("crypto");

const SCRYPT_KEYLEN = 32;
// scrypt needs roughly 128 * N * r bytes; keep maxmem comfortably above it.
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

// Failed attempts per client IP. Serverless instances are recycled and
// requests spread across them, so this is defence in depth rather than a
// hard guarantee — scrypt's cost per guess is the real brake.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const attempts = new Map();

function clientIp(event) {
  const h = event.headers || {};
  // Set by Netlify's edge, so it cannot be spoofed by the caller the way
  // a bare X-Forwarded-For can.
  const direct = h["x-nf-client-connection-ip"];
  if (direct) return direct;
  const forwarded = h["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function sweep(now) {
  for (const [ip, record] of attempts) {
    if (now - record.first > WINDOW_MS) attempts.delete(ip);
  }
}

function retryAfter(record, now) {
  return Math.max(1, Math.ceil((record.first + WINDOW_MS - now) / 1000));
}

function noteFailure(ip, now) {
  const record = attempts.get(ip);
  if (!record || now - record.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return;
  }
  record.count += 1;
}

// Format: scrypt$N$r$p$<salt-base64>$<hash-base64>
function parseStoredHash(stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return null;
  const salt = Buffer.from(parts[4], "base64");
  const hash = Buffer.from(parts[5], "base64");
  if (!salt.length || !hash.length) return null;
  return { N, r, p, salt, hash };
}

function verifyPassword(password, parsed) {
  return new Promise((resolve) => {
    crypto.scrypt(
      password,
      parsed.salt,
      parsed.hash.length || SCRYPT_KEYLEN,
      { N: parsed.N, r: parsed.r, p: parsed.p, maxmem: SCRYPT_MAXMEM },
      (err, derived) => {
        if (err) return resolve(false);
        resolve(derived.length === parsed.hash.length && crypto.timingSafeEqual(derived, parsed.hash));
      }
    );
  });
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const sessionKey = process.env.CRM_SESSION_KEY;
  if (!sessionKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "CRM_SESSION_KEY not set" }) };
  }

  const storedHash = process.env.CRM_PASSWORD_HASH;
  if (!storedHash) {
    return { statusCode: 500, body: JSON.stringify({ error: "CRM_PASSWORD_HASH not set" }) };
  }
  const parsed = parseStoredHash(storedHash);
  if (!parsed) {
    return { statusCode: 500, body: JSON.stringify({ error: "CRM_PASSWORD_HASH is malformed" }) };
  }

  const now = Date.now();
  sweep(now);

  // Check the lockout before hashing: scrypt is expensive by design, so
  // running it for a known-bad client would hand them a way to burn the
  // function budget.
  const ip = clientIp(event);
  const record = attempts.get(ip);
  if (record && record.count >= MAX_FAILURES && now - record.first <= WINDOW_MS) {
    const wait = retryAfter(record, now);
    return {
      statusCode: 429,
      headers: { "Retry-After": String(wait) },
      body: JSON.stringify({ error: "Too many attempts. Try again later." }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const password = String(data.password || "");
  const ok = await verifyPassword(password, parsed);

  if (!ok) {
    noteFailure(ip, now);
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password." }) };
  }

  attempts.delete(ip);
  return { statusCode: 200, body: JSON.stringify({ ok: true, key: sessionKey }) };
};
