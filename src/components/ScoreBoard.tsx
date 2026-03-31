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

  const currentOverBalls = match.ballHistory
    .filter((b) => b.innings === match.currentInnings && b.over === current.overs)
    .slice(-8);

  const getBallDisplay = (ball: BallData) => {
    if (ball.isWicket) return { text: "W", cls: "bg-destructive text-destructive-foreground" };
    if (ball.result === "wide") return { text: "Wd", cls: "bg-muted text-muted-foreground" };
    if (ball.result === "no-ball") return { text: `Nb${ball.batRuns > 0 ? "+" + ball.batRuns : ""}`, cls: "bg-muted text-muted-foreground" };
    if (ball.result === "byes") return { text: `B${ball.extraRuns}`, cls: "bg-muted text-muted-foreground" };
    if (ball.result === "leg-byes") return { text: `Lb${ball.extraRuns}`, cls: "bg-muted text-muted-foreground" };
    if (ball.batRuns >= 6) return { text: "6", cls: "bg-accent text-accent-foreground" };
    if (ball.batRuns >= 4) return { text: "4", cls: "bg-primary text-primary-foreground" };
    if (ball.batRuns === 0) return { text: "•", cls: "bg-muted text-muted-foreground" };
    return { text: ball.batRuns.toString(), cls: "bg-secondary text-secondary-foreground" };
  };

  const prevInnings = match.innings.slice(0, match.currentInnings - 1);

  // Striker and non-striker
  const striker = match.batters[match.currentBatterIndex];
  const nonStriker = match.batters[match.nonStrikerIndex];
  const bowler = match.bowlers[match.currentBowlerIndex];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {formatLabel} • {inningsLabel}
        </span>
        {current.target && (
          <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
            Target: {current.target} | Need: {Math.max(0, current.target - current.runs)}
          </span>
        )}
      </div>

      {prevInnings.length > 0 && (
        <div className="flex gap-3 mb-2">
          {prevInnings.map((inn, i) => (
            <span key={i} className="text-xs font-mono text-muted-foreground">
              Inn {i + 1}: {inn.runs}/{inn.wickets} ({inn.overs}.{inn.balls})
            </span>
          ))}
        </div>
      )}

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground font-mono">{current.runs}</span>
        <span className="text-xl text-muted-foreground font-mono">/{current.wickets}</span>
        <span className="text-sm text-muted-foreground font-mono ml-auto">({current.overs}.{current.balls} ov)</span>
      </div>

      {/* Batter stats */}
      {striker && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-accent">*</span>
            <span className="text-foreground font-semibold">{striker.name}</span>
            <span className="text-muted-foreground ml-auto">{striker.runs} ({striker.balls})</span>
            <span className="text-primary text-[10px]">{striker.fours}x4</span>
            <span className="text-accent text-[10px]">{striker.sixes}x6</span>
          </div>
          {nonStriker && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">&nbsp;</span>
              <span className="text-muted-foreground">{nonStriker.name}</span>
              <span className="text-muted-foreground ml-auto">{nonStriker.runs} ({nonStriker.balls})</span>
              <span className="text-primary text-[10px]">{nonStriker.fours}x4</span>
              <span className="text-accent text-[10px]">{nonStriker.sixes}x6</span>
            </div>
          )}
        </div>
      )}

      {/* Bowler stats */}
      {bowler && (
        <div className="mt-2 flex items-center gap-2 text-xs font-mono border-t border-border/50 pt-2">
          <span className="text-destructive">⚾</span>
          <span className="text-foreground">{bowler.name}</span>
          <span className="text-muted-foreground ml-auto">
            {bowler.overs}.{bowler.balls}-{bowler.runs}-{bowler.wickets}
          </span>
        </div>
      )}

      {/* This over */}
      {currentOverBalls.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider self-center mr-1">This Over:</span>
          {currentOverBalls.map((ball) => {
            const { text, cls } = getBallDisplay(ball);
            return (
              <span key={ball.id} className={`min-w-[24px] h-6 px-1 rounded-full flex items-center justify-center text-[9px] font-bold ${cls}`}>
                {text}
              </span>
            );
          })}
        </div>
      )}

      {match.isMatchComplete && (
        <div className="mt-3 p-2 rounded-lg bg-accent/10 border border-accent/30 text-center">
          <span className="text-sm font-bold text-accent">Match Complete!</span>
        </div>
      )}
    </motion.div>
  );
};

export default ScoreBoard;
