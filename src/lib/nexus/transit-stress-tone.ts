import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";

export function getTransitStressTextClass(stress: NexusTransitStress): string {
  if (stress.stressLevel === "high") {
    return "text-red-200/85";
  }

  if (stress.stressLevel === "moderate") {
    return "text-amber-200/80";
  }

  return "text-emerald-200/75";
}

export function getTransitStressBorderClass(stress: NexusTransitStress): string {
  if (stress.stressLevel === "high") {
    return "border-red-500/45 shadow-[0_0_20px_rgba(239,68,68,0.15)]";
  }

  if (stress.stressLevel === "moderate") {
    return "border-amber-400/25";
  }

  return "border-white/10";
}
