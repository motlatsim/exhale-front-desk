# exhale-front-desk

Small front-desk dashboard that fetches data from Pipedrive and Peach and renders a monitoring UI.

Important environment variables
- PIPEDRIVE_API_TOKEN - API token with read access to Pipedrive data used by netlify/functions/pipedrive-data.js
- PEACH_API_TOKEN - API token used by netlify/functions/peach-data.js

Deployment
- This project is intended to be deployed on Netlify (the code includes Netlify Functions under netlify/functions).
- Add the two tokens above to Netlify site environment variables (Site settings → Build & deploy → Environment).

Security note
- The repository includes a client-side "password gate": this is only a client-side deterrent (the hash is embedded in the HTML). It is NOT secure. For real protection, use Netlify Access Control / Identity or require server-side authentication.

Changes in this PR
- Hardened Netlify functions (safer error handling, small in-memory cache for Pipedrive function)
- Peach function uses Bearer Authorization header and returns a consistent JSON shape
- Added lightweight CI: ESLint + Jest scaffold and a GitHub Actions workflow
- Added minimal README and test for a small helper

If you want me to also remove the client-side gate or wire Netlify Identity, tell me and I can prepare that in a follow-up PR.
