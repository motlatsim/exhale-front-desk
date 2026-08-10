// netlify/functions/pipedrive-data.js
// Hardened Pipedrive fetch with basic in-memory cache and safer error handling.

exports.handler = async function (event, context) {
  const token = process.env.PIPEDRIVE_API_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'PIPEDRIVE_API_TOKEN not set' }) };
  }

  // Very small in-memory cache to avoid hammering the upstream API on frequent refreshes.
  // Note: Netlify functions may be warm or cold; this cache only helps on warm instances.
  const TTL_MS = 60 * 1000; // 60 seconds
  if (!global.__pipedrive_cache) global.__pipedrive_cache = { value: null, expires: 0 };
  const now = Date.now();
  if (global.__pipedrive_cache.expires > now && global.__pipedrive_cache.value) {
    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify(global.__pipedrive_cache.value)
    };
  }

  try {
    const base = 'https://api.pipedrive.com/v1';
    const endpoints = [
      `${base}/deals?api_token=${token}&limit=200`,
      `${base}/stages?api_token=${token}`,
      `${base}/activities?api_token=${token}&limit=200&sort=due_date%20DESC`,
      `${base}/leads?api_token=${token}&limit=100`
    ];

    const resPromises = await Promise.all(endpoints.map(u => fetch(u)));

    // Check for non-OK responses first and build a sanitized error if any
    const notOk = resPromises.find(r => !r.ok);
    if (notOk) {
      const status = notOk.status;
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `Upstream Pipedrive returned status ${status}` })
      };
    }

    // Parse JSON safely
    const [dealsJson, stagesJson, activitiesJson, leadsJson] = await Promise.all(
      resPromises.map(async r => {
        try {
          return await r.json();
        } catch (err) {
          return { success: false, error: 'invalid_json' };
        }
      })
    );

    // Basic success check
    if (!dealsJson || !stagesJson || !activitiesJson || !leadsJson) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Invalid response from Pipedrive' }) };
    }

    // Sanitize payload we return (don't leak headers or upstream internals)
    const payload = {
      deals: dealsJson.data || [],
      stages: stagesJson.data || [],
      activities: activitiesJson.data || [],
      leads: leadsJson.data || []
    };

    // Store in cache
    global.__pipedrive_cache.value = payload;
    global.__pipedrive_cache.expires = Date.now() + TTL_MS;

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    console.error('pipedrive-data error', err && err.stack ? err.stack : err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error fetching Pipedrive data' }) };
  }
};
