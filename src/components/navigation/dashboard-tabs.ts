export type DashboardTabId = "dashboard" | "natal" | "bonds" | "nexus" | "profile";

export interface DashboardTab {
  id: DashboardTabId;
  label: string;
  shortLabel: string;
  href: string;
}

export const DASHBOARD_TABS: DashboardTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    href: "/dashboard",
  },
  {
    id: "natal",
    label: "Natal",
    shortLabel: "Natal",
    href: "/dashboard/natal",
  },
  {
    id: "bonds",
    label: "Cosmic Bonds",
    shortLabel: "Bonds",
    href: "/dashboard/bonds",
  },
  {
    id: "nexus",
    label: "Nexus",
    shortLabel: "Nexus",
    href: "/dashboard/nexus",
  },
  {
    id: "profile",
    label: "Profile",
    shortLabel: "Profile",
    href: "/dashboard/profile",
  },
];

export function resolveDashboardTab(pathname: string): DashboardTabId {
  if (pathname.startsWith("/dashboard/natal")) {
    return "natal";
  }

  if (
    pathname.startsWith("/dashboard/oracle") ||
    pathname.startsWith("/dashboard/horary")
  ) {
    return "dashboard";
  }

  if (
    pathname.startsWith("/dashboard/bonds") ||
    pathname.startsWith("/dashboard/compatibility")
  ) {
    return "bonds";
  }

  if (pathname.startsWith("/dashboard/nexus")) {
    return "nexus";
  }

  if (
    pathname.startsWith("/dashboard/profile") ||
    pathname.startsWith("/dashboard/settings")
  ) {
    return "profile";
  }

  return "dashboard";
}

/** Alt sekme kökü dışındaki derin sayfalar (ör. horary) */
export function isDashboardSubPage(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "dashboard" || segments.length < 3) {
    return false;
  }

  const section = segments[1];

  return section === "oracle" || section === "bonds" || section === "profile";
}

export function getTabRootHref(tab: DashboardTabId): string {
  return DASHBOARD_TABS.find((item) => item.id === tab)?.href ?? "/dashboard";
}
