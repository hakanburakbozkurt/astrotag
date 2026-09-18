"use client";

import { useEffect, useMemo, useState } from"react";
import { fetchNexusTransitStressAction } from "@/lib/actions/nexus-transit-stress";
import { snapshotTransitPlanets } from "@/lib/cosmic-radar/transit-snapshot";
import type { NexusTransitStress } from "@/lib/nexus/nexus-transit-stress.types";
import type { UserData } from "@/types/user";

export interface LiveSkyPulse {
 moonLine: string;
 flowLine: string;
 isLoading: boolean;
}

function flowLineFromStress(stress: NexusTransitStress | null): string {
 if (!stress) {
 return"Kozmik Akış İzleniyor";
 }

 if (stress.stressLevel ==="high") {
 return"Yüksek Kozmik Akış Aktif";
 }

 if (stress.stressLevel ==="moderate") {
 return"Orta Kozmik Akış Devrede";
 }

 return"Sakin Kozmik Akış Aktif";
}

function guestPulse(): LiveSkyPulse {
 const moon = snapshotTransitPlanets(new Date()).find((planet) => planet.id ==="moon");
 const moonSign = moon?.signName ??"—";

 return {
 moonLine: `Şu an Ay ${moonSign} Burcunda`,
 flowLine:"Kozmik Akış İzleniyor",
 isLoading: false,
 };
}

export function useLiveSkyPulse(user: UserData | null | undefined): LiveSkyPulse {
 const [stress, setStress] = useState<NexusTransitStress | null>(null);
 const [isLoading, setIsLoading] = useState(Boolean(user));

 useEffect(() => {
 if (!user) {
 setStress(null);
 setIsLoading(false);
 return;
 }

 let cancelled = false;
 setIsLoading(true);

 void (async () => {
 try {
 const result = await fetchNexusTransitStressAction(user);
 if (!cancelled) {
 setStress(result);
 }
 } catch {
 if (!cancelled) {
 setStress(null);
 }
 } finally {
 if (!cancelled) {
 setIsLoading(false);
 }
 }
 })();

 return () => {
 cancelled = true;
 };
 }, [user]);

 return useMemo(() => {
 if (!user) {
 return guestPulse();
 }

 if (isLoading && !stress) {
 const moon = snapshotTransitPlanets(new Date()).find((planet) => planet.id ==="moon");
 return {
 moonLine: moon ? `Şu an Ay ${moon.signName} Burcunda` :"Gökyüzü verisi yükleniyor…",
 flowLine:"Kozmik Nabız Taranıyor",
 isLoading: true,
 };
 }

 const moon = snapshotTransitPlanets(new Date()).find((planet) => planet.id ==="moon");
 const moonSign = moon?.signName ??"—";

 return {
 moonLine: `Şu an Ay ${moonSign} Burcunda`,
 flowLine: flowLineFromStress(stress),
 isLoading,
 };
 }, [isLoading, stress, user]);
}
