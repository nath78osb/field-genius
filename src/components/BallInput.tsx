import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BallResult, ShotType, ShotDirection, BallType } from "@/lib/matchTypes";

interface BallInputProps {
  onBallRecorded: (result: BallResult, shotType: ShotType, shotDirection: ShotDirection, ballType: BallType) => void;
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

const extraButtons: { result: BallResult; label: string }[] = [
  { result: "wide", label: "Wide" },
  { result: "no-ball", label: "No Ball" },
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

const ballTypes: { value: BallType; label: string }[] = [
  { value: "good-length", label: "Good Length" },
  { value: "short", label: "Short" },
  { value: "full", label: "Full" },
  { value: "yorker", label: "Yorker" },
  { value: "bouncer", label: "Bouncer" },
  { value: "wide", label: "Wide" },
];

const BallInput = ({ onBallRecorded, disabled }: BallInputProps) => {
  const [selectedResult, setSelectedResult] = useState<BallResult | null>(null);
  const [shotType, setShotType] = useState<ShotType>("unknown");
  const [shotDirection, setShotDirection] = useState<ShotDirection>("unknown");
  const [ballType, setBallType] = useState<BallType>("unknown");
  const [showDetails, setShowDetails] = useState(false);

  const handleResultTap = (result: BallResult) => {
    if (disabled) return;
    setSelectedResult(result);
    // Auto-submit if details panel is closed
    if (!showDetails) {
      onBallRecorded(result, "unknown", "unknown", "unknown");
      setSelectedResult(null);
    }
  };

  const handleConfirm = () => {
    if (!selectedResult) return;
    onBallRecorded(selectedResult, shotType, shotDirection, ballType);
    setSelectedResult(null);
    setShotType("unknown");
    setShotDirection("unknown");
    setBallType("unknown");
  };

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
      <div className="flex gap-2">
        {extraButtons.map(({ result, label }) => (
          <button
            key={result}
            onClick={() => handleResultTap(result)}
            disabled={disabled}
            className={`flex-1 h-9 rounded-md text-xs font-mono uppercase tracking-wider bg-muted text-muted-foreground hover:bg-muted/80 transition-all ${
              selectedResult === result ? "ring-2 ring-accent" : ""
            } disabled:opacity-50`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 px-3 h-9 rounded-md text-xs font-mono uppercase tracking-wider bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          Details {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Shot type */}
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Shot Type</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {shotTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setShotType(value)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      shotType === value
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shot direction */}
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Direction</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {shotDirections.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setShotDirection(value)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      shotDirection === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ball type */}
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Ball Type</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {ballTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setBallType(value)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                      ballType === value
                        ? "bg-secondary text-foreground ring-1 ring-accent"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm button */}
            {selectedResult && (
              <motion.button
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={handleConfirm}
                className="w-full h-10 rounded-lg bg-accent text-accent-foreground font-mono uppercase tracking-wider text-sm font-bold"
              >
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
