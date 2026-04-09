import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, budget, numDays, interests } = await req.json();

    if (!destination || !budget || !numDays || !interests?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!AI_API_KEY) throw new Error("AI_API_KEY not configured");

    const systemPrompt = `You are an expert travel planner. Generate a detailed travel itinerary as valid JSON only, no markdown.

The JSON must have this exact structure:
{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "9:00 AM",
          "activity": "Description",
          "location": "Place name",
          "lat": 35.6762,
          "lng": 139.6503,
          "tip": "Optional insider tip"
        }
      ]
    }
  ],
  "hiddenGems": [
    {
      "name": "Hidden place name",
      "description": "Why it's special"
    }
  ],
  "budgetSplit": {
    "stay": 800,
    "food": 400,
    "travel": 300,
    "activities": 500
  }
}

Include 4-6 activities per day with realistic coordinates. Include 3-5 hidden gems. Budget split must sum to the total budget. Include practical tips for each activity.`;

    const userPrompt = `Create a ${numDays}-day itinerary for ${destination} with a budget of $${budget} USD. Interests: ${interests.join(", ")}. Include hidden gems and local favorites.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      throw new Error("Failed to parse AI response");
    }

    const itinerary = { days: parsed.days || [], hiddenGems: parsed.hiddenGems || [] };
    const budgetSplit = parsed.budgetSplit || { stay: budget * 0.4, food: budget * 0.25, travel: budget * 0.15, activities: budget * 0.2 };

    return new Response(JSON.stringify({ itinerary, budgetSplit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-itinerary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
