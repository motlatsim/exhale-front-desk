// netlify/functions/crm-backup.mjs
// Daily off-site snapshot of the whole CRM. Notion is the live datastore,
// and Notion's own version history is not a backup — a bad delete or a
// wrong bulk edit propagates and there is no export on a schedule. This
// reads every CRM database to exhaustion and commits one timestamped JSON
// file to a PRIVATE GitHub repo, so every day is its own restore point.
//
// It is a Netlify scheduled function (v2). The schedule lives in the
// `config` export below, so nothing site-wide (netlify.toml, build config)
// is touched, and it pulls in no npm dependency — just global fetch.
//
// Required environment variables (Netlify → Site settings → Environment):
//   NOTION_API_KEY        already set; the integration token
//   BACKUP_GITHUB_TOKEN   a fine-grained PAT with Contents: read/write on
//                         the backup repo ONLY, nothing else
//   BACKUP_GITHUB_REPO    owner/repo of the PRIVATE backup repo
//   BACKUP_GITHUB_BRANCH  optional, defaults to "main"
//   NOTION_STAGE_LOG_DB_ID  already set; the Stage Log database
//
// The families' names, phones and payment records land in that repo, so it
// MUST be private and the token MUST be scoped to it alone.

const NOTION_VERSION = "2022-06-28";

// Same IDs the individual data functions use. Kept literal here (matching
// their style) so the backup does not depend on any of them still existing.
const DATABASES = {
  enquiries: "809dabc9-23dc-4932-9dee-525adb153223",
  catalog: "c8b6094c0afa47c1b2ba5a6def53d340",
  payments: "429d47d244b54a1a891b5b6a7548baa9",
  stockItems: "893da7b9284a4f0ab924458fcc26b592",
  stockMovements: "e9719b735c214ae8941b9d15bc1193b6",
  supplierContacts: "bf0e65e02f2e43bcb1e4ccefeeeb094f",
  // Stage Log lives in an env var (it is optional in the rest of the app).
  stageLog: process.env.NOTION_STAGE_LOG_DB_ID || null,
};

async function notionQueryAll(databaseId, notionHeaders) {
  const results = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify(Object.assign({ page_size: 100 }, cursor ? { start_cursor: cursor } : {})),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || `Notion query failed (${res.status})`);
      err.statusCode = res.status;
      throw err;
    }
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return results;
}

export async function fetchSnapshot(notionToken) {
  const notionHeaders = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
  const databases = {};
  const counts = {};
  for (const [name, id] of Object.entries(DATABASES)) {
    if (!id) {
      databases[name] = null; // not configured (e.g. Stage Log env unset)
      counts[name] = null;
      continue;
    }
    const rows = await notionQueryAll(id, notionHeaders);
    databases[name] = { databaseId: id, rows };
    counts[name] = rows.length;
  }
  return {
    generatedAt: new Date().toISOString(),
    source: "notion",
    notionVersion: NOTION_VERSION,
    counts,
    databases,
  };
}

// Commit one file to a private repo via the GitHub Contents API. The path
// carries a full timestamp, so each run is a new file (never an update),
// which means no blob-sha lookup and no chance of clobbering a prior day.
export async function commitToGitHub({ token, repo, branch, path, json }) {
  const content = Buffer.from(json, "utf8").toString("base64");
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "exhale-crm-backup",
    },
    body: JSON.stringify({
      message: `CRM backup ${path}`,
      content,
      branch,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GitHub commit failed (${res.status}): ${data.message || "unknown error"}`);
  }
  return data.content && data.content.html_url;
}

export default async function handler() {
  const notionToken = process.env.NOTION_API_KEY;
  const ghToken = process.env.BACKUP_GITHUB_TOKEN;
  const repo = process.env.BACKUP_GITHUB_REPO;
  const branch = process.env.BACKUP_GITHUB_BRANCH || "main";

  const missing = [];
  if (!notionToken) missing.push("NOTION_API_KEY");
  if (!ghToken) missing.push("BACKUP_GITHUB_TOKEN");
  if (!repo) missing.push("BACKUP_GITHUB_REPO");
  if (missing.length) {
    const msg = `crm-backup: missing env: ${missing.join(", ")}`;
    console.error(msg);
    return new Response(msg, { status: 500 });
  }

  try {
    const snapshot = await fetchSnapshot(notionToken);
    const json = JSON.stringify(snapshot, null, 2);

    const now = new Date();
    const stamp = now.toISOString().replace(/:/g, "-").replace(/\.\d+Z$/, "Z");
    const path = `crm/${now.getUTCFullYear()}/${stamp}.json`;

    const url = await commitToGitHub({ token: ghToken, repo, branch, path, json });
    const summary = `crm-backup ok: ${path} (${Object.entries(snapshot.counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")})`;
    console.log(summary, url || "");
    return new Response(summary, { status: 200 });
  } catch (err) {
    console.error("crm-backup failed:", err.message);
    return new Response(`crm-backup failed: ${err.message}`, { status: 500 });
  }
}

// @daily = once every 24h. Netlify also accepts standard cron, e.g.
// "0 1 * * *" for 01:00 UTC (03:00 SAST). Kept as @daily; Netlify picks
// the hour and keeps it stable.
export const config = { schedule: "@daily" };
