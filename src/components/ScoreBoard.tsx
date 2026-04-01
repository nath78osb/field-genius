import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MatchState, BallData, BatterType } from "@/lib/matchTypes";

interface ScoreBoardProps {
  match: MatchState;
  onUpdateBatterType?: (index: number, hand: string, type: BatterType) => void;
  onUpdateBowlerType?: (index: number, bowlerType: string, bowlerArm: string) => void;
}

const ScoreBoard = ({ match, onUpdateBatterType, onUpdateBowlerType }: ScoreBoardProps) => {
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
    if (ball.result === "wide") return { text: `Wd${ball.extraRuns > 1 ? ball.extraRuns : ""}`, cls: "bg-muted text-muted-foreground" };
    if (ball.result === "no-ball") return { text: `Nb${ball.batRuns > 0 ? "+" + ball.batRuns : ""}`, cls: "bg-muted text-muted-foreground" };
    if (ball.result === "byes") return { text: `B${ball.extraRuns}`, cls: "bg-muted text-muted-foreground" };
    if (ball.result === "leg-byes") return { text: `Lb${ball.extraRuns}`, cls: "bg-muted text-muted-foreground" };
    if (ball.batRuns >= 6) return { text: "6", cls: "bg-accent text-accent-foreground" };
    if (ball.batRuns >= 4) return { text: "4", cls: "bg-primary text-primary-foreground" };
    if (ball.batRuns === 0) return { text: "•", cls: "bg-muted text-muted-foreground" };
    return { text: ball.batRuns.toString(), cls: "bg-secondary text-secondary-foreground" };
  };

  const prevInnings = match.innings.slice(0, match.currentInnings - 1);
  const bowler = match.bowlers[match.currentBowlerIndex];

  const sr = (runs: number, balls: number) => balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

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

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-foreground font-mono">{current.runs}</span>
        <span className="text-xl text-muted-foreground font-mono">/{current.wickets}</span>
        <span className="text-sm text-muted-foreground font-mono ml-auto">({current.overs}.{current.balls} ov)</span>
      </div>

      {/* Batting table - all batters like a real scorecard */}
      <div className="border-t border-border/50 pt-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-2 text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1 px-1">
          <span>Batting</span>
          <span className="w-7 text-center">R</span>
          <span className="w-7 text-center">B</span>
          <span className="w-6 text-center">4s</span>
          <span className="w-6 text-center">6s</span>
          <span className="w-10 text-right">S/R</span>
        </div>
        {match.batters.map((b, i) => {
          const isStriker = i === match.currentBatterIndex;
          const isNonStriker = i === match.nonStrikerIndex;
          const isActive = isStriker || isNonStriker;
          return (
            <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-2 items-center px-1 py-0.5 rounded ${isActive ? "bg-secondary/30" : ""}`}>
              <div className="flex items-center gap-1 min-w-0">
                {isStriker && <span className="text-accent text-[10px]">*</span>}
                <span className={`text-xs font-mono truncate ${b.isOut ? "text-muted-foreground line-through" : isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {b.name}
                </span>
                {b.isOut && <span className="text-[8px] text-destructive">OUT</span>}
                {!b.isOut && isActive && (
                  <div className="flex gap-0.5 ml-1">
                    <Select value={b.hand || "right"} onValueChange={(v) => onUpdateBatterType?.(i, v, b.type || "unknown")}>
                      <SelectTrigger className="h-4 w-8 text-[7px] px-0.5 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">R</SelectItem>
                        <SelectItem value="left">L</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={b.type || "unknown"} onValueChange={(v) => onUpdateBatterType?.(i, b.hand || "right", v as BatterType)}>
                      <SelectTrigger className="h-4 w-12 text-[7px] px-0.5 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">?</SelectItem>
                        <SelectItem value="aggressive">Agg</SelectItem>
                        <SelectItem value="defensive">Def</SelectItem>
                        <SelectItem value="balanced">Bal</SelectItem>
                        <SelectItem value="tailender">Tail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <span className={`w-7 text-center text-xs font-mono ${isActive ? "text-foreground font-bold" : "text-muted-foreground"}`}>{b.runs}</span>
              <span className="w-7 text-center text-xs font-mono text-muted-foreground">{b.balls}</span>
              <span className="w-6 text-center text-[10px] font-mono text-primary">{b.fours}</span>
              <span className="w-6 text-center text-[10px] font-mono text-accent">{b.sixes}</span>
              <span className="w-10 text-right text-[10px] font-mono text-muted-foreground">{sr(b.runs, b.balls)}</span>
            </div>
          );
        })}
        {current.extras > 0 && (
          <div className="flex justify-between px-1 pt-1 text-[10px] font-mono text-muted-foreground">
            <span>Extras</span>
            <span>{current.extras}</span>
          </div>
        )}
      </div>

      {/* Bowling table */}
      <div className="border-t border-border/50 pt-2 mt-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1 px-1">
          <span>Bowling</span>
          <span className="w-8 text-center">O</span>
          <span className="w-7 text-center">R</span>
          <span className="w-6 text-center">W</span>
          <span className="w-10 text-right">Econ</span>
        </div>
        {match.bowlers.map((b, i) => {
          const isCurrent = i === match.currentBowlerIndex;
          const totalOvers = b.overs + b.balls / 6;
          const econ = totalOvers > 0 ? (b.runs / totalOvers).toFixed(1) : "0.0";
          return (
            <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 items-center px-1 py-0.5 rounded ${isCurrent ? "bg-secondary/30" : ""}`}>
              <div className="flex items-center gap-1 min-w-0">
                <span className={`text-xs font-mono truncate ${isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {b.name}
                </span>
                {isCurrent && (
                  <div className="flex gap-0.5 ml-1">
                    <Select value={b.bowlerType || "fast"} onValueChange={(v) => onUpdateBowlerType?.(i, v, b.bowlerArm || "right")}>
                      <SelectTrigger className="h-4 w-12 text-[7px] px-0.5 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="medium">Med</SelectItem>
                        <SelectItem value="offspin">Off</SelectItem>
                        <SelectItem value="legspin">Leg</SelectItem>
                        <SelectItem value="leftarm-spin">LA Spin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={b.bowlerArm || "right"} onValueChange={(v) => onUpdateBowlerType?.(i, b.bowlerType || "fast", v)}>
                      <SelectTrigger className="h-4 w-8 text-[7px] px-0.5 bg-transparent border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">R</SelectItem>
                        <SelectItem value="left">L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <span className="w-8 text-center text-xs font-mono text-muted-foreground">{b.overs}.{b.balls}</span>
              <span className={`w-7 text-center text-xs font-mono ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{b.runs}</span>
              <span className="w-6 text-center text-xs font-mono text-destructive">{b.wickets}</span>
              <span className="w-10 text-right text-[10px] font-mono text-muted-foreground">{econ}</span>
            </div>
          );
        })}
      </div>

      {/* This over */}
      {currentOverBalls.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap border-t border-border/50 pt-2">
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
