import { motion } from "framer-motion";
import type { MatchState, BallData } from "@/lib/matchTypes";

interface ScoreBoardProps {
  match: MatchState;
}

const ScoreBoard = ({ match }: ScoreBoardProps) => {
  const current = match.innings[match.currentInnings - 1];
  if (!current) return null;

  const formatLabel = match.format.toUpperCase();
  const inningsLabel = match.totalInnings <= 2
    ? `${match.currentInnings === 1 ? "1st" : "2nd"} Innings`
    : `${match.currentInnings}${["st", "nd", "rd", "th"][Math.min(match.currentInnings - 1, 3)]} Innings`;

  // Last 6 legal balls for this over display
  const currentOverBalls = match.ballHistory
    .filter((b) => b.over === current.overs && !["wide", "no-ball"].includes(b.result))
    .slice(-6);

  const getBallDisplay = (ball: BallData) => {
    if (ball.isWicket) return { text: "W", cls: "bg-destructive text-destructive-foreground" };
    if (ball.result === "4") return { text: "4", cls: "bg-primary text-primary-foreground" };
    if (ball.result === "6") return { text: "6", cls: "bg-accent text-accent-foreground" };
    if (ball.result === "dot") return { text: "•", cls: "bg-muted text-muted-foreground" };
    return { text: ball.runs.toString(), cls: "bg-secondary text-secondary-foreground" };
  };

  // Previous innings scores
  const prevInnings = match.innings.slice(0, match.currentInnings - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {formatLabel} • {inningsLabel}
        </span>
        {match.isNewBatter && (
          <span className="text-[10px] font-mono text-accent uppercase tracking-wider animate-pulse">
            🆕 New Batter
          </span>
        )}
      </div>

      {/* Previous innings */}
      {prevInnings.length > 0 && (
        <div className="flex gap-3 mb-2">
          {prevInnings.map((inn, i) => (
            <span key={i} className="text-xs font-mono text-muted-foreground">
              Inn {i + 1}: {inn.runs}/{inn.wickets} ({inn.overs}.{inn.balls})
            </span>
          ))}
        </div>
      )}

      {/* Current score */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground font-mono">{current.runs}</span>
        <span className="text-xl text-muted-foreground font-mono">/{current.wickets}</span>
        <span className="text-sm text-muted-foreground font-mono ml-auto">
          ({current.overs}.{current.balls} ov)
        </span>
      </div>

      {/* Current over */}
      {currentOverBalls.length > 0 && (
        <div className="flex gap-1.5 mt-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider self-center mr-1">
            This Over:
          </span>
          {currentOverBalls.map((ball) => {
            const { text, cls } = getBallDisplay(ball);
            return (
              <span key={ball.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${cls}`}>
                {text}
              </span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ScoreBoard;
