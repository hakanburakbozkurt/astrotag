import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";

export function getTransitStressTextClass(stress: NexusTransitStress): string {
  if (stress.stressLevel === "high") {
    return "text-white";
  }

  if (stress.stressLevel === "moderate") {
    return "text-stone-300";
  }

  return "text-stone-500";
}

export function getTransitStressBorderClass(stress: NexusTransitStress): string {
  if (stress.stressLevel === "high") {
    return "border-zinc-600";
  }

  if (stress.stressLevel === "moderate") {
    return "border-zinc-700";
  }

  return "border-zinc-800";
}
