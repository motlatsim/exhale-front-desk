Environment variables read by these functions (set in Netlify site settings):

- `NOTION_API_KEY` — integration token, used by every function that talks to Notion.
- `CRM_ACCESS_PASSWORD` / whatever `crm-auth.js` checks — the CRM password gate.
- `PEACH_API_TOKEN` — optional, used by `crm-create.js` for the WhatsApp hand-off.
- `NOTION_STAGE_LOG_DB_ID` — the "Stage Log" database (one row per family stage
  change, written by `crm-update.js`, read by `stage-log-list.js`). For this
  workspace: `bd30a53e-c9c2-4cac-890b-b87c0e2dd3db`. It lives under the same
  "Firm Branding" parent page as "Website Enquiries", so it should already be
  shared with the same integration — confirm in Notion (Database → ••• →
  Connections) if `stage-log-list.js` / stage moves ever 401 on this DB.
  If this var is unset, stage logging is skipped silently (no stage history,
  no error) and `stage-log-list.js` returns `{ entries: [], notConfigured: true }`.
