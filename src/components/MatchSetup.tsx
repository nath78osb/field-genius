import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play } from "lucide-react";
import type { Format, BatterType } from "@/lib/matchTypes";

interface MatchSetupData {
  format: Format;
  batterHand: string;
  batterType: BatterType;
  bowlerType: string;
  bowlerArm: string;
  pitchCondition: string;
}

interface MatchSetupProps {
  onStart: (data: MatchSetupData) => void;
}

const MatchSetup = ({ onStart }: MatchSetupProps) => {
  const [data, setData] = useState<MatchSetupData>({
    format: "t20",
    batterHand: "right",
    batterType: "unknown",
    bowlerType: "fast",
    bowlerArm: "right",
    pitchCondition: "flat",
  });

  const update = (key: keyof MatchSetupData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Start Live Match</h2>
        <p className="text-xs text-muted-foreground font-mono mt-1">Configure match conditions</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Format</Label>
          <Select value={data.format} onValueChange={(v) => update("format", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="t20">T20</SelectItem>
              <SelectItem value="odi">ODI</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Pitch</Label>
          <Select value={data.pitchCondition} onValueChange={(v) => update("pitchCondition", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="green">Green / Seaming</SelectItem>
              <SelectItem value="dry">Dry / Turning</SelectItem>
              <SelectItem value="flat">Flat / Batting</SelectItem>
              <SelectItem value="cracked">Cracked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Batter Hand</Label>
          <Select value={data.batterHand} onValueChange={(v) => update("batterHand", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Right-hand</SelectItem>
              <SelectItem value="left">Left-hand</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Batter Type</Label>
          <Select value={data.batterType} onValueChange={(v) => update("batterType", v as BatterType)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Unknown</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
              <SelectItem value="defensive">Defensive</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="tailender">Tail-ender</SelectItem>
              <SelectItem value="new-to-crease">New to Crease</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs font-mono uppercase tracking-wider">Bowler Type</Label>
          <Select value={data.bowlerType} onValueChange={(v) => update("bowlerType", v)}>
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
          <Select value={data.bowlerArm} onValueChange={(v) => update("bowlerArm", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Right-arm</SelectItem>
              <SelectItem value="left">Left-arm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => onStart(data)}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-wider text-sm h-12"
      >
        <Play className="w-4 h-4 mr-2" />
        Start Live Match
      </Button>
    </div>
  );
};

export default MatchSetup;
