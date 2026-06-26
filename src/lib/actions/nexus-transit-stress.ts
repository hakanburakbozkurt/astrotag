"use server";

import { computeNexusTransitStress } from "@/lib/nexus/nexus-transit-stress.server";
import type { UserData } from "@/types/user";

export async function fetchNexusTransitStressAction(userData: UserData) {
  return computeNexusTransitStress(userData);
}
