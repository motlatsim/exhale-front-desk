// netlify/functions/crm-update.js
// Updates an existing "Website Enquiries" page — used by the CRM app
// when you move a card between stages, toggle deposit paid, set an
// installed date, or save notes. The browser never sees NOTION_API_KEY.

const VALID_STATUSES = [
  "Lead", "Design Selection", "Quotation", "Deposit Confirmed", "Artwork",
  "Artwork Approval", "Manufacturing", "Ready to Install", "Installation",
  "After-Installation Service", "Lost"
];
const VALID_INTERESTS = ["Tombstones", "Plaques", "Grave Restorations", "Memorial Books", "Not sure yet"];
const VALID_TOWNS = ["Lusikisiki", "Port St Johns", "Flagstaff", "Other"];
const VALID_PAYMENT_OPTIONS = ["Laybuy", "Credit", "Insurance Policy", "Once-off Settlement"];
const VALID_CREDIT_STATUSES = ["Not Applied", "Applied", "Approved", "Declined", "Active", "Settled"];
const VALID_SIGNOFF_STATUSES = ["Not Sent", "Sent", "Approved", "Changes Requested"];
const VALID_TERRAIN_TYPES = ["Standard Driveway", "4x4 Only", "Rough Gravel", "Rocky Ground"];
const VALID_GROUND_PROFILES = ["Standard Soil", "Sand/Soft Earth", "Rock Slab"];
const VALID_LOST_REASONS = ["Price too high", "Chose a competitor", "Went cold / unresponsive", "No longer needed", "Financing fell through", "Timing not right", "Other"];
const VALID_LEAD_SOURCES = ["Website form", "WhatsApp (Peach)", "Walk-in", "Referral", "Funeral home", "Facebook", "Other"];
const { requireKey } = require("./_require-key");

const STAGE_LOG_DATABASE_ID = process.env.NOTION_STAGE_LOG_DB_ID;

// Notion caps a single rich_text block at 2000 chars; split longer JSON
// blobs (like Proposal Items) across multiple blocks instead of truncating.
function chunkedRichText(content, chunkSize = 1900) {
  const text = String(content);
  const blocks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    blocks.push({ text: { content: text.slice(i, i + chunkSize) } });
  }
  return blocks.length ? blocks : [{ text: { content: "" } }];
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const pageId = (data.id || "").trim();
  if (!pageId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing enquiry id." }) };
  }

  const properties = {};

  if (data.name !== undefined) {
    properties["Name"] = { title: [{ text: { content: String(data.name).slice(0, 2000) } }] };
  }
  if (data.phone !== undefined) {
    properties["Phone"] = { phone_number: data.phone };
  }
  if (data.email !== undefined) {
    properties["Email"] = { email: data.email || null };
  }
  if (data.interest !== undefined && VALID_INTERESTS.includes(data.interest)) {
    properties["Interested In"] = { select: { name: data.interest } };
  }
  if (data.town !== undefined) {
    properties["Town"] = data.town && VALID_TOWNS.includes(data.town) ? { select: { name: data.town } } : { select: null };
  }
  if (data.status !== undefined && VALID_STATUSES.includes(data.status)) {
    // Marking a family Lost without a reason makes churn unanalyzable —
    // enforced here, not just in the UI, so no path around it can skip it.
    if (data.status === "Lost" && !VALID_LOST_REASONS.includes(data.lost_reason)) {
      return { statusCode: 400, body: JSON.stringify({ error: "A lost reason is required to mark a family Lost." }) };
    }
    properties["Status"] = { select: { name: data.status } };
  }
  if (data.lost_reason !== undefined) {
    properties["Lost Reason"] = data.lost_reason && VALID_LOST_REASONS.includes(data.lost_reason) ? { select: { name: data.lost_reason } } : { select: null };
  }
  if (data.lost_reason_detail !== undefined) {
    properties["Lost Reason Detail"] = { rich_text: [{ text: { content: String(data.lost_reason_detail).slice(0, 2000) } }] };
  }
  if (data.notes !== undefined) {
    properties["Notes"] = { rich_text: [{ text: { content: String(data.notes).slice(0, 2000) } }] };
  }
  if (data.deposit_paid !== undefined) {
    properties["Deposit Paid"] = { checkbox: !!data.deposit_paid };
  }
  if (data.deposit_date !== undefined) {
    properties["Deposit Date"] = data.deposit_date ? { date: { start: data.deposit_date } } : { date: null };
  }
  if (data.installed_date !== undefined) {
    properties["Installed Date"] = data.installed_date ? { date: { start: data.installed_date } } : { date: null };
  }
  if (data.deceased_name !== undefined) {
    properties["Deceased Name"] = { rich_text: [{ text: { content: String(data.deceased_name).slice(0, 2000) } }] };
  }
  if (data.date_of_birth !== undefined) {
    properties["Date of Birth"] = { rich_text: [{ text: { content: String(data.date_of_birth).slice(0, 200) } }] };
  }
  if (data.date_of_death !== undefined) {
    properties["Date of Death"] = { rich_text: [{ text: { content: String(data.date_of_death).slice(0, 200) } }] };
  }
  if (data.cemetery !== undefined) {
    properties["Cemetery"] = { rich_text: [{ text: { content: String(data.cemetery).slice(0, 2000) } }] };
  }
  if (data.plot_number !== undefined) {
    properties["Plot Number"] = { rich_text: [{ text: { content: String(data.plot_number).slice(0, 200) } }] };
  }
  if (data.payment_option !== undefined) {
    properties["Payment Option"] = data.payment_option && VALID_PAYMENT_OPTIONS.includes(data.payment_option) ? { select: { name: data.payment_option } } : { select: null };
  }
  if (data.quoted_value !== undefined) {
    properties["Quoted Value"] = { number: data.quoted_value === null || data.quoted_value === "" ? null : Number(data.quoted_value) };
  }
  if (data.amount_paid !== undefined) {
    properties["Amount Paid"] = { number: data.amount_paid === null || data.amount_paid === "" ? null : Number(data.amount_paid) };
  }
  if (data.payment_plan !== undefined) {
    properties["Payment Plan"] = { rich_text: [{ text: { content: String(data.payment_plan).slice(0, 2000) } }] };
  }
  if (data.production_progress !== undefined) {
    properties["Production Progress"] = { number: data.production_progress === null || data.production_progress === "" ? null : Number(data.production_progress) };
  }
  if (data.assigned_to !== undefined) {
    properties["Assigned To"] = { rich_text: [{ text: { content: String(data.assigned_to).slice(0, 2000) } }] };
  }
  if (data.memorial_spec !== undefined) {
    properties["Memorial Spec"] = { rich_text: [{ text: { content: String(data.memorial_spec).slice(0, 2000) } }] };
  }
  if (data.unveiling !== undefined) {
    properties["Unveiling Date"] = { rich_text: [{ text: { content: String(data.unveiling).slice(0, 2000) } }] };
  }
  if (data.landmark !== undefined) {
    properties["Landmark"] = { rich_text: [{ text: { content: String(data.landmark).slice(0, 2000) } }] };
  }
  if (data.site_access !== undefined) {
    properties["Site Access"] = { rich_text: [{ text: { content: String(data.site_access).slice(0, 2000) } }] };
  }
  if (data.location_pin !== undefined) {
    properties["Location Pin"] = { url: data.location_pin || null };
  }
  if (data.estimate_number !== undefined) {
    properties["Estimate Number"] = { rich_text: [{ text: { content: String(data.estimate_number).slice(0, 100) } }] };
  }
  // Unveiling Date stays rich_text — some existing values are month/year-only
  // ("December 2026"), not a real day, so it isn't safe to force into a Date
  // property yet. Estimate/Invoice/Signoff Date are now real Notion Date
  // properties (converted 2026-09-21; every existing value in them was
  // already a clean ISO date written by this app, so nothing was lost),
  // matching Deposit Date / Installed Date.
  if (data.estimate_date !== undefined) {
    properties["Estimate Date"] = data.estimate_date ? { date: { start: data.estimate_date } } : { date: null };
  }
  if (data.invoice_number !== undefined) {
    properties["Invoice Number"] = { rich_text: [{ text: { content: String(data.invoice_number).slice(0, 100) } }] };
  }
  if (data.invoice_date !== undefined) {
    properties["Invoice Date"] = data.invoice_date ? { date: { start: data.invoice_date } } : { date: null };
  }
  if (data.credit_provider !== undefined) {
    properties["Credit Provider"] = { rich_text: [{ text: { content: String(data.credit_provider).slice(0, 200) } }] };
  }
  if (data.credit_status !== undefined) {
    properties["Credit Status"] = data.credit_status && VALID_CREDIT_STATUSES.includes(data.credit_status) ? { select: { name: data.credit_status } } : { select: null };
  }
  if (data.credit_approved_amount !== undefined) {
    properties["Credit Approved Amount"] = { number: data.credit_approved_amount === null || data.credit_approved_amount === "" ? null : Number(data.credit_approved_amount) };
  }
  if (data.credit_reference !== undefined) {
    properties["Credit Reference"] = { rich_text: [{ text: { content: String(data.credit_reference).slice(0, 200) } }] };
  }
  if (data.installments !== undefined) {
    properties["Installments"] = { rich_text: [{ text: { content: String(data.installments).slice(0, 2000) } }] };
  }
  if (data.proposal_items !== undefined) {
    properties["Proposal Items"] = { rich_text: chunkedRichText(data.proposal_items) };
  }
  if (data.signoff_token !== undefined) {
    properties["Signoff Token"] = { rich_text: [{ text: { content: String(data.signoff_token).slice(0, 200) } }] };
  }
  if (data.signoff_status !== undefined && VALID_SIGNOFF_STATUSES.includes(data.signoff_status)) {
    properties["Signoff Status"] = { select: { name: data.signoff_status } };
  }
  if (data.terrain_type !== undefined) {
    properties["Terrain Type"] = data.terrain_type && VALID_TERRAIN_TYPES.includes(data.terrain_type) ? { select: { name: data.terrain_type } } : { select: null };
  }
  if (data.ground_profile !== undefined) {
    properties["Ground Profile"] = data.ground_profile && VALID_GROUND_PROFILES.includes(data.ground_profile) ? { select: { name: data.ground_profile } } : { select: null };
  }
  if (data.checklist_slab !== undefined) {
    properties["Checklist Slab"] = { checkbox: !!data.checklist_slab };
  }
  if (data.checklist_stencil !== undefined) {
    properties["Checklist Stencil"] = { checkbox: !!data.checklist_stencil };
  }
  if (data.checklist_engraved !== undefined) {
    properties["Checklist Engraved"] = { checkbox: !!data.checklist_engraved };
  }
  if (data.checklist_polished !== undefined) {
    properties["Checklist Polished"] = { checkbox: !!data.checklist_polished };
  }
  if (data.tracker_token !== undefined) {
    properties["Tracker Token"] = { rich_text: [{ text: { content: String(data.tracker_token).slice(0, 200) } }] };
  }
  if (data.lead_source !== undefined) {
    properties["Lead Source"] = data.lead_source && VALID_LEAD_SOURCES.includes(data.lead_source) ? { select: { name: data.lead_source } } : { select: null };
  }
  if (data.referred_by !== undefined) {
    properties["Referred By"] = { rich_text: [{ text: { content: String(data.referred_by).slice(0, 200) } }] };
  }

  if (Object.keys(properties).length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nothing to update." }) };
  }

  const notionHeaders = {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  };

  // Whenever the Status is changing, read the page first — both for the
  // Manufacturing gate below and to know the "From" stage for the Stage Log.
  let currentStatus = null;
  if (properties["Status"]) {
    try {
      const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers: notionHeaders });
      const page = await pageRes.json();
      if (!pageRes.ok) return { statusCode: pageRes.status, body: JSON.stringify({ error: page.message || "Could not read the family record." }) };
      const p = page.properties || {};
      currentStatus = (p["Status"] && p["Status"].select && p["Status"].select.name) || "";

      // The 50% deposit + design sign-off gate: stone cutting can't start
      // until at least half the quote is paid and the family has approved
      // the design. Enforced here (not just in the UI) since it's a hard
      // business rule.
      if (data.status === "Manufacturing") {
        const currentQuoted = (p["Quoted Value"] && p["Quoted Value"].number) || 0;
        const currentPaid = (p["Amount Paid"] && p["Amount Paid"].number) || 0;
        const currentSignoff = (p["Signoff Status"] && p["Signoff Status"].select && p["Signoff Status"].select.name) || "";

        const quoted = data.quoted_value !== undefined ? Number(data.quoted_value) || 0 : currentQuoted;
        const paid = data.amount_paid !== undefined ? Number(data.amount_paid) || 0 : currentPaid;
        const signoff = data.signoff_status !== undefined ? data.signoff_status : currentSignoff;

        const depositMet = quoted > 0 && paid / quoted >= 0.5;
        const designApproved = signoff === "Approved";
        if (!depositMet || !designApproved) {
          const missing = [];
          if (!depositMet) missing.push(quoted > 0 ? "at least 50% of the quote paid (currently " + Math.round((paid / quoted) * 100) + "%)" : "a quoted value and at least 50% paid");
          if (!designApproved) missing.push("the family's design sign-off");
          return { statusCode: 400, body: JSON.stringify({ error: "Can't start manufacturing yet — still needs " + missing.join(" and ") + "." }) };
        }
      }
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties })
    });
    const result = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: result.message || "Notion update failed" }) };
    }

    // Log the stage change — best effort. A failed log write must not fail
    // the move itself, since the family's stage already changed above.
    if (properties["Status"] && STAGE_LOG_DATABASE_ID && currentStatus !== data.status) {
      try {
        const logProperties = {
          "Change": { title: [{ text: { content: (currentStatus || "—") + " → " + data.status } }] },
          "Family": { relation: [{ id: pageId }] },
          "To": { select: { name: data.status } },
          "Changed At": { date: { start: new Date().toISOString() } },
          "Baseline": { checkbox: false }
        };
        if (currentStatus) logProperties["From"] = { select: { name: currentStatus } };
        if (data.status === "Lost" && data.lost_reason) logProperties["Lost Reason"] = { select: { name: data.lost_reason } };
        const logRes = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: notionHeaders,
          body: JSON.stringify({ parent: { database_id: STAGE_LOG_DATABASE_ID }, properties: logProperties })
        });
        if (!logRes.ok) {
          const logResult = await logRes.json();
          console.error("Stage Log write failed:", logResult.message || logRes.status);
        }
      } catch (logErr) {
        console.error("Stage Log write failed:", logErr.message);
      }
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
