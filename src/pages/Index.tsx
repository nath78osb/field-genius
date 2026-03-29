import { useState } from "react";
import { motion } from "framer-motion";
import CricketField from "@/components/CricketField";
import type { FielderPosition } from "@/components/CricketField";
import SettingsPanel from "@/components/SettingsPanel";
import type { MatchSettings } from "@/components/SettingsPanel";
import { getDefaultField, generateFieldPrompt, parseFieldResponse, BowlingTactics } from "@/lib/fieldLogic";
import { toast } from "sonner";

const defaultSettings: MatchSettings = {
  batterHand: "right",
  batterType: "aggressive",
  bowlerType: "fast",
  bowlerArm: "right",
  bowlerPace: "fast",
  pitchCondition: "green",
  groundSize: 70,
  boundaryLeg: 65,
  boundaryOff: 65,
  boundaryStraight: 75,
  boundaryBack: 60,
  matchSituation: "attacking",
  oversRemaining: "test",
  favouriteShots: "",
  worstShots: "",
};

const Index = () => {
  const [settings, setSettings] = useState<MatchSettings>(defaultSettings);
  const [fielders, setFielders] = useState<FielderPosition[]>(getDefaultField());
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [tactics, setTactics] = useState<BowlingTactics | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setReasoning(null);
    setTactics(null);

    try {
      const prompt = generateFieldPrompt(settings);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-field`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limit reached. Please wait a moment and try again.");
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add funds in Settings > Workspace > Usage.");
        return;
      }
      if (!resp.ok) throw new Error("Failed to get AI suggestion");

      const data = await resp.json();
      const { fielders: positions, tactics: bowlingTactics } = parseFieldResponse(data.result);
      setFielders(positions);
      setTactics(bowlingTactics);

      // Extract reasoning
      try {
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.fielders) {
            const reasons = parsed.fielders
              .filter((f: any) => f.reason)
              .map((f: any) => `${f.name}: ${f.reason}`)
              .join("\n");
            if (reasons) setReasoning(reasons);
          }
        }
      } catch { /* ignore */ }

      toast.success("Field placement generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate field. Using default placement.");
      setFielders(getDefaultField());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen tactical-grid">
      <div className="container py-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-accent">FIELD</span>
            <span className="text-foreground">SET</span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            AI-Powered Cricket Field Placement
          </p>
        </motion.div>

        {/* Main layout */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Field */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="order-1"
          >
            <CricketField fielders={fielders} isLoading={isLoading} batterHand={settings.batterHand} />

            {/* Field legend */}
            {fielders.length > 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {fielders.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-2 text-xs font-mono bg-card/50 rounded-md px-3 py-1.5 border border-border/50"
                  >
                    <span className="text-accent font-bold">{f.label}</span>
                    <span className="text-muted-foreground">{f.name}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Reasoning */}
            {reasoning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-card/50 border border-border/50 rounded-lg p-4"
              >
                <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">
                  Tactical Reasoning
                </h3>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {reasoning}
                </pre>
              </motion.div>
            )}

            {/* Bowling Tactics */}
            {tactics && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 space-y-4"
              >
                {/* Bowling Plan */}
                <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">
                    🎯 Bowling Plan
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{tactics.plan}</p>
                </div>

                {/* Main Ball */}
                <div className="bg-card/50 border border-accent/30 rounded-lg p-4">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">
                    ⚡ Primary Delivery
                  </h3>
                  <p className="text-sm text-foreground font-medium">{tactics.mainBall}</p>
                </div>

                {/* Variations */}
                {tactics.variations.length > 0 && (
                  <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-3">
                      🔄 Variations
                    </h3>
                    <div className="space-y-2">
                      {tactics.variations.map((v, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-accent font-mono shrink-0">{i + 1}.</span>
                          <div>
                            <span className="text-foreground font-medium">{v.ball}</span>
                            <span className="text-muted-foreground"> — {v.when}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bluffs & Double Bluffs */}
                {tactics.bluffs.length > 0 && (
                  <div className="bg-card/50 border border-primary/30 rounded-lg p-4">
                    <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-3">
                      🃏 Bluffs & Double Bluffs
                    </h3>
                    <div className="space-y-3">
                      {tactics.bluffs.map((b, i) => (
                        <div key={i} className="text-sm space-y-1">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground font-mono shrink-0 text-xs uppercase">Setup:</span>
                            <span className="text-foreground">{b.setup}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-accent font-mono shrink-0 text-xs uppercase">Execute:</span>
                            <span className="text-foreground font-medium">{b.execution}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="order-2 bg-card/80 backdrop-blur border border-border rounded-xl p-6"
          >
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-5">
              Match Conditions
            </h2>
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
