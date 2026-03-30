import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { AISuggestion } from "@/lib/matchTypes";

interface LiveSuggestionsProps {
  suggestions: AISuggestion[];
  onApplyField: () => void;
  isLoading?: boolean;
  hasFieldSuggestion?: boolean;
}

const priorityStyles: Record<string, string> = {
  high: "border-destructive/50 bg-destructive/5",
  medium: "border-accent/50 bg-accent/5",
  low: "border-border bg-card/50",
};

const typeIcons: Record<string, string> = {
  "field-change": "🎯",
  bowling: "⚡",
  pressure: "🔥",
  info: "💡",
};

const LiveSuggestions = ({ suggestions, onApplyField, isLoading, hasFieldSuggestion }: LiveSuggestionsProps) => {
  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-accent" />
        <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
          AI Analysis
        </span>
        {isLoading && (
          <span className="text-[10px] font-mono text-muted-foreground animate-pulse">Thinking...</span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {suggestions.map((s, i) => (
          <motion.div
            key={`${s.message}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-lg border p-3 ${priorityStyles[s.priority]}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">{typeIcons[s.type] || "💡"}</span>
              <p className="text-xs text-foreground leading-relaxed">{s.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasFieldSuggestion && (
        <Button
          onClick={onApplyField}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase tracking-wider text-xs h-10"
        >
          <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
          Apply Suggested Field
        </Button>
      )}
    </div>
  );
};

export default LiveSuggestions;
