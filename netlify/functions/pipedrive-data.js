// netlify/functions/pipedrive-data.js
// Fetches deals + stages + activities from Pipedrive's REST API using a server-side token.
// The browser never sees the token — it just calls this function.

exports.handler = async function (event, context) {
  const token = process.env.PIPEDRIVE_API_TOKEN;

  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "PIPEDRIVE_API_TOKEN not set" }) };
  }

  try {
    const [dealsRes, stagesRes, activitiesRes] = await Promise.all([
      fetch(`https://api.pipedrive.com/v1/deals?api_token=${token}&limit=200`),
      fetch(`https://api.pipedrive.com/v1/stages?api_token=${token}`),
      fetch(`https://api.pipedrive.com/v1/activities?api_token=${token}&limit=200&sort=due_date%20DESC`)
    ]);

    const dealsJson = await dealsRes.json();
    const stagesJson = await stagesRes.json();
    const activitiesJson = await activitiesRes.json();

    if (!dealsJson.success || !stagesJson.success || !activitiesJson.success) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Pipedrive API error", dealsJson, stagesJson, activitiesJson })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        deals: dealsJson.data || [],
        stages: stagesJson.data || [],
        activities: activitiesJson.data || []
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
