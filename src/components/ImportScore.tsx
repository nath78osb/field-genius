import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload } from "lucide-react";
import type { BatterStats, BowlerStats, InningsScore } from "@/lib/matchTypes";

interface ImportScoreProps {
  onImport: (data: {
    innings: InningsScore;
    batters: BatterStats[];
    bowlers: BowlerStats[];
    previousInnings: InningsScore[];
  }) => void;
}

const ImportScore = ({ onImport }: ImportScoreProps) => {
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);
  const [extras, setExtras] = useState(0);
  const [prevRuns, setPrevRuns] = useState<number | null>(null);

  const [batters, setBatters] = useState<BatterStats[]>([
    { name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
    { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
  ]);

  const [bowlers, setBowlers] = useState<BowlerStats[]>([
    { name: "Bowler 1", overs: 0, balls: 0, runs: 0, wickets: 0, extras: 0 },
  ]);

  const addBatter = () => {
    setBatters([...batters, { name: `Batter ${batters.length + 1}`, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }]);
  };
  const removeBatter = (i: number) => { if (batters.length > 2) setBatters(batters.filter((_, idx) => idx !== i)); };

  const addBowler = () => {
    setBowlers([...bowlers, { name: `Bowler ${bowlers.length + 1}`, overs: 0, balls: 0, runs: 0, wickets: 0, extras: 0 }]);
  };
  const removeBowler = (i: number) => { if (bowlers.length > 1) setBowlers(bowlers.filter((_, idx) => idx !== i)); };

  const updateBatter = (i: number, field: keyof BatterStats, value: string | number | boolean) => {
    const updated = [...batters];
    (updated[i] as any)[field] = value;
    setBatters(updated);
  };

  const updateBowler = (i: number, field: keyof BowlerStats, value: string | number) => {
    const updated = [...bowlers];
    (updated[i] as any)[field] = value;
    setBowlers(updated);
  };

  const handleImport = () => {
    const previousInnings: InningsScore[] = [];
    if (prevRuns !== null) {
      previousInnings.push({ runs: prevRuns, wickets: 0, overs: 0, balls: 0, extras: 0, target: null });
    }
    const target = prevRuns !== null ? prevRuns + 1 : null;
    onImport({
      innings: { runs, wickets, overs, balls, extras, target },
      batters,
      bowlers,
      previousInnings,
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h3 className="text-sm font-bold text-foreground">Import Current Score</h3>

      {/* Previous innings */}
      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Previous Innings Score (optional)</Label>
        <Input type="number" value={prevRuns ?? ""} onChange={(e) => setPrevRuns(e.target.value ? parseInt(e.target.value) : null)} className="h-8 text-xs" placeholder="Total runs" />
      </div>

      {/* Current innings score */}
      <div className="space-y-2">
        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Current Innings</Label>
        <div className="grid grid-cols-5 gap-2">
          <div>
            <Label className="text-[9px] text-muted-foreground">Runs</Label>
            <Input type="number" value={runs} onChange={(e) => setRuns(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[9px] text-muted-foreground">Wkts</Label>
            <Input type="number" value={wickets} onChange={(e) => setWickets(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[9px] text-muted-foreground">Overs</Label>
            <Input type="number" value={overs} onChange={(e) => setOvers(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[9px] text-muted-foreground">Balls</Label>
            <Input type="number" value={balls} onChange={(e) => setBalls(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[9px] text-muted-foreground">Extras</Label>
            <Input type="number" value={extras} onChange={(e) => setExtras(parseInt(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Batters - only name, runs, balls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Batters</Label>
          <button onClick={addBatter} className="text-[10px] font-mono text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        {batters.map((b, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-end">
            <Input value={b.name} onChange={(e) => updateBatter(i, "name", e.target.value)} className="h-7 text-[10px]" placeholder="Name" />
            <Input type="number" value={b.runs} onChange={(e) => updateBatter(i, "runs", parseInt(e.target.value) || 0)} className="h-7 text-[10px] w-14" placeholder="R" />
            <Input type="number" value={b.balls} onChange={(e) => updateBatter(i, "balls", parseInt(e.target.value) || 0)} className="h-7 text-[10px] w-14" placeholder="B" />
            {batters.length > 2 && (
              <button onClick={() => removeBatter(i)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
            )}
          </div>
        ))}
      </div>

      {/* Bowlers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Bowlers</Label>
          <button onClick={addBowler} className="text-[10px] font-mono text-accent flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        {bowlers.map((b, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-1 items-end">
            <Input value={b.name} onChange={(e) => updateBowler(i, "name", e.target.value)} className="h-7 text-[10px]" placeholder="Name" />
            <Input type="number" value={b.overs} onChange={(e) => updateBowler(i, "overs", parseInt(e.target.value) || 0)} className="h-7 text-[10px] w-12" placeholder="O" />
            <Input type="number" value={b.runs} onChange={(e) => updateBowler(i, "runs", parseInt(e.target.value) || 0)} className="h-7 text-[10px] w-12" placeholder="R" />
            <Input type="number" value={b.wickets} onChange={(e) => updateBowler(i, "wickets", parseInt(e.target.value) || 0)} className="h-7 text-[10px] w-10" placeholder="W" />
            {bowlers.length > 1 && (
              <button onClick={() => removeBowler(i)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleImport} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-wider text-xs h-10">
        <Upload className="w-3.5 h-3.5 mr-1.5" /> Import & Continue Match
      </Button>
    </motion.div>
  );
};

export default ImportScore;
