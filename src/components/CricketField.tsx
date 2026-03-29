import { motion } from "framer-motion";

export type FielderCategory = "30yd-wall" | "sprinter" | "catcher" | "superfielder" | null;

export interface FielderPosition {
  name: string;
  x: number; // -1 to 1 (center = 0)
  y: number; // -1 to 1 (center = 0)
  label: string;
  category?: FielderCategory;
}

interface CricketFieldProps {
  fielders: FielderPosition[];
  isLoading?: boolean;
  batterHand?: string;
}

const CricketField = ({ fielders, isLoading, batterHand = "right" }: CricketFieldProps) => {
  const isLeftHand = batterHand === "left";
  const offLabel = isLeftHand ? "right" : "left";
  const legLabel = isLeftHand ? "left" : "right";
  const cx = 250;
  const cy = 250;
  const rx = 220;
  const ry = 200;

  const toSvg = (pos: FielderPosition) => ({
    svgX: cx + pos.x * (rx - 20),
    svgY: cy + pos.y * (ry - 20),
  });

  return (
    <div className="relative w-full max-w-[500px] mx-auto field-shadow rounded-full">
      <svg viewBox="0 0 500 500" className="w-full h-auto">
        {/* Outer boundary */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="hsl(148 60% 28%)" stroke="hsl(148 50% 38%)" strokeWidth="2" />

        {/* 30-yard circle */}
        <ellipse cx={cx} cy={cy} rx={100} ry={90} fill="none" stroke="hsl(148 50% 38% / 0.5)" strokeWidth="1" strokeDasharray="6 4" />

        {/* Pitch */}
        <rect x={cx - 8} y={cy - 35} width={16} height={70} rx={2} fill="hsl(38 40% 55%)" opacity={0.8} />

        {/* Crease lines */}
        <line x1={cx - 14} y1={cy - 28} x2={cx + 14} y2={cy - 28} stroke="hsl(0 0% 100% / 0.6)" strokeWidth="1" />
        <line x1={cx - 14} y1={cy + 28} x2={cx + 14} y2={cy + 28} stroke="hsl(0 0% 100% / 0.6)" strokeWidth="1" />

        {/* Direction labels */}
        <text x={20} y={cy + 4} textAnchor="middle" fill="hsl(210 20% 60%)" fontSize="9" fontFamily="Inter" transform={`rotate(-90, 20, ${cy})`}>{isLeftHand ? "LEG SIDE" : "OFF SIDE"}</text>
        <text x={480} y={cy + 4} textAnchor="middle" fill="hsl(210 20% 60%)" fontSize="9" fontFamily="Inter" transform={`rotate(90, 480, ${cy})`}>{isLeftHand ? "OFF SIDE" : "LEG SIDE"}</text>
        <text x={cx} y={22} textAnchor="middle" fill="hsl(210 20% 60%)" fontSize="9" fontFamily="Inter">BOWLER'S END</text>
        <text x={cx} y={490} textAnchor="middle" fill="hsl(210 20% 60%)" fontSize="9" fontFamily="Inter">BATSMAN'S END</text>

        {/* Fielders */}
        {fielders.map((fielder, i) => {
          const { svgX, svgY } = toSvg(fielder);
          const catColors: Record<string, { fill: string; stroke: string; glow: string }> = {
            "30yd-wall": { fill: "hsl(220 80% 55%)", stroke: "hsl(220 80% 65%)", glow: "hsl(220 80% 55%)" },
            sprinter: { fill: "hsl(150 70% 45%)", stroke: "hsl(150 70% 55%)", glow: "hsl(150 70% 45%)" },
            catcher: { fill: "hsl(350 80% 55%)", stroke: "hsl(350 80% 65%)", glow: "hsl(350 80% 55%)" },
            superfielder: { fill: "hsl(280 70% 55%)", stroke: "hsl(280 70% 65%)", glow: "hsl(280 70% 55%)" },
          };
          const colors = fielder.category ? catColors[fielder.category] : { fill: "hsl(38 90% 55%)", stroke: "hsl(38 90% 65%)", glow: "hsl(38 90% 55%)" };
          const radius = fielder.category ? 8 : 6;
          return (
            <motion.g
              key={fielder.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
            >
              <circle cx={svgX} cy={svgY} r={radius + 4} fill={colors.glow} opacity={0.3} className="animate-pulse-glow" />
              {fielder.category && (
                <circle cx={svgX} cy={svgY} r={radius + 2} fill="none" stroke={colors.stroke} strokeWidth="1" strokeDasharray="3 2" opacity={0.6} />
              )}
              <circle cx={svgX} cy={svgY} r={radius} fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" />
              <text
                x={svgX}
                y={svgY - radius - 5}
                textAnchor="middle"
                fill="hsl(0 0% 100%)"
                fontSize="7"
                fontFamily="JetBrains Mono"
                fontWeight="500"
              >
                {fielder.label}
              </text>
              {fielder.category && (
                <text
                  x={svgX}
                  y={svgY + radius + 10}
                  textAnchor="middle"
                  fill={colors.fill}
                  fontSize="5.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  opacity={0.9}
                >
                  {fielder.category === "30yd-wall" ? "WALL" : fielder.category === "superfielder" ? "SUPER" : fielder.category.toUpperCase()}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Loading state */}
        {isLoading && (
          <motion.text
            x={cx}
            y={cy}
            textAnchor="middle"
            fill="hsl(38 90% 55%)"
            fontSize="14"
            fontFamily="Inter"
            fontWeight="600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Analyzing...
          </motion.text>
        )}
      </svg>
    </div>
  );
};

export default CricketField;
