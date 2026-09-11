// Netlify Function: receives the website enquiry form and creates a
// page in the "Website Enquiries" Notion database. Also hands the lead
// to Peach so the AI agent can start a qualifying WhatsApp conversation.
//
// Requires environment variables set in Netlify:
//   NOTION_API_KEY   — Notion integration token (same one used by log-feedback.js
//                       for the Customer Feedback database). Must be shared with
//                       the "Website Enquiries" database too (Notion → •••  → Connections).
//   PEACH_API_TOKEN  — Peach API token (optional; hand-off is best-effort)
//
// NOTE: Pipedrive is no longer used for website enquiries as of this version.

const NOTION_DATABASE_ID = '809dabc9-23dc-4932-9dee-525adb153223';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  const notionToken = process.env.NOTION_API_KEY;
  if (!notionToken) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is not configured yet. Please WhatsApp us directly.' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid submission.' }) };
  }

  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();
  const email = (data.email || '').trim();
  const interest = (data.interest || 'Not sure yet').trim();
  const message = (data.message || '').trim();
  const town = (data.town || '').trim();
  const landmark = (data.landmark || '').trim();
  const unveiling = (data.unveiling || '').trim();
  const terrain = Array.isArray(data.terrain) ? data.terrain : [];
  const location = (data.location || '').trim();

  // Basic honeypot spam check — a hidden field real users never fill in
  if (data.company) {
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (!name || !phone) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name and phone number are required.' }) };
  }

  // Lenient check — we flag unusual formats rather than reject, so a real
  // enquiry is never silently lost just because our regex is imperfect.
  const cleanedPhone = phone.replace(/[\s\-()]/g, '');
  const phoneLooksValid = /^\+?27\d{9}$/.test(cleanedPhone) || /^0\d{9}$/.test(cleanedPhone);

  function toE164(raw) {
    const cleaned = raw.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return cleaned;
    if (/^27\d{9}$/.test(cleaned)) return '+' + cleaned;
    if (/^0\d{9}$/.test(cleaned)) return '+27' + cleaned.slice(1);
    return cleaned; // unrecognized format — pass through as-is rather than block sending
  }

  const VALID_INTERESTS = ['Tombstones', 'Plaques', 'Grave Restorations', 'Memorial Books', 'Not sure yet'];
  const VALID_TOWNS = ['Lusikisiki', 'Port St Johns', 'Flagstaff', 'Other'];

  try {
    console.log('create-lead: starting, name=' + name + ' phone=' + phone);

    // 1. Build the Notion page properties
    const properties = {
      'Name': { title: [{ text: { content: name } }] },
      'Phone': { phone_number: phone },
      'Interested In': { select: { name: VALID_INTERESTS.includes(interest) ? interest : 'Not sure yet' } },
      'Phone Looks Valid': { checkbox: phoneLooksValid },
      'Status': { select: { name: 'Lead' } },
      'Source': { select: { name: 'exhaleat.com quote form' } },
      'Submitted At': { date: { start: new Date().toISOString() } }
    };
    if (email) properties['Email'] = { email: email };
    if (message) properties['Message'] = { rich_text: [{ text: { content: message.slice(0, 2000) } }] };
    if (town && VALID_TOWNS.includes(town)) properties['Town'] = { select: { name: town } };
    if (landmark) properties['Landmark'] = { rich_text: [{ text: { content: landmark.slice(0, 2000) } }] };
    if (unveiling) properties['Unveiling Date'] = { rich_text: [{ text: { content: unveiling.slice(0, 500) } }] };
    if (terrain.length) properties['Site Access'] = { rich_text: [{ text: { content: terrain.join(', ') } }] };
    if (location) properties['Location Pin'] = { url: location };

    // 2. Create the page in the Website Enquiries database
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties
      })
    });
    const notionData = await notionRes.json();
    console.log('create-lead: notion response status=' + notionRes.status + ' body=' + JSON.stringify(notionData));

    if (!notionRes.ok) {
      throw new Error('Could not save enquiry to Notion: ' + (notionData.message || JSON.stringify(notionData)));
    }

    console.log('create-lead: success, notionPageId=' + notionData.id);

    // 3. Best-effort: hand the lead to Peach so the AI agent can start a
    // qualifying WhatsApp conversation. This is additive — if it fails,
    // the Notion enquiry above still exists, so nothing is lost.
    const peachToken = process.env.PEACH_API_TOKEN;
    if (peachToken) {
      try {
        const peachRes = await fetch('https://app.trypeach.io/api/v1/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': peachToken
          },
          body: JSON.stringify({
            event_type: 'connect_to_ai_agent',
            contact: { phone_number: toE164(phone), name },
            template_message: {
              whats_app_template_id: 'wat_PxwevX542rXwub51ZrzEqAlM',
              liquid_values: { placeholder_1: name, placeholder_2: interest }
            },
            ai_agent: { id: 'aiflw_WgzOAxPymYWNu3RpdQn9MwYq' }
          })
        });
        const peachBody = await peachRes.text();
        console.log('create-lead: peach event status=' + peachRes.status + ' phone_sent=' + toE164(phone) + ' body=' + peachBody);
      } catch (peachErr) {
        console.error('create-lead: Peach event push failed (non-fatal) — ' + peachErr.message);
      }
    } else {
      console.log('create-lead: PEACH_API_TOKEN not set, skipping Peach hand-off');
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('create-lead: FAILED — ' + (err && err.message ? err.message : err));
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Something went wrong sending your enquiry. Please WhatsApp us directly.' })
    };
  }
};
