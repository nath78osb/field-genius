import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import CricketField from "@/components/CricketField";
import type { FielderPosition } from "@/components/CricketField";
import SettingsPanel from "@/components/SettingsPanel";
import type { MatchSettings } from "@/components/SettingsPanel";
import MatchSetup from "@/components/MatchSetup";
import BallInput from "@/components/BallInput";
import ScoreBoard from "@/components/ScoreBoard";
import LiveSuggestions from "@/components/LiveSuggestions";
import WagonWheel from "@/components/WagonWheel";
import ImportScore from "@/components/ImportScore";
import { getDefaultField, generateFieldPrompt, parseFieldResponse, BowlingTactics } from "@/lib/fieldLogic";
import {
  MatchState, AISuggestion, BallData, BallResult, ShotType, ShotDirection, BallType,
  BatterStats, BowlerStats, InningsScore, BatterType,
  createInitialInnings, getMaxInnings, getMaxOvers, isLegalDelivery,
} from "@/lib/matchTypes";
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

type AppMode = "manual" | "live";

const Index = () => {
  const [mode, setMode] = useState<AppMode>("live");

  // Manual mode state
  const [settings, setSettings] = useState<MatchSettings>(defaultSettings);
  const [fielders, setFielders] = useState<FielderPosition[]>(getDefaultField());
  const [isLoading, setIsLoading] = useState(false);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [tactics, setTactics] = useState<BowlingTactics | null>(null);

  // Live mode state
  const [match, setMatch] = useState<MatchState | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [pendingFielders, setPendingFielders] = useState<FielderPosition[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // ── Manual mode handler ──
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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ prompt }),
        }
      );
      if (resp.status === 429) { toast.error("Rate limit reached. Please wait."); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); return; }
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      const { fielders: positions, tactics: bowlingTactics } = parseFieldResponse(data.result);
      setFielders(positions);
      setTactics(bowlingTactics);
      try {
        const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.fielders) {
            const reasons = parsed.fielders.filter((f: any) => f.reason).map((f: any) => `${f.name}: ${f.reason}`).join("\n");
            if (reasons) setReasoning(reasons);
          }
        }
      } catch { /* ignore */ }
      toast.success("Field placement generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate field.");
      setFielders(getDefaultField());
    } finally { setIsLoading(false); }
  };

  // ── Live mode handlers ──
  const handleStartMatch = (data: any) => {
    const totalInnings = getMaxInnings(data.format);
    setMatch({
      format: data.format,
      pitchCondition: data.pitchCondition,
      batterHand: "right",
      batterType: "unknown",
      bowlerType: "fast",
      bowlerArm: "right",
      currentInnings: 1,
      totalInnings,
      innings: [createInitialInnings()],
      ballHistory: [],
      isNewBatter: true,
      ballsSinceNewBatter: 0,
      isMatchStarted: true,
      isMatchComplete: false,
      batters: [
        { name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, hand: "right", type: "unknown" },
        { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, hand: "right", type: "unknown" },
      ],
      bowlers: [
        { name: "Bowler 1", overs: 0, balls: 0, runs: 0, wickets: 0, extras: 0, bowlerType: "fast", bowlerArm: "right" },
      ],
      currentBatterIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
    });
    setFielders(getDefaultField());
    setSuggestions([]);
    setPendingFielders(null);
    setShowImport(false);
  };

  const handleImportScore = (data: {
    innings: InningsScore;
    batters: BatterStats[];
    bowlers: BowlerStats[];
    previousInnings: InningsScore[];
  }) => {
    if (!match) return;
    const inningsArr = [...data.previousInnings, data.innings];
    const currentInningsNum = inningsArr.length;
    setMatch({
      ...match,
      currentInnings: currentInningsNum,
      innings: inningsArr,
      batters: data.batters,
      bowlers: data.bowlers,
      currentBatterIndex: 0,
      nonStrikerIndex: Math.min(1, data.batters.length - 1),
      currentBowlerIndex: data.bowlers.length - 1,
      ballHistory: match.ballHistory,
    });
    setShowImport(false);
    toast.success("Score imported!");
  };

  const handleBallRecorded = useCallback((result: BallResult, shotType: ShotType, shotDirection: ShotDirection, ballType: BallType, additionalRuns: number) => {
    if (!match || match.isMatchComplete) return;

    const currentInn = match.innings[match.currentInnings - 1];
    const legal = isLegalDelivery(result);
    const isWicket = result === "wicket";

    // Calculate bat runs and extra runs
    let batRuns = 0;
    let extraRuns = 0;

    switch (result) {
      case "dot": batRuns = 0; break;
      case "1": case "2": case "3": case "4": case "6":
        batRuns = parseInt(result); break;
      case "wicket": batRuns = 0; break;
      case "wide": extraRuns = additionalRuns || 1; break;
      case "no-ball": extraRuns = 1; batRuns = additionalRuns; break;
      case "byes": case "leg-byes": extraRuns = additionalRuns; break;
    }

    const totalRuns = batRuns + extraRuns;
    const striker = match.batters[match.currentBatterIndex];
    const bowler = match.bowlers[match.currentBowlerIndex];

    const newBall: BallData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      over: currentInn.overs,
      ballInOver: currentInn.balls,
      result,
      runs: totalRuns,
      batRuns,
      extraRuns,
      shotType,
      shotDirection,
      ballType,
      isWicket,
      timestamp: Date.now(),
      batterName: striker?.name || "Unknown",
      bowlerName: bowler?.name || "Unknown",
      innings: match.currentInnings,
    };

    const newBalls = currentInn.balls + (legal ? 1 : 0);
    const newOvers = newBalls >= 6 ? currentInn.overs + 1 : currentInn.overs;
    const ballsAfter = newBalls >= 6 ? 0 : newBalls;

    const updatedInnings: InningsScore = {
      ...currentInn,
      runs: currentInn.runs + totalRuns,
      wickets: currentInn.wickets + (isWicket ? 1 : 0),
      overs: newOvers,
      balls: ballsAfter,
      extras: currentInn.extras + extraRuns,
    };

    // Update batter stats
    const updatedBatters = [...match.batters];
    if (striker) {
      const si = match.currentBatterIndex;
      updatedBatters[si] = {
        ...striker,
        runs: striker.runs + batRuns,
        balls: striker.balls + (legal ? 1 : 0),
        fours: striker.fours + (batRuns === 4 ? 1 : 0),
        sixes: striker.sixes + (batRuns === 6 ? 1 : 0),
        isOut: isWicket,
      };
    }

    // Update bowler stats
    const updatedBowlers = [...match.bowlers];
    if (bowler) {
      const bi = match.currentBowlerIndex;
      const bowlerBalls = bowler.balls + (legal ? 1 : 0);
      const bowlerOvers = bowlerBalls >= 6 ? bowler.overs + 1 : bowler.overs;
      const bowlerBallsAfter = bowlerBalls >= 6 ? 0 : bowlerBalls;
      updatedBowlers[bi] = {
        ...bowler,
        overs: bowlerOvers,
        balls: bowlerBallsAfter,
        runs: bowler.runs + totalRuns,
        wickets: bowler.wickets + (isWicket ? 1 : 0),
        extras: bowler.extras + extraRuns,
      };
    }

    const newInningsArr = [...match.innings];
    newInningsArr[match.currentInnings - 1] = updatedInnings;

    // Rotate strike on odd runs or end of over
    let newStrikerIdx = match.currentBatterIndex;
    let newNonStrikerIdx = match.nonStrikerIndex;
    const oddRuns = totalRuns % 2 === 1;
    if (oddRuns && !isWicket) {
      [newStrikerIdx, newNonStrikerIdx] = [newNonStrikerIdx, newStrikerIdx];
    }
    // End of over: swap
    if (ballsAfter === 0 && legal) {
      [newStrikerIdx, newNonStrikerIdx] = [newNonStrikerIdx, newStrikerIdx];
    }

    // New batter on wicket
    if (isWicket) {
      const nextBatterIdx = updatedBatters.length;
      updatedBatters.push({ name: `Batter ${nextBatterIdx + 1}`, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, hand: "right", type: "unknown" });
      newStrikerIdx = nextBatterIdx;
    }

    // Check if chase target reached
    let isComplete = match.isMatchComplete;
    if (updatedInnings.target && updatedInnings.runs >= updatedInnings.target) {
      isComplete = true;
      toast.success("🏏 Target reached! Match won!");
    }

    // Check if all out (10 wickets)
    if (updatedInnings.wickets >= 10) {
      isComplete = true;
      toast.info("All out!");
    }

    // Check max overs
    const maxOvers = getMaxOvers(match.format);
    if (maxOvers && updatedInnings.overs >= maxOvers && ballsAfter === 0) {
      isComplete = true;
      toast.info("Innings complete - overs exhausted");
    }

    const updated: MatchState = {
      ...match,
      innings: newInningsArr,
      ballHistory: [...match.ballHistory, newBall],
      isNewBatter: isWicket,
      ballsSinceNewBatter: isWicket ? 0 : match.ballsSinceNewBatter + 1,
      batters: updatedBatters,
      bowlers: updatedBowlers,
      currentBatterIndex: newStrikerIdx,
      nonStrikerIndex: newNonStrikerIdx,
      isMatchComplete: isComplete,
    };
    setMatch(updated);

    // AI analysis trigger
    const totalBallsCount = updated.ballHistory.length;
    if (!isComplete && totalBallsCount >= 2 && (totalBallsCount % 3 === 0 || isWicket || batRuns >= 4)) {
      runLiveAnalysis(updated);
    }
  }, [match]);

  const runLiveAnalysis = async (currentMatch: MatchState) => {
    setIsAnalyzing(true);
    try {
      const currentInnings = currentMatch.innings[currentMatch.currentInnings - 1];
      const recentBalls = currentMatch.ballHistory.slice(-12);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-analysis`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            matchContext: {
              format: currentMatch.format,
              batterHand: currentMatch.batterHand,
              batterType: currentMatch.isNewBatter ? "new-to-crease" : currentMatch.batterType,
              bowlerType: currentMatch.bowlerType,
              bowlerArm: currentMatch.bowlerArm,
              pitchCondition: currentMatch.pitchCondition,
              runs: currentInnings.runs,
              wickets: currentInnings.wickets,
              overs: currentInnings.overs,
              balls: currentInnings.balls,
              isNewBatter: currentMatch.isNewBatter,
              ballsSinceNewBatter: currentMatch.ballsSinceNewBatter,
            },
            ballHistory: recentBalls,
          }),
        }
      );

      if (resp.status === 429) { toast.error("Rate limit. Wait a moment."); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); return; }
      if (!resp.ok) throw new Error("Analysis failed");

      const data = await resp.json();
      const jsonMatch = data.result?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.suggestions) setSuggestions(parsed.suggestions);
        if (parsed.fielders && Array.isArray(parsed.fielders)) {
          const validCategories = ["30yd-wall", "sprinter", "catcher", "superfielder"];
          const newFielders = parsed.fielders.map((f: any) => ({
            name: f.name || "Unknown",
            label: f.label || "?",
            x: Math.max(-0.85, Math.min(0.85, Number(f.x) || 0)),
            y: Math.max(-0.85, Math.min(0.85, Number(f.y) || 0)),
            category: (f.category && validCategories.includes(f.category) ? f.category : null),
          }));
          setPendingFielders(newFielders);
        }
      }
    } catch (err) {
      console.error(err);
    } finally { setIsAnalyzing(false); }
  };

  const handleApplyField = () => {
    if (pendingFielders) {
      setFielders(pendingFielders);
      setPendingFielders(null);
      toast.success("Field updated!");
    }
  };

  const handleNewInnings = () => {
    if (!match) return;
    if (match.currentInnings >= match.totalInnings) {
      toast.info("Match complete!");
      return;
    }
    const prevInningsScore = match.innings[match.currentInnings - 1];
    const target = prevInningsScore.runs + 1;
    setMatch({
      ...match,
      currentInnings: match.currentInnings + 1,
      innings: [...match.innings, createInitialInnings(target)],
      isNewBatter: true,
      ballsSinceNewBatter: 0,
      batters: [
        { name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, hand: "right", type: "unknown" },
        { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, hand: "right", type: "unknown" },
      ],
      bowlers: [
        { name: "Bowler 1", overs: 0, balls: 0, runs: 0, wickets: 0, extras: 0, bowlerType: "fast", bowlerArm: "right" },
      ],
      currentBatterIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
    });
    setSuggestions([]);
    setPendingFielders(null);
    setFielders(getDefaultField());
  };

  const handleUpdateBatterType = (index: number, hand: string, type: BatterType) => {
    if (!match) return;
    const updatedBatters = [...match.batters];
    updatedBatters[index] = { ...updatedBatters[index], hand, type };
    const isStriker = index === match.currentBatterIndex;
    setMatch({
      ...match,
      batters: updatedBatters,
      batterHand: isStriker ? hand : match.batterHand,
      batterType: isStriker ? type : match.batterType,
    });
  };

  const handleUpdateBowlerType = (index: number, bowlerType: string, bowlerArm: string) => {
    if (!match) return;
    const updatedBowlers = [...match.bowlers];
    updatedBowlers[index] = { ...updatedBowlers[index], bowlerType, bowlerArm };
    const isCurrent = index === match.currentBowlerIndex;
    setMatch({
      ...match,
      bowlers: updatedBowlers,
      bowlerType: isCurrent ? bowlerType : match.bowlerType,
      bowlerArm: isCurrent ? bowlerArm : match.bowlerArm,
    });
  };

  const handleEndMatch = () => {
    setMatch(null);
    setSuggestions([]);
    setPendingFielders(null);
    setFielders(getDefaultField());
    setShowImport(false);
  };

  const handleChangeBowler = () => {
    if (!match) return;
    const nextIdx = match.bowlers.length;
    const updated = {
      ...match,
      bowlers: [...match.bowlers, { name: `Bowler ${nextIdx + 1}`, overs: 0, balls: 0, runs: 0, wickets: 0, extras: 0 }],
      currentBowlerIndex: nextIdx,
    };
    setMatch(updated);
    toast.info(`New bowler: Bowler ${nextIdx + 1}`);
  };

  return (
    <div className="min-h-screen tactical-grid">
      <div className="container py-4 px-3">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            <span className="text-accent">FIELD</span>
            <span className="text-foreground">SET</span>
          </h1>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">AI-Powered Cricket Field Placement</p>
        </motion.div>

        {/* Mode toggle */}
        <div className="flex justify-center gap-1 mb-4">
          {(["manual", "live"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                mode === m ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "manual" ? "Manual Setup" : "Live Match"}
            </button>
          ))}
        </div>

        {/* ═══════ LIVE MODE ═══════ */}
        {mode === "live" && (
          <div className="space-y-4">
            {!match ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto bg-card/80 backdrop-blur border border-border rounded-xl p-5">
                <MatchSetup onStart={handleStartMatch} />
              </motion.div>
            ) : (
              <>
                <ScoreBoard match={match} onUpdateBatterType={handleUpdateBatterType} onUpdateBowlerType={handleUpdateBowlerType} />

                {/* Import score toggle */}
                {!showImport && (
                  <button onClick={() => setShowImport(true)} className="w-full text-[10px] font-mono text-primary hover:text-primary/80 uppercase tracking-wider text-center py-1">
                    📥 Import Current Score
                  </button>
                )}

                {showImport && (
                  <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4">
                    <ImportScore onImport={handleImportScore} />
                    <button onClick={() => setShowImport(false)} className="w-full mt-2 text-[10px] font-mono text-muted-foreground hover:text-foreground uppercase tracking-wider text-center">
                      Cancel
                    </button>
                  </div>
                )}

                <CricketField
                  fielders={fielders}
                  isLoading={isAnalyzing}
                  batterHand={match.batterHand}
                />

                {/* Wagon Wheel (separate from field) */}
                <WagonWheel
                  ballHistory={match.ballHistory}
                  batters={match.batters}
                  batterHand={match.batterHand}
                  currentInnings={match.currentInnings}
                />

                {/* Ball input */}
                {!match.isMatchComplete && (
                  <div className="bg-card/80 backdrop-blur border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Ball Input</span>
                      <div className="flex gap-2">
                        <button onClick={handleChangeBowler} className="text-[10px] font-mono text-accent hover:text-accent/80 uppercase tracking-wider">
                          Change Bowler
                        </button>
                        <button onClick={handleNewInnings} className="text-[10px] font-mono text-primary hover:text-primary/80 uppercase tracking-wider">
                          New Innings
                        </button>
                        <button onClick={handleEndMatch} className="text-[10px] font-mono text-destructive hover:text-destructive/80 uppercase tracking-wider">
                          End Match
                        </button>
                      </div>
                    </div>
                    <BallInput onBallRecorded={handleBallRecorded} disabled={isAnalyzing || match.isMatchComplete} />
                  </div>
                )}

                {/* New batter alert */}
                {match.isNewBatter && match.ballHistory.length > 0 && !match.isMatchComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center"
                  >
                    <p className="text-sm font-bold text-accent">🆕 New Batter at Crease</p>
                    <p className="text-xs text-muted-foreground mt-1">Attack mode: slips in, fuller lengths, pressure!</p>
                  </motion.div>
                )}

                <LiveSuggestions
                  suggestions={suggestions}
                  onApplyField={handleApplyField}
                  isLoading={isAnalyzing}
                  hasFieldSuggestion={!!pendingFielders}
                />

                {/* Fielder legend */}
                {fielders.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {fielders.map((f) => {
                      const catBadge: Record<string, { label: string; color: string }> = {
                        "30yd-wall": { label: "🧱", color: "text-blue-400" },
                        sprinter: { label: "🏃", color: "text-green-400" },
                        catcher: { label: "🧤", color: "text-red-400" },
                        superfielder: { label: "⭐", color: "text-purple-400" },
                      };
                      const badge = f.category ? catBadge[f.category] : null;
                      return (
                        <div key={f.name} className="flex items-center gap-1.5 text-[10px] font-mono bg-card/50 rounded px-2 py-1 border border-border/50">
                          <span className="text-accent font-bold">{f.label}</span>
                          <span className="text-muted-foreground truncate">{f.name}</span>
                          {badge && <span className={`ml-auto ${badge.color}`}>{badge.label}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Match complete actions */}
                {match.isMatchComplete && (
                  <button onClick={handleEndMatch} className="w-full h-10 rounded-lg bg-accent text-accent-foreground font-mono uppercase tracking-wider text-sm font-bold">
                    New Match
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════ MANUAL MODE ═══════ */}
        {mode === "manual" && (
          <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="order-1">
              <CricketField fielders={fielders} isLoading={isLoading} batterHand={settings.batterHand} />

              {fielders.length > 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {fielders.map((f) => {
                    const catBadge: Record<string, { label: string; color: string }> = {
                      "30yd-wall": { label: "🧱 Wall", color: "text-blue-400" },
                      sprinter: { label: "🏃 Sprint", color: "text-green-400" },
                      catcher: { label: "🧤 Catch", color: "text-red-400" },
                      superfielder: { label: "⭐ Super", color: "text-purple-400" },
                    };
                    const badge = f.category ? catBadge[f.category] : null;
                    return (
                      <div key={f.name} className="flex items-center gap-2 text-xs font-mono bg-card/50 rounded-md px-3 py-1.5 border border-border/50">
                        <span className="text-accent font-bold">{f.label}</span>
                        <span className="text-muted-foreground">{f.name}</span>
                        {badge && <span className={`ml-auto text-[10px] ${badge.color} font-semibold`}>{badge.label}</span>}
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {reasoning && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-card/50 border border-border/50 rounded-lg p-4">
                  <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">Tactical Reasoning</h3>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{reasoning}</pre>
                </motion.div>
              )}

              {tactics && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 space-y-4">
                  <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">🎯 Bowling Plan</h3>
                    <p className="text-sm text-foreground leading-relaxed">{tactics.plan}</p>
                  </div>
                  <div className="bg-card/50 border border-accent/30 rounded-lg p-4">
                    <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-2">⚡ Primary Delivery</h3>
                    <p className="text-sm text-foreground font-medium">{tactics.mainBall}</p>
                  </div>
                  {tactics.variations.length > 0 && (
                    <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                      <h3 className="text-xs font-mono text-accent uppercase tracking-wider mb-3">🔄 Variations</h3>
                      <div className="space-y-2">
                        {tactics.variations.map((v, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="text-accent font-mono shrink-0">{i + 1}.</span>
                            <div><span className="text-foreground font-medium">{v.ball}</span><span className="text-muted-foreground"> — {v.when}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {tactics.bluffs.length > 0 && (
                    <div className="bg-card/50 border border-primary/30 rounded-lg p-4">
                      <h3 className="text-xs font-mono text-primary uppercase tracking-wider mb-3">🃏 Bluffs & Double Bluffs</h3>
                      <div className="space-y-3">
                        {tactics.bluffs.map((b, i) => (
                          <div key={i} className="text-sm space-y-1">
                            <div className="flex gap-2"><span className="text-muted-foreground font-mono shrink-0 text-xs uppercase">Setup:</span><span className="text-foreground">{b.setup}</span></div>
                            <div className="flex gap-2"><span className="text-accent font-mono shrink-0 text-xs uppercase">Execute:</span><span className="text-foreground font-medium">{b.execution}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="order-2 bg-card/80 backdrop-blur border border-border rounded-xl p-5">
              <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Match Conditions</h2>
              <SettingsPanel settings={settings} onChange={setSettings} onGenerate={handleGenerate} isLoading={isLoading} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
