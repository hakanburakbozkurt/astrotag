export type DashboardTabId = "dashboard" | "oracle" | "bonds" | "profile";

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
    id: "oracle",
    label: "Cosmic Oracle",
    shortLabel: "Oracle",
    href: "/dashboard/oracle",
  },
  {
    id: "bonds",
    label: "Cosmic Bonds",
    shortLabel: "Bonds",
    href: "/dashboard/bonds",
  },
  {
    id: "profile",
    label: "Profile",
    shortLabel: "Profile",
    href: "/dashboard/profile",
  },
];

export function resolveDashboardTab(pathname: string): DashboardTabId {
  if (pathname.startsWith("/dashboard/oracle") || pathname.startsWith("/dashboard/horary")) {
    return "oracle";
  }

  if (
    pathname.startsWith("/dashboard/bonds") ||
    pathname.startsWith("/dashboard/compatibility")
  ) {
    return "bonds";
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
