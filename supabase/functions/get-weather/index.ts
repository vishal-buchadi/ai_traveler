import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination } = await req.json();
    if (!destination) {
      return new Response(JSON.stringify({ error: "Destination required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Open-Meteo (free, no API key needed) with geocoding
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`);
    const geoData = await geoRes.json();

    if (!geoData.results?.length) {
      return new Response(JSON.stringify({ temp: 22, description: "Clear sky", icon: "sun" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { latitude, longitude } = geoData.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
    );
    const weatherData = await weatherRes.json();

    const temp = weatherData.current?.temperature_2m || 22;
    const code = weatherData.current?.weather_code || 0;

    let description = "Clear sky";
    let icon = "sun";
    if (code >= 61) { description = "Rainy"; icon = "rain"; }
    else if (code >= 45) { description = "Foggy"; icon = "cloud"; }
    else if (code >= 2) { description = "Partly cloudy"; icon = "cloud"; }

    return new Response(JSON.stringify({ temp, description, icon }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weather error:", e);
    return new Response(JSON.stringify({ temp: 22, description: "Clear sky", icon: "sun" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
