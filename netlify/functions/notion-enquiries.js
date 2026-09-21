// netlify/functions/notion-enquiries.js
// Fetches recent enquiries from the "Website Enquiries" Notion database
// server-side using NOTION_API_KEY. The browser never sees the token —
// it just calls this function. Replaces the old pipedrive-data.js.

const { requireKey } = require("./_require-key");
const { notionQueryAll } = require("./_notion-query-all");

const NOTION_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";

exports.handler = async function (event, context) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NOTION_API_KEY;

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };
  }

  try {
    const notionHeaders = {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    };
    const pages = await notionQueryAll(NOTION_DATABASE_ID, {
      sorts: [{ property: "Submitted At", direction: "descending" }]
    }, notionHeaders);

    // Flatten Notion's verbose property format into something simple for the frontend
    const enquiries = pages.map(page => {
      const p = page.properties || {};
      const title = p["Name"] && p["Name"].title;
      const name = title && title.length ? title.map(t => t.plain_text).join("") : "Unknown";
      const richText = key => {
        const rt = p[key] && p[key].rich_text;
        return rt && rt.length ? rt.map(t => t.plain_text).join("") : "";
      };
      return {
        id: page.id,
        name,
        phone: (p["Phone"] && p["Phone"].phone_number) || "",
        email: (p["Email"] && p["Email"].email) || "",
        interest: (p["Interested In"] && p["Interested In"].select && p["Interested In"].select.name) || "",
        message: richText("Message"),
        town: (p["Town"] && p["Town"].select && p["Town"].select.name) || "",
        landmark: richText("Landmark"),
        unveiling: richText("Unveiling Date"),
        site_access: richText("Site Access"),
        location_pin: (p["Location Pin"] && p["Location Pin"].url) || "",
        phone_valid: !!(p["Phone Looks Valid"] && p["Phone Looks Valid"].checkbox),
        status: (p["Status"] && p["Status"].select && p["Status"].select.name) || "Lead",
        deposit_paid: !!(p["Deposit Paid"] && p["Deposit Paid"].checkbox),
        deposit_date: (p["Deposit Date"] && p["Deposit Date"].date && p["Deposit Date"].date.start) || "",
        installed_date: (p["Installed Date"] && p["Installed Date"].date && p["Installed Date"].date.start) || "",
        notes: richText("Notes"),
        submitted_at: (p["Submitted At"] && p["Submitted At"].date && p["Submitted At"].date.start) || page.created_time,
        updated_at: page.last_edited_time,
        url: page.url,
        deceased_name: richText("Deceased Name"),
        date_of_birth: richText("Date of Birth"),
        date_of_death: richText("Date of Death"),
        cemetery: richText("Cemetery"),
        plot_number: richText("Plot Number"),
        quoted_value: (p["Quoted Value"] && p["Quoted Value"].number) || 0,
        amount_paid: (p["Amount Paid"] && p["Amount Paid"].number) || 0,
        payment_option: (p["Payment Option"] && p["Payment Option"].select && p["Payment Option"].select.name) || "",
        payment_plan: richText("Payment Plan"),
        production_progress: (p["Production Progress"] && p["Production Progress"].number) || 0,
        assigned_to: richText("Assigned To"),
        memorial_spec: richText("Memorial Spec"),
        estimate_number: richText("Estimate Number"),
        estimate_date: (p["Estimate Date"] && p["Estimate Date"].date && p["Estimate Date"].date.start) || "",
        invoice_number: richText("Invoice Number"),
        invoice_date: (p["Invoice Date"] && p["Invoice Date"].date && p["Invoice Date"].date.start) || "",
        credit_provider: richText("Credit Provider"),
        credit_status: (p["Credit Status"] && p["Credit Status"].select && p["Credit Status"].select.name) || "",
        credit_approved_amount: (p["Credit Approved Amount"] && p["Credit Approved Amount"].number) || 0,
        credit_reference: richText("Credit Reference"),
        installments: richText("Installments"),
        proposal_items: richText("Proposal Items"),
        design_images: ((p["Design Images"] && p["Design Images"].files) || []).map(f => ({
          name: f.name || "",
          url: f.file ? f.file.url : (f.external ? f.external.url : "")
        })).filter(f => f.url),
        reference_photos: ((p["Reference Photos"] && p["Reference Photos"].files) || []).map(f => ({
          name: f.name || "",
          url: f.file ? f.file.url : (f.external ? f.external.url : "")
        })).filter(f => f.url),
        signoff_token: richText("Signoff Token"),
        signoff_status: (p["Signoff Status"] && p["Signoff Status"].select && p["Signoff Status"].select.name) || "",
        signoff_date: (p["Signoff Date"] && p["Signoff Date"].date && p["Signoff Date"].date.start) || "",
        signoff_sent_at: (p["Signoff Sent At"] && p["Signoff Sent At"].date && p["Signoff Sent At"].date.start) || "",
        signoff_note: richText("Signoff Note"),
        terrain_type: (p["Terrain Type"] && p["Terrain Type"].select && p["Terrain Type"].select.name) || "",
        ground_profile: (p["Ground Profile"] && p["Ground Profile"].select && p["Ground Profile"].select.name) || "",
        checklist_slab: !!(p["Checklist Slab"] && p["Checklist Slab"].checkbox),
        checklist_stencil: !!(p["Checklist Stencil"] && p["Checklist Stencil"].checkbox),
        checklist_engraved: !!(p["Checklist Engraved"] && p["Checklist Engraved"].checkbox),
        checklist_polished: !!(p["Checklist Polished"] && p["Checklist Polished"].checkbox),
        tracker_token: richText("Tracker Token"),
        lost_reason: (p["Lost Reason"] && p["Lost Reason"].select && p["Lost Reason"].select.name) || "",
        lost_reason_detail: richText("Lost Reason Detail"),
        lead_source: (p["Lead Source"] && p["Lead Source"].select && p["Lead Source"].select.name) || "",
        referred_by: richText("Referred By")
      };
    });

    return { statusCode: 200, body: JSON.stringify({ enquiries }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
