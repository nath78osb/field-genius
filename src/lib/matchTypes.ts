export type Format = "t20" | "odi" | "test";
export type BatterType = "aggressive" | "defensive" | "balanced" | "tailender" | "new-to-crease" | "unknown";
export type ShotType = "drive" | "cut" | "pull" | "hook" | "sweep" | "reverse-sweep" | "flick" | "glance" | "edge" | "defence" | "slog" | "loft" | "unknown";
export type ShotDirection = "cover" | "mid-off" | "straight" | "mid-on" | "mid-wicket" | "square-leg" | "fine-leg" | "third-man" | "point" | "backward-point" | "gully" | "unknown";
export type BallType = "short" | "good-length" | "full" | "yorker" | "wide" | "bouncer" | "unknown";
export type BallResult = "dot" | "1" | "2" | "3" | "4" | "6" | "wicket" | "wide" | "no-ball";

export interface BallData {
  id: string;
  over: number;
  ballInOver: number;
  result: BallResult;
  runs: number;
  shotType: ShotType;
  shotDirection: ShotDirection;
  ballType: BallType;
  isWicket: boolean;
  timestamp: number;
}

export interface InningsScore {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: number;
}

export interface MatchState {
  format: Format;
  pitchCondition: string;
  batterHand: string;
  batterType: BatterType;
  bowlerType: string;
  bowlerArm: string;
  currentInnings: number;
  totalInnings: number;
  innings: InningsScore[];
  ballHistory: BallData[];
  isNewBatter: boolean;
  ballsSinceNewBatter: number;
  isMatchStarted: boolean;
  isMatchComplete: boolean;
}

export interface AISuggestion {
  message: string;
  type: "field-change" | "bowling" | "pressure" | "info";
  priority: "high" | "medium" | "low";
}

export const SHOT_DIRECTION_ANGLES: Record<ShotDirection, number> = {
  "third-man": 310,
  "gully": 290,
  "backward-point": 270,
  "point": 250,
  "cover": 230,
  "mid-off": 210,
  "straight": 180,
  "mid-on": 150,
  "mid-wicket": 130,
  "square-leg": 110,
  "fine-leg": 70,
  "unknown": 180,
};

export function createInitialInnings(): InningsScore {
  return { runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0 };
}

export function getMaxInnings(format: Format): number {
  return format === "test" ? 4 : 2;
}

export function getMaxOvers(format: Format): number | null {
  if (format === "t20") return 20;
  if (format === "odi") return 50;
  return null; // Test has no limit
}

export function ballResultToRuns(result: BallResult): number {
  switch (result) {
    case "dot": return 0;
    case "1": return 1;
    case "2": return 2;
    case "3": return 3;
    case "4": return 4;
    case "6": return 6;
    case "wicket": return 0;
    case "wide": return 1;
    case "no-ball": return 1;
    default: return 0;
  }
}

export function isLegalDelivery(result: BallResult): boolean {
  return result !== "wide" && result !== "no-ball";
}
