// netlify/functions/pipedrive-data.js
// Fetches deals + stages from Pipedrive's REST API using a server-side token.
// The browser never sees the token — it just calls this function.

exports.handler = async function (event) {
  const token = process.env.PIPEDRIVE_API_TOKEN;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (!token) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "PIPEDRIVE_API_TOKEN not set" }) };
  }

  try {
    const [dealsRes, stagesRes] = await Promise.all([
      fetch(`https://api.pipedrive.com/v1/deals?api_token=${token}&limit=200`),
      fetch(`https://api.pipedrive.com/v1/stages?api_token=${token}`)
    ]);

    const dealsJson = await dealsRes.json();
    const stagesJson = await stagesRes.json();

    if (!dealsJson.success || !stagesJson.success) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Pipedrive API error", dealsJson, stagesJson })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ deals: dealsJson.data || [], stages: stagesJson.data || [] })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
