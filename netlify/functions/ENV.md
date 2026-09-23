Environment variables read by these functions (set in Netlify site settings):

- `NOTION_API_KEY` — integration token, used by every function that talks to Notion.
- `CRM_PASSWORD_HASH` — the CRM password, as a salted scrypt hash in the form
  `scrypt$N$r$p$salt$hash`. Generate it with `node tools/hash-password.js` and
  paste the printed line here; the password itself is never stored anywhere.
  If this is unset or malformed, `crm-auth.js` returns 500 and nobody can log
  in — it fails closed on purpose. Earlier versions kept a bare SHA-256 literal
  in `crm-auth.js`, which was public in this repo's history and therefore
  crackable offline; that hash is dead and the password behind it must not be
  reused.
- `CRM_SESSION_KEY` — the opaque value `crm-auth.js` hands back on a correct
  password, and that `_require-key.js` then demands as the `x-crm-key` header on
  every data function. It never expires and cannot be revoked per-device, so
  rotating it is what signs everyone out. It lives in `localStorage` on each
  staff device. `tools/hash-password.js` prints a fresh candidate alongside the
  password hash.
- `PEACH_API_TOKEN` — optional, used by `crm-create.js` for the WhatsApp hand-off.
- `NOTION_STAGE_LOG_DB_ID` — the "Stage Log" database (one row per family stage
  change, written by `crm-update.js`, read by `stage-log-list.js`). For this
  workspace: `bd30a53e-c9c2-4cac-890b-b87c0e2dd3db`. It lives under the same
  "Firm Branding" parent page as "Website Enquiries", so it should already be
  shared with the same integration — confirm in Notion (Database → ••• →
  Connections) if `stage-log-list.js` / stage moves ever 401 on this DB.
  If this var is unset, stage logging is skipped silently (no stage history,
  no error) and `stage-log-list.js` returns `{ entries: [], notConfigured: true }`.
