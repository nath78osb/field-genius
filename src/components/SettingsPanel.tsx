import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export interface MatchSettings {
  batterHand: string;
  batterType: string;
  bowlerType: string;
  bowlerArm: string;
  bowlerPace: string;
  pitchCondition: string;
  groundSize: number;
  boundaryLeg: number;
  boundaryOff: number;
  boundaryStraight: number;
  boundaryBack: number;
  matchSituation: string;
  oversRemaining: string;
  favouriteShots: string;
  worstShots: string;
}

interface SettingsPanelProps {
  settings: MatchSettings;
  onChange: (settings: MatchSettings) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const SettingsPanel = ({ settings, onChange, onGenerate, isLoading }: SettingsPanelProps) => {
  const update = (key: keyof MatchSettings, value: string | number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Batter Hand</Label>
          <Select value={settings.batterHand} onValueChange={(v) => update("batterHand", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Right-hand</SelectItem>
              <SelectItem value="left">Left-hand</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Batter Style</Label>
          <Select value={settings.batterType} onValueChange={(v) => update("batterType", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aggressive">Aggressive</SelectItem>
              <SelectItem value="defensive">Defensive</SelectItem>
              <SelectItem value="allrounder">All-rounder</SelectItem>
              <SelectItem value="tailender">Tail-ender</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Bowler Type</Label>
          <Select value={settings.bowlerType} onValueChange={(v) => update("bowlerType", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fast">Fast</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="offspin">Off-spin</SelectItem>
              <SelectItem value="legspin">Leg-spin</SelectItem>
              <SelectItem value="leftarm-spin">Left-arm spin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Bowler Arm</Label>
          <Select value={settings.bowlerArm} onValueChange={(v) => update("bowlerArm", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Right-arm</SelectItem>
              <SelectItem value="left">Left-arm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Pitch</Label>
          <Select value={settings.pitchCondition} onValueChange={(v) => update("pitchCondition", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="green">Green / Seaming</SelectItem>
              <SelectItem value="dry">Dry / Turning</SelectItem>
              <SelectItem value="flat">Flat / Batting</SelectItem>
              <SelectItem value="cracked">Cracked / Variable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Match Situation</Label>
          <Select value={settings.matchSituation} onValueChange={(v) => update("matchSituation", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="attacking">Attacking (need wickets)</SelectItem>
              <SelectItem value="defensive">Defensive (protect runs)</SelectItem>
              <SelectItem value="death">Death overs</SelectItem>
              <SelectItem value="powerplay">Powerplay</SelectItem>
              <SelectItem value="newball">New ball</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Format</Label>
          <Select value={settings.oversRemaining} onValueChange={(v) => update("oversRemaining", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="test">Test Match</SelectItem>
              <SelectItem value="odi">ODI</SelectItem>
              <SelectItem value="t20">T20</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-3">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">
            Boundary Dimensions (metres)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["boundaryLeg", "Leg Side"],
              ["boundaryOff", "Off Side"],
              ["boundaryStraight", "Straight"],
              ["boundaryBack", "Behind"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <span className="text-xs text-muted-foreground font-mono">{label}: {settings[key]}m</span>
                <Slider
                  value={[settings[key]]}
                  onValueChange={([v]) => update(key, v)}
                  min={50}
                  max={95}
                  step={1}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Favourite Shots (optional)</Label>
        <input
          type="text"
          value={settings.favouriteShots}
          onChange={(e) => update("favouriteShots", e.target.value)}
          placeholder="e.g. Cover drive, Pull, Sweep"
          className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Worst Shots (optional)</Label>
        <input
          type="text"
          value={settings.worstShots}
          onChange={(e) => update("worstShots", e.target.value)}
          placeholder="e.g. Short ball, Outswinger"
          className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <Button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-wider text-sm h-12"
      >
        <Zap className="w-4 h-4 mr-2" />
        {isLoading ? "Analyzing Match..." : "Generate Field"}
      </Button>
    </div>
  );
};

export default SettingsPanel;
