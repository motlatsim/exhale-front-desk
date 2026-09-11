// netlify/functions/notion-enquiries.js
// Fetches recent enquiries from the "Website Enquiries" Notion database
// server-side using NOTION_API_KEY. The browser never sees the token —
// it just calls this function. Replaces the old pipedrive-data.js.

const NOTION_DATABASE_ID = "809dabc9-23dc-4932-9dee-525adb153223";

exports.handler = async function (event, context) {
  const token = process.env.NOTION_API_KEY;

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "NOTION_API_KEY not set" }) };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sorts: [{ property: "Submitted At", direction: "descending" }],
        page_size: 100
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Notion query failed" }) };
    }

    // Flatten Notion's verbose property format into something simple for the frontend
    const enquiries = (data.results || []).map(page => {
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
        in_memory_of: richText("In Memory Of"),
        quoted_value: (p["Quoted Value"] && p["Quoted Value"].number) || 0,
        amount_paid: (p["Amount Paid"] && p["Amount Paid"].number) || 0,
        payment_plan: richText("Payment Plan"),
        production_progress: (p["Production Progress"] && p["Production Progress"].number) || 0,
        assigned_to: richText("Assigned To")
      };
    });

    return { statusCode: 200, body: JSON.stringify({ enquiries }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
