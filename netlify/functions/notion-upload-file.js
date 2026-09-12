// netlify/functions/notion-upload-file.js
// Uploads an image straight into a Notion "Files & media" property using
// Notion's File Upload API: create an upload, send the bytes, then
// reference the upload's id in a PATCH to the page.
//
// Written as a Netlify v2 (ESM, Web-standard Request/Response) function
// so multipart/form-data can be parsed with the built-in req.formData()
// — no dependency needed for this one file.
//
// Notion's Files property is a full-replace on every write: re-sending
// it only accepts newly-created file_upload ids, not the signed URLs
// Notion hands back for files already attached. So we keep our own
// running list of {id, name} pairs in a companion "<Property> Ids" text
// field and resend that whole list (plus the new upload) every time —
// that field is bookkeeping for this function only, not shown in the UI.

const NOTION_VERSION = "2022-06-28";
const MAX_BYTES = 19 * 1024 * 1024; // Notion's single-part cap is 20MB

export default async (req) => {
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  if (req.method !== "POST") return json(405, { error: "Method not allowed." });

  const sessionKey = process.env.CRM_SESSION_KEY;
  if (!sessionKey) return json(500, { error: "CRM_SESSION_KEY not set" });
  if (req.headers.get("x-crm-key") !== sessionKey) return json(401, { error: "Unauthorized" });

  const token = process.env.NOTION_API_KEY;
  if (!token) return json(500, { error: "NOTION_API_KEY not set" });

  let form;
  try {
    form = await req.formData();
  } catch (e) {
    return json(400, { error: "Invalid form data." });
  }

  const file = form.get("file");
  const pageId = form.get("page_id");
  const property = form.get("property");
  const idsProperty = form.get("ids_property"); // omit to replace the property with just this one file
  if (!file || typeof file === "string" || !pageId || !property) {
    return json(400, { error: "Missing file, page_id, or property." });
  }
  if (file.size > MAX_BYTES) return json(400, { error: "File is too large — please keep photos under 19MB." });

  const notionHeaders = { "Authorization": `Bearer ${token}`, "Notion-Version": NOTION_VERSION };

  try {
    // Step 1: create the upload slot.
    const createRes = await fetch("https://api.notion.com/v1/file_uploads", {
      method: "POST",
      headers: { ...notionHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "single_part" })
    });
    const created = await createRes.json();
    if (!createRes.ok) return json(createRes.status, { error: created.message || "Could not start the upload." });

    // Step 2: send the file bytes to that slot.
    const sendForm = new FormData();
    sendForm.append("file", file, file.name || "upload");
    const sendRes = await fetch(`https://api.notion.com/v1/file_uploads/${created.id}/send`, {
      method: "POST",
      headers: notionHeaders,
      body: sendForm
    });
    const sent = await sendRes.json();
    if (!sendRes.ok) return json(sendRes.status, { error: sent.message || "The upload didn't go through." });

    let updated = [{ id: created.id, name: file.name || "photo.jpg" }];
    const propertiesPatch = {};

    if (idsProperty) {
      // Step 3: read our own bookkeeping of previously-attached files for this property.
      const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers: notionHeaders });
      const page = await pageRes.json();
      if (!pageRes.ok) return json(pageRes.status, { error: page.message || "Could not read the family record." });
      const idsProp = page.properties && page.properties[idsProperty];
      const idsText = (idsProp && idsProp.rich_text && idsProp.rich_text.length) ? idsProp.rich_text.map(t => t.plain_text).join("") : "";
      let existing = [];
      try { existing = JSON.parse(idsText || "[]"); } catch (e) { existing = []; }
      updated = [...existing, { id: created.id, name: file.name || "photo.jpg" }];
      propertiesPatch[idsProperty] = { rich_text: [{ text: { content: JSON.stringify(updated).slice(0, 2000) } }] };
    }
    propertiesPatch[property] = { files: updated.map(f => ({ type: "file_upload", file_upload: { id: f.id }, name: f.name })) };

    // Step 4: attach the tracked upload(s) to the Files property (and save the tracking list, if any).
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: { ...notionHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: propertiesPatch })
    });
    const patched = await patchRes.json();
    if (!patchRes.ok) return json(patchRes.status, { error: patched.message || "Uploaded, but couldn't attach it to the record." });

    return json(200, { success: true, count: updated.length });
  } catch (err) {
    return json(500, { error: err.message });
  }
};

export const config = { path: "/.netlify/functions/notion-upload-file" };
