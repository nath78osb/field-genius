import { MatchSettings } from "@/components/SettingsPanel";
import { FielderPosition } from "@/components/CricketField";

export function generateFieldPrompt(settings: MatchSettings): string {
  return `You are an expert cricket fielding coach. Based on these match conditions, suggest the optimal field placement for all 11 fielders (including bowler and wicketkeeper).

Match Conditions:
- Batter: ${settings.batterHand}-handed, ${settings.batterType} style
- Bowler: ${settings.bowlerArm}-arm ${settings.bowlerType}
- Pitch: ${settings.pitchCondition}
- Ground size: ${settings.groundSize}m boundary
- Match situation: ${settings.matchSituation}
- Format: ${settings.oversRemaining}

Return a JSON array of exactly 11 fielder objects. Each object must have:
- "name": the fielding position name (e.g. "Slip", "Mid-off", "Fine Leg")
- "label": short 2-4 char abbreviation (e.g. "SL", "MO", "FL")
- "x": number from -0.85 to 0.85 (negative = off side, positive = leg side for right-hander)
- "y": number from -0.85 to 0.85 (negative = behind batsman, positive = in front)
- "reason": one sentence explaining why this fielder is placed here

The wicketkeeper should be near (0, -0.15) and bowler near (0, 0.15). Place fielders realistically based on cricket strategy.

Return ONLY the JSON array, no other text.`;
}

export function parseFieldResponse(text: string): FielderPosition[] {
  try {
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return getDefaultField();
    const parsed = JSON.parse(match[0]);
    return parsed.map((f: any) => ({
      name: f.name || "Unknown",
      label: f.label || "?",
      x: Math.max(-0.85, Math.min(0.85, Number(f.x) || 0)),
      y: Math.max(-0.85, Math.min(0.85, Number(f.y) || 0)),
    }));
  } catch {
    return getDefaultField();
  }
}

export function getDefaultField(): FielderPosition[] {
  return [
    { name: "Wicketkeeper", label: "WK", x: 0, y: -0.18 },
    { name: "Bowler", label: "BW", x: 0, y: 0.18 },
    { name: "First Slip", label: "1S", x: -0.15, y: -0.2 },
    { name: "Second Slip", label: "2S", x: -0.22, y: -0.22 },
    { name: "Gully", label: "GU", x: -0.3, y: -0.12 },
    { name: "Mid-off", label: "MO", x: -0.25, y: 0.3 },
    { name: "Mid-on", label: "MN", x: 0.25, y: 0.3 },
    { name: "Cover", label: "CV", x: -0.5, y: 0.15 },
    { name: "Mid-wicket", label: "MW", x: 0.45, y: 0.2 },
    { name: "Fine Leg", label: "FL", x: 0.6, y: -0.55 },
    { name: "Third Man", label: "3M", x: -0.55, y: -0.6 },
  ];
}
