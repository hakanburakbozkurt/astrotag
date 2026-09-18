import type { ComponentType } from "react";
import {
  BondModuleIcon,
  HoraryModuleIcon,
  ManifestModuleIcon,
  NatalModuleIcon,
  NexusModuleIcon,
  TarotModuleIcon,
} from "@/components/lobby/icons/LobbyModuleIcons";
import { CosmicProfileModuleIcon, ExpertModuleIcon } from "@/components/navigation/DashboardHomeIcons";

export type DashboardHomeModuleId =
  | "manifest"
  | "horary"
  | "cosmic-profile"
  | "tarot"
  | "natal"
  | "synastry"
  | "expert"
  | "nexus";

export interface DashboardHomeModule {
  id: DashboardHomeModuleId;
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const DASHBOARD_HOME_MODULES: DashboardHomeModule[] = [
  { id: "manifest", title: "Manifest", href: "/dashboard/manifest", icon: ManifestModuleIcon },
  { id: "horary", title: "Horary", href: "/dashboard/oracle/horary", icon: HoraryModuleIcon },
  {
    id: "cosmic-profile",
    title: "Kozmik Profil",
    href: "/dashboard/kozmik-profil",
    icon: CosmicProfileModuleIcon,
  },
  { id: "tarot", title: "Tarot", href: "/dashboard/tarot", icon: TarotModuleIcon },
  { id: "natal", title: "Natal", href: "/dashboard/natal", icon: NatalModuleIcon },
  { id: "synastry", title: "Sinastri", href: "/dashboard/bonds", icon: BondModuleIcon },
  { id: "expert", title: "Uzman", href: "/dashboard/experts", icon: ExpertModuleIcon },
  { id: "nexus", title: "Nexus", href: "/dashboard/nexus", icon: NexusModuleIcon },
];
