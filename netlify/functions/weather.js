// netlify/functions/weather.js
// 7-day forecast for a named town, for scheduling private-land installs
// around the weather. Uses Open-Meteo (no API key required): geocode the
// town name to coordinates, then pull the daily forecast for those
// coordinates. Defaults to South Africa in the geocoding search since
// every town this business deals with is there.

const { requireKey } = require("./_require-key");

// WMO weather codes -> a short label + emoji, per Open-Meteo's code table.
const WEATHER_CODES = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌦️"],
  56: ["Freezing drizzle", "🌦️"], 57: ["Freezing drizzle", "🌦️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy snow", "🌨️"], 77: ["Snow grains", "🌨️"],
  80: ["Light showers", "🌦️"], 81: ["Showers", "🌦️"], 82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"], 86: ["Snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm + hail", "⛈️"], 99: ["Thunderstorm + hail", "⛈️"]
};
function describeCode(code) {
  return WEATHER_CODES[code] || ["—", "🌡️"];
}

exports.handler = async function (event) {
  const unauthorized = requireKey(event);
  if (unauthorized) return unauthorized;

  const town = ((event.queryStringParameters && event.queryStringParameters.town) || "").trim();
  if (!town) return { statusCode: 400, body: JSON.stringify({ error: "Missing town." }) };

  try {
    const geoRes = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(town) + "&count=1&language=en&format=json&country=ZA"
    );
    let geo = await geoRes.json();
    if (!geoRes.ok) return { statusCode: geoRes.status, body: JSON.stringify({ error: "Could not look up that town." }) };

    // Fall back to a worldwide search if nothing matched within South Africa.
    if (!geo.results || !geo.results.length) {
      const wideRes = await fetch(
        "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(town) + "&count=1&language=en&format=json"
      );
      geo = await wideRes.json();
    }
    if (!geo.results || !geo.results.length) {
      return { statusCode: 404, body: JSON.stringify({ error: "Couldn't find a town called \"" + town + "\"." }) };
    }

    const place = geo.results[0];
    const forecastRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude +
      "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto&forecast_days=7"
    );
    const forecast = await forecastRes.json();
    if (!forecastRes.ok) return { statusCode: forecastRes.status, body: JSON.stringify({ error: "Could not load the forecast." }) };

    const daily = forecast.daily || {};
    const dates = daily.time || [];
    const codes = daily.weathercode || daily.weather_code || [];
    const highs = daily.temperature_2m_max || [];
    const lows = daily.temperature_2m_min || [];
    const precip = daily.precipitation_probability_max || [];

    const days = dates.map((date, i) => {
      const [label, icon] = describeCode(codes[i]);
      return {
        date,
        dayLabel: new Date(date + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "short" }),
        icon,
        condition: label,
        high: highs[i] !== undefined ? Math.round(highs[i]) : null,
        low: lows[i] !== undefined ? Math.round(lows[i]) : null,
        precipProbability: precip[i] !== undefined ? Math.round(precip[i]) : null
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        town: place.name,
        region: place.admin1 || "",
        country: place.country || "",
        days
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
