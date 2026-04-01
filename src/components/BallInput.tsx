import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BallResult, ShotType, ShotDirection, BallType } from "@/lib/matchTypes";

interface BallInputProps {
  onBallRecorded: (result: BallResult, shotType: ShotType, shotDirection: ShotDirection, ballType: BallType, additionalRuns: number) => void;
  disabled?: boolean;
}

const resultButtons: { result: BallResult; label: string; color: string }[] = [
  { result: "dot", label: "•", color: "bg-muted text-muted-foreground hover:bg-muted/80" },
  { result: "1", label: "1", color: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  { result: "2", label: "2", color: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  { result: "3", label: "3", color: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  { result: "4", label: "4", color: "bg-primary text-primary-foreground hover:bg-primary/90" },
  { result: "6", label: "6", color: "bg-accent text-accent-foreground hover:bg-accent/90" },
  { result: "wicket", label: "W", color: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
];

const shotTypes: { value: ShotType; label: string }[] = [
  { value: "drive", label: "Drive" },
  { value: "cut", label: "Cut" },
  { value: "pull", label: "Pull" },
  { value: "hook", label: "Hook" },
  { value: "sweep", label: "Sweep" },
  { value: "reverse-sweep", label: "Rev Sweep" },
  { value: "flick", label: "Flick" },
  { value: "glance", label: "Glance" },
  { value: "edge", label: "Edge" },
  { value: "defence", label: "Defence" },
  { value: "slog", label: "Slog" },
  { value: "loft", label: "Loft" },
];

const shotDirections: { value: ShotDirection; label: string }[] = [
  { value: "cover", label: "Cover" },
  { value: "mid-off", label: "Mid-off" },
  { value: "straight", label: "Straight" },
  { value: "mid-on", label: "Mid-on" },
  { value: "mid-wicket", label: "Mid-wkt" },
  { value: "square-leg", label: "Sq Leg" },
  { value: "fine-leg", label: "Fine Leg" },
  { value: "third-man", label: "3rd Man" },
  { value: "point", label: "Point" },
  { value: "backward-point", label: "Bwd Pt" },
  { value: "gully", label: "Gully" },
];

const ballTypeOptions: { value: BallType; label: string }[] = [
  { value: "good-length", label: "Good Length" },
  { value: "short", label: "Short" },
  { value: "full", label: "Full" },
  { value: "yorker", label: "Yorker" },
  { value: "bouncer", label: "Bouncer" },
];

const BallInput = ({ onBallRecorded, disabled }: BallInputProps) => {
  const [selectedResult, setSelectedResult] = useState<BallResult | null>(null);
  const [shotType, setShotType] = useState<ShotType>("unknown");
  const [shotDirection, setShotDirection] = useState<ShotDirection>("unknown");
  const [ballType, setBallType] = useState<BallType>("unknown");
  const [showDetails, setShowDetails] = useState(false);
  const [noBallRuns, setNoBallRuns] = useState(0);
  const [byeRuns, setByeRuns] = useState(1);
  const [wideRuns, setWideRuns] = useState(1);

  const handleResultTap = (result: BallResult) => {
    if (disabled) return;
    setSelectedResult(result);
    if (!showDetails && result !== "no-ball" && result !== "wide" && result !== "byes" && result !== "leg-byes") {
      const batRuns = result === "dot" ? 0 : result === "wicket" ? 0 : parseInt(result);
      onBallRecorded(result, "unknown", "unknown", "unknown", 0);
      setSelectedResult(null);
    }
  };

  const handleConfirm = () => {
    if (!selectedResult) return;
    let additionalRuns = 0;
    if (selectedResult === "no-ball") additionalRuns = noBallRuns;
    if (selectedResult === "wide") additionalRuns = wideRuns;
    if (selectedResult === "byes" || selectedResult === "leg-byes") additionalRuns = byeRuns;
    onBallRecorded(selectedResult, shotType, shotDirection, ballType, additionalRuns);
    resetState();
  };

  const resetState = () => {
    setSelectedResult(null);
    setShotType("unknown");
    setShotDirection("unknown");
    setBallType("unknown");
    setNoBallRuns(0);
    setByeRuns(1);
    setWideRuns(1);
  };

  const needsConfirm = showDetails || selectedResult === "no-ball" || selectedResult === "wide" || selectedResult === "byes" || selectedResult === "leg-byes";

  return (
    <div className="space-y-3">
      {/* Main result buttons */}
      <div className="flex gap-1.5">
        {resultButtons.map(({ result, label, color }) => (
          <button
            key={result}
            onClick={() => handleResultTap(result)}
            disabled={disabled}
            className={`flex-1 h-12 rounded-lg font-bold text-lg transition-all ${color} ${
              selectedResult === result ? "ring-2 ring-accent scale-95" : ""
            } disabled:opacity-50`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Extras row */}
      <div className="flex gap-1.5">
        {([
          { result: "wide" as BallResult, label: "Wide" },
          { result: "no-ball" as BallResult, label: "No Ball" },
          { result: "byes" as BallResult, label: "Byes" },
          { result: "leg-byes" as BallResult, label: "Leg Byes" },
        ]).map(({ result, label }) => (
          <button
            key={result}
            onClick={() => { if (!disabled) setSelectedResult(result); }}
            disabled={disabled}
            className={`flex-1 h-9 rounded-md text-[10px] font-mono uppercase tracking-wider bg-muted text-muted-foreground hover:bg-muted/80 transition-all ${
              selectedResult === result ? "ring-2 ring-accent" : ""
            } disabled:opacity-50`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 px-2 h-9 rounded-md text-[10px] font-mono uppercase tracking-wider bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* No-ball additional runs selector */}
      <AnimatePresence>
        {selectedResult === "no-ball" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Runs off bat (+ 1 no-ball extra)</span>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => setNoBallRuns(r)}
                  className={`flex-1 h-9 rounded-md text-sm font-bold transition-all ${
                    noBallRuns === r ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button onClick={handleConfirm} className="w-full mt-2 h-10 rounded-lg bg-accent text-accent-foreground font-mono uppercase tracking-wider text-sm font-bold">
              Record No Ball + {noBallRuns}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wide confirm / runs selector */}
      <AnimatePresence>
        {selectedResult === "wide" && !showDetails && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Wide runs (default 1)</span>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setWideRuns(r)}
                  className={`flex-1 h-9 rounded-md text-sm font-bold transition-all ${
                    wideRuns === r ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button onClick={handleConfirm} className="w-full mt-2 h-10 rounded-lg bg-accent text-accent-foreground font-mono uppercase tracking-wider text-sm font-bold">
              Record Wide ({wideRuns})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Byes / Leg-byes runs selector */}
      <AnimatePresence>
        {(selectedResult === "byes" || selectedResult === "leg-byes") && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {selectedResult === "byes" ? "Byes" : "Leg Byes"} runs
            </span>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  onClick={() => setByeRuns(r)}
                  className={`flex-1 h-9 rounded-md text-sm font-bold transition-all ${
                    byeRuns === r ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button onClick={handleConfirm} className="w-full mt-2 h-10 rounded-lg bg-accent text-accent-foreground font-mono uppercase tracking-wider text-sm font-bold">
              Record {selectedResult === "byes" ? "Byes" : "Leg Byes"} ({byeRuns})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Shot Type</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {shotTypes.map(({ value, label }) => (
                  <button key={value} onClick={() => setShotType(value)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      shotType === value ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Direction</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {shotDirections.map(({ value, label }) => (
                  <button key={value} onClick={() => setShotDirection(value)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      shotDirection === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Ball Type</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {ballTypeOptions.map(({ value, label }) => (
                  <button key={value} onClick={() => setBallType(value)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      ballType === value ? "bg-secondary text-foreground ring-1 ring-accent" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
            {selectedResult && (
              <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={handleConfirm}
                className="w-full h-10 rounded-lg bg-accent text-accent-foreground font-mono uppercase tracking-wider text-sm font-bold">
                Record Ball
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BallInput;
