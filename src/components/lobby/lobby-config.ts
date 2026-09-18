import type { ComponentType } from "react";
import {
  BondModuleIcon,
  HoraryModuleIcon,
  ManifestModuleIcon,
  NatalModuleIcon,
  NexusModuleIcon,
  TarotModuleIcon,
} from "@/components/lobby/icons/LobbyModuleIcons";

export type LobbyModuleId =
  | "manifest"
  | "natal"
  | "tarot"
  | "horary"
  | "bond"
  | "nexus";

export interface LobbyModuleItem {
  id: LobbyModuleId;
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  glowFrom: string;
  glowTo: string;
  iconTone: string;
}

export const LOBBY_MODULE_GRID: LobbyModuleItem[] = [
  {
    id: "manifest",
    title: "Manifest",
    href: "/dashboard",
    icon: ManifestModuleIcon,
    glowFrom: "rgba(255,255,255,0.06)",
    glowTo: "rgba(255,255,255,0.01)",
    iconTone: "text-stone-300",
  },
  {
    id: "natal",
    title: "Natal Haritası",
    href: "/dashboard/natal",
    icon: NatalModuleIcon,
    glowFrom: "rgba(255,255,255,0.05)",
    glowTo: "rgba(255,255,255,0.01)",
    iconTone: "text-stone-300",
  },
  {
    id: "tarot",
    title: "Tarot",
    href: "/dashboard?module=tarot",
    icon: TarotModuleIcon,
    glowFrom: "rgba(255,255,255,0.07)",
    glowTo: "rgba(255,255,255,0.01)",
    iconTone: "text-stone-300",
  },
  {
    id: "horary",
    title: "Horary",
    href: "/dashboard/oracle/horary",
    icon: HoraryModuleIcon,
    glowFrom: "rgba(255,255,255,0.04)",
    glowTo: "rgba(255,255,255,0.01)",
    iconTone: "text-stone-400",
  },
  {
    id: "bond",
    title: "Bond",
    href: "/dashboard/bonds",
    icon: BondModuleIcon,
    glowFrom: "rgba(255,255,255,0.05)",
    glowTo: "rgba(255,255,255,0.01)",
    iconTone: "text-stone-300",
  },
  {
    id: "nexus",
    title: "Nexus",
    href: "/dashboard/nexus",
    icon: NexusModuleIcon,
    glowFrom: "rgba(255,255,255,0.06)",
    glowTo: "rgba(255,255,255,0.01)",
    iconTone: "text-stone-300",
  },
];

export type LobbyNavTabId = "home" | "history" | "payment" | "inbox" | "account";

export interface LobbyNavTab {
  id: LobbyNavTabId;
  label: string;
  href: string;
}

export const LOBBY_BOTTOM_NAV: LobbyNavTab[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "history", label: "History", href: "/dashboard/profile" },
  { id: "payment", label: "Payment", href: "/dashboard/star-packages" },
  { id: "inbox", label: "Inbox", href: "/dashboard/expert-requests" },
  { id: "account", label: "Account", href: "/dashboard/profile" },
];
