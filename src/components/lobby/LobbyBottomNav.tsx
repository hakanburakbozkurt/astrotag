"use client";

import Link from"next/link";
import { usePathname } from"next/navigation";
import {
 Clock3,
 CreditCard,
 Home,
 Inbox,
 UserCircle2,
} from"lucide-react";
import { LOBBY_BOTTOM_NAV, type LobbyNavTabId } from "@/components/lobby/lobby-config";

const TAB_ICONS: Record<LobbyNavTabId, typeof Home> = {
 home: Home,
 history: Clock3,
 payment: CreditCard,
 inbox: Inbox,
 account: UserCircle2,
};

function isTabActive(tabId: LobbyNavTabId, pathname: string, href: string): boolean {
 if (tabId ==="home") {
 return pathname ==="/";
 }

 return pathname === href || pathname.startsWith(`${href}/`);
}

export default function LobbyBottomNav() {
 const pathname = usePathname();

 return (
 <nav
 aria-label="Lobi navigasyonu"
 className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/92 backdrop-saturate-150"
 style={{ paddingBottom:"env(safe-area-inset-bottom, 0px)" }}
 >
 <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
 {LOBBY_BOTTOM_NAV.map((tab) => {
 const Icon = TAB_ICONS[tab.id];
 const active = isTabActive(tab.id, pathname, tab.href);

 return (
 <Link
 key={tab.id}
 href={tab.href}
 prefetch
 className="group flex min-h-12 flex-col items-center justify-center gap-1 rounded-sm px-1 py-1.5 transition active:scale-[0.98]"
 aria-current={active ?"page" : undefined}
 >
 <span
 className={
 active
 ?"flex h-8 w-8 items-center justify-center rounded-sm bg-[#09090b] from-zinc-900 to-zinc-900 text-stone-300"
 :"flex h-8 w-8 items-center justify-center rounded-sm text-white/38 transition group-hover:text-white/62"
 }
 >
 <Icon className="h-4 w-4" aria-hidden />
 </span>
 <span
 className={
 active
 ?"text-[10px] font-medium leading-none text-stone-300"
 :"text-[10px] leading-none text-white/34 transition group-hover:text-white/55"
 }
 >
 {tab.label}
 </span>
 </Link>
 );
 })}
 </div>
 </nav>
 );
}
