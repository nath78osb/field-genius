import { MatchSettings } from "@/components/SettingsPanel";
import { FielderPosition } from "@/components/CricketField";

export function generateFieldPrompt(settings: MatchSettings): string {
  return `You are an expert cricket fielding coach and bowling strategist. Based on these match conditions, suggest the optimal field placement AND bowling tactics.

Match Conditions:
- Batter: ${settings.batterHand}-handed, ${settings.batterType} style
- Bowler: ${settings.bowlerArm}-arm ${settings.bowlerType}
- Pitch: ${settings.pitchCondition}
- Boundary dimensions: Leg side ${settings.boundaryLeg}m, Off side ${settings.boundaryOff}m, Straight ${settings.boundaryStraight}m, Behind ${settings.boundaryBack}m
- Match situation: ${settings.matchSituation}
- Format: ${settings.oversRemaining}${settings.favouriteShots ? `\n- Batter's favourite shots: ${settings.favouriteShots}` : ""}${settings.worstShots ? `\n- Batter's weakest shots: ${settings.worstShots}` : ""}

COORDINATE SYSTEM (IMPORTANT):
- x-axis: NEGATIVE = OFF SIDE (left on screen), POSITIVE = LEG SIDE (right on screen) for a right-handed batsman. FLIP for left-hander.
- y-axis: NEGATIVE = BEHIND the batsman (keeper end, bottom of screen), POSITIVE = IN FRONT (bowler end, top of screen)
- So for a right-hander: slips/gully are at negative x and negative y, cover/mid-off at negative x and positive y, mid-on/mid-wicket at positive x and positive y, fine leg at positive x and negative y.

Return a JSON object with two keys:
1. "fielders": array of exactly 11 objects, each with:
   - "name": fielding position name (e.g. "Slip", "Mid-off", "Fine Leg")
   - "label": short 2-4 char abbreviation (e.g. "SL", "MO", "FL")
   - "x": number from -0.85 to 0.85 (negative = off side, positive = leg side for right-hander; REVERSED for left-hander)
   - "y": number from -0.85 to 0.85 (negative = behind batsman, positive = in front)
   - "reason": one sentence explaining placement

2. "tactics": object with:
   - "mainBall": the primary delivery to bowl (e.g. "Back of a length outside off stump")
   - "variations": array of 3-5 variation deliveries with "ball" (description) and "when" (when to use it)
   - "bluffs": array of 2-3 bluff/double-bluff tactics with "setup" (what you show) and "execution" (what you actually do)
   - "plan": 2-3 sentence overall bowling plan summary

The wicketkeeper should be near (0, -0.15) and bowler near (0, 0.15). Place fielders realistically.

Return ONLY the JSON object, no other text.`;
}

export interface BowlingTactics {
  mainBall: string;
  variations: { ball: string; when: string }[];
  bluffs: { setup: string; execution: string }[];
  plan: string;
}

export function parseFieldResponse(text: string): { fielders: FielderPosition[]; tactics: BowlingTactics | null } {
  try {
    // Try to parse as full JSON object with fielders + tactics
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.fielders && Array.isArray(parsed.fielders)) {
        const fielders = parsed.fielders.map((f: any) => ({
          name: f.name || "Unknown",
          label: f.label || "?",
          x: Math.max(-0.85, Math.min(0.85, Number(f.x) || 0)),
          y: Math.max(-0.85, Math.min(0.85, Number(f.y) || 0)),
        }));
        const tactics: BowlingTactics | null = parsed.tactics ? {
          mainBall: parsed.tactics.mainBall || "",
          variations: Array.isArray(parsed.tactics.variations) ? parsed.tactics.variations : [],
          bluffs: Array.isArray(parsed.tactics.bluffs) ? parsed.tactics.bluffs : [],
          plan: parsed.tactics.plan || "",
        } : null;
        return { fielders, tactics };
      }
    }

    // Fallback: try array-only format
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      return {
        fielders: parsed.map((f: any) => ({
          name: f.name || "Unknown",
          label: f.label || "?",
          x: Math.max(-0.85, Math.min(0.85, Number(f.x) || 0)),
          y: Math.max(-0.85, Math.min(0.85, Number(f.y) || 0)),
        })),
        tactics: null,
      };
    }

    return { fielders: getDefaultField(), tactics: null };
  } catch {
    return { fielders: getDefaultField(), tactics: null };
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
