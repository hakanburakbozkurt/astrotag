import type { ReactElement, ReactNode } from "react";
import type { DashboardTabId } from "./dashboard-tabs";

interface TabIconProps {
  className?: string;
}

function IconShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardTabIcon({ className }: TabIconProps) {
  return (
    <IconShell className={className}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
    </IconShell>
  );
}

export function OracleTabIcon({ className }: TabIconProps) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.6 6.8l1.6 1.6M17.8 18l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.6 17.2l1.6-1.6M17.8 6l1.6-1.6" />
    </IconShell>
  );
}

export function BondsTabIcon({ className }: TabIconProps) {
  return (
    <IconShell className={className}>
      <path d="M7.5 11.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <path d="M5.5 11.5c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M8.5 16.5c1.2 1.4 2.6 2 3.5 2s2.3-.6 3.5-2" />
    </IconShell>
  );
}

export function ProfileTabIcon({ className }: TabIconProps) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M6.5 19.5c.9-2.8 3-4.5 5.5-4.5s4.6 1.7 5.5 4.5" />
    </IconShell>
  );
}

const TAB_ICON_MAP: Record<
  DashboardTabId,
  (props: TabIconProps) => ReactElement
> = {
  dashboard: DashboardTabIcon,
  oracle: OracleTabIcon,
  bonds: BondsTabIcon,
  profile: ProfileTabIcon,
};

export function TabIcon({
  tab,
  className,
}: TabIconProps & { tab: DashboardTabId }) {
  const Icon = TAB_ICON_MAP[tab];
  return <Icon className={className} />;
}
