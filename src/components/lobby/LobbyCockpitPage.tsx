"use client";

import Starfield from "@/components/Starfield";
import LiveSkyPulseBanner from "@/components/lobby/LiveSkyPulseBanner";
import CosmicWalletCard from "@/components/lobby/CosmicWalletCard";
import LobbyModuleGrid from "@/components/lobby/LobbyModuleGrid";
import LobbyBottomNav from "@/components/lobby/LobbyBottomNav";
import { useLiveSkyPulse } from "@/components/lobby/use-live-sky-pulse";
import { useAuth, useUserProfile } from "@/lib/auth";

export default function LobbyCockpitPage() {
 const { isAuthenticated } = useAuth();
 const { userData } = useUserProfile();
 const pulse = useLiveSkyPulse(isAuthenticated ? userData : null);

 return (
 <main className="relative min-h-dvh overflow-x-hidden bg-[#050816] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-white">
 <Starfield variant="sales" />

 <div
 className="pointer-events-none absolute inset-0"
 aria-hidden
 style={{
 background:"radial-gradient(ellipse 120% 70% at 50% -10%, rgba(99,102,241,0.22) 0%, transparent 55%), radial-gradient(ellipse 80% 50% at 100% 20%, rgba(63,63,70,0.12) 0%, transparent 50%), radial-gradient(ellipse 70% 45% at 0% 80%, rgba(34,211,238,0.08) 0%, transparent 45%), linear-gradient(180deg, #09090b 0%, #0b1020 45%, #120a24 100%)",
 }}
 />

 <div className="relative mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg sm:gap-5 sm:px-5 sm:pt-6">
 <header className="px-0.5">
 <p className="text-[10px] uppercase tracking-[0.34em] text-zinc-500">
 4 Kapılı Lobi
 </p>
 <h1 className="mt-1 text-xl font-semibold tracking-tight text-white/95 sm:text-2xl">
 Kozmik Kokpit
 </h1>
 </header>

 <LiveSkyPulseBanner pulse={pulse} />
 <CosmicWalletCard user={userData} isAuthenticated={isAuthenticated} />
 <LobbyModuleGrid />
 </div>

 <LobbyBottomNav />
 </main>
 );
}
