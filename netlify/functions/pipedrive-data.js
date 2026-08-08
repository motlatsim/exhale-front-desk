// netlify/functions/pipedrive-data.js
// Fetches deals + stages from Pipedrive's REST API using a server-side token.
// The browser never sees the token — it just calls this function.

export default async (req, context) => {
  const token = Netlify.env.get("PIPEDRIVE_API_TOKEN");

  if (!token) {
    return new Response(JSON.stringify({ error: "PIPEDRIVE_API_TOKEN not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const [dealsRes, stagesRes] = await Promise.all([
      fetch(`https://api.pipedrive.com/v1/deals?api_token=${token}&limit=200`),
      fetch(`https://api.pipedrive.com/v1/stages?api_token=${token}`)
    ]);

    const dealsJson = await dealsRes.json();
    const stagesJson = await stagesRes.json();

    if (!dealsJson.success || !stagesJson.success) {
      return new Response(JSON.stringify({ error: "Pipedrive API error", dealsJson, stagesJson }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ deals: dealsJson.data || [], stages: stagesJson.data || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/pipedrive-data"
};
