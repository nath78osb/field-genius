import { useState } from "react";
import { motion } from "framer-motion";
import CricketField from "@/components/CricketField";
import type { FielderPosition } from "@/components/CricketField";
import SettingsPanel from "@/components/SettingsPanel";
import type { MatchSettings } from "@/components/SettingsPanel";
import { getDefaultField, generateFieldPrompt, parseFieldResponse } from "@/lib/fieldLogic";
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
};

const Index = () => {
  const [settings, setSettings] = useState<MatchSettings>(defaultSettings);
  const [fielders, setFielders] = useState<FielderPosition[]>(getDefaultField());
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setReasoning(null);

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
      const positions = parseFieldResponse(data.result);
      setFielders(positions);

      // Extract reasoning if available
      const reasonMatch = data.result?.match(/reason/i);
      if (reasonMatch) {
        try {
          const parsed = JSON.parse(data.result.match(/\[[\s\S]*\]/)?.[0] || "[]");
          const reasons = parsed
            .filter((f: any) => f.reason)
            .map((f: any) => `${f.name}: ${f.reason}`)
            .join("\n");
          if (reasons) setReasoning(reasons);
        } catch { /* ignore */ }
      }

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
            <CricketField fielders={fielders} isLoading={isLoading} />

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
