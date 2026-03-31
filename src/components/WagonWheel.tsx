import { useState } from "react";
import { motion } from "framer-motion";
import type { BallData, BatterStats } from "@/lib/matchTypes";
import { SHOT_DIRECTION_ANGLES } from "@/lib/matchTypes";

interface WagonWheelProps {
  ballHistory: BallData[];
  batters: BatterStats[];
  batterHand?: string;
  currentInnings: number;
}

const runColors: Record<number, string> = {
  1: "hsl(210 20% 60%)",
  2: "hsl(200 60% 50%)",
  3: "hsl(260 60% 60%)",
  4: "hsl(148 55% 50%)",
  6: "hsl(38 90% 55%)",
};

const WagonWheel = ({ ballHistory, batters, batterHand = "right", currentInnings }: WagonWheelProps) => {
  const [selectedBatter, setSelectedBatter] = useState<string>("team");
  const isLeftHand = batterHand === "left";
  const cx = 150;
  const cy = 150;
  const rx = 130;
  const ry = 120;

  const inningsBalls = ballHistory.filter((b) => b.innings === currentInnings);
  const filteredBalls = selectedBatter === "team"
    ? inningsBalls
    : inningsBalls.filter((b) => b.batterName === selectedBatter);

  // Only bat runs go on wagon wheel
  const wagonLines = filteredBalls
    .filter((b) => b.batRuns > 0 && b.shotDirection !== "unknown")
    .map((ball) => {
      let angleDeg = SHOT_DIRECTION_ANGLES[ball.shotDirection] || 180;
      if (isLeftHand && ball.shotDirection !== "straight") {
        angleDeg = 360 - angleDeg;
      }
      const angleRad = (angleDeg * Math.PI) / 180;
      const lengthFactor = ball.batRuns >= 6 ? 0.85 : ball.batRuns >= 4 ? 0.75 : ball.batRuns >= 2 ? 0.45 : 0.3;
      const endX = cx + Math.sin(angleRad) * (rx - 10) * lengthFactor;
      const endY = cy - Math.cos(angleRad) * (ry - 10) * lengthFactor;
      const color = runColors[ball.batRuns] || "hsl(210 20% 60%)";
      return { startX: cx, startY: cy - 20, endX, endY, color, runs: ball.batRuns, id: ball.id };
    });

  const activeBatters = batters.filter((b) => b.runs > 0 || b.balls > 0);

  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
          Wagon Wheel
        </span>
      </div>

      {/* Batter selector */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => setSelectedBatter("team")}
          className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
            selectedBatter === "team"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Team
        </button>
        {activeBatters.map((b) => (
          <button
            key={b.name}
            onClick={() => setSelectedBatter(b.name)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              selectedBatter === b.name
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* SVG wheel */}
      <div className="w-full max-w-[300px] mx-auto">
        <svg viewBox="0 0 300 300" className="w-full h-auto">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="hsl(148 60% 28%)" stroke="hsl(148 50% 38%)" strokeWidth="1.5" />
          <ellipse cx={cx} cy={cy} rx={60} ry={54} fill="none" stroke="hsl(148 50% 38% / 0.4)" strokeWidth="0.8" strokeDasharray="4 3" />
          <rect x={cx - 5} y={cy - 22} width={10} height={44} rx={1.5} fill="hsl(38 40% 55%)" opacity={0.7} />

          {wagonLines.map((line) => (
            <motion.line
              key={line.id}
              x1={line.startX} y1={line.startY}
              x2={line.endX} y2={line.endY}
              stroke={line.color}
              strokeWidth={line.runs >= 4 ? 2.5 : line.runs >= 2 ? 1.5 : 1}
              strokeOpacity={0.75}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4 }}
            />
          ))}

          <text x={cx} y={14} textAnchor="middle" fill="hsl(210 20% 60%)" fontSize="7" fontFamily="Inter">BAT</text>
          <text x={cx} y={295} textAnchor="middle" fill="hsl(210 20% 60%)" fontSize="7" fontFamily="Inter">BOWL</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {[1, 2, 3, 4, 6].map((r) => (
          <div key={r} className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: runColors[r] }} />
            <span className="text-[9px] font-mono text-muted-foreground">{r === 6 ? "6" : r === 4 ? "4" : r}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WagonWheel;
