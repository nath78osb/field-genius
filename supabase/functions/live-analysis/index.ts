import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { matchContext, ballHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ballSummary = ballHistory
      .map((b: any, i: number) => `Ball ${i + 1}: ${b.result}${b.runs > 0 ? ` (${b.runs} runs)` : ""} - ${b.shotType !== "unknown" ? b.shotType : ""} ${b.shotDirection !== "unknown" ? "to " + b.shotDirection : ""}`.trim())
      .join("\n");

    const prompt = `You are an expert cricket captain and fielding strategist analyzing a live match ball-by-ball.

MATCH CONTEXT:
- Format: ${matchContext.format}
- Batter: ${matchContext.batterHand}-handed, ${matchContext.batterType} style
- Bowler: ${matchContext.bowlerArm}-arm ${matchContext.bowlerType}
- Pitch: ${matchContext.pitchCondition}
- Score: ${matchContext.runs}/${matchContext.wickets} (${matchContext.overs}.${matchContext.balls} overs)
- Is new batter: ${matchContext.isNewBatter ? "YES - just came in, " + matchContext.ballsSinceNewBatter + " balls faced" : "No"}

BALL-BY-BALL DATA (most recent spell):
${ballSummary || "No balls yet"}

COORDINATE SYSTEM:
- x: NEGATIVE = OFF SIDE, POSITIVE = LEG SIDE (for right-hander; FLIP for left-hander)  
- y: NEGATIVE = BEHIND batsman (keeper end, top of screen), POSITIVE = IN FRONT (bowler end, bottom of screen)
- Wicketkeeper near (0, -0.15), Bowler near (0, 0.15)

Analyze the batter's patterns and return a JSON object with:
1. "suggestions": array of 2-4 objects with:
   - "message": actionable suggestion (e.g. "Batter targeting leg side → move mid-wicket deeper")
   - "type": "field-change" | "bowling" | "pressure" | "info"
   - "priority": "high" | "medium" | "low"

2. "fielders": array of exactly 11 fielder objects (ONLY if you recommend changing the field) with:
   - "name", "label" (2-4 chars), "x" (-0.85 to 0.85), "y" (-0.85 to 0.85)
   - "category": "30yd-wall" | "sprinter" | "catcher" | "superfielder" | null
   - "reason": one sentence

3. "tactics": object with "mainBall", "plan", "variations" (array of {ball, when}), "bluffs" (array of {setup, execution})

${matchContext.isNewBatter ? "\nIMPORTANT: New batter just arrived. Suggest attacking field with slips, fuller bowling, and pressure tactics." : ""}

Return ONLY the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert cricket strategist. Return ONLY valid JSON. No markdown, no explanation outside the JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "{}";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
