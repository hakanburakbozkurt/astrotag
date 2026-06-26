export type NexusTransitStress = {
  stressLevel: "calm" | "moderate" | "high";
  isStressed: boolean;
  harshAspectCount: number;
  peakTimeLabel: string;
  tactic: string;
  skySummary: string;
};
