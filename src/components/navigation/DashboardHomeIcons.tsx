import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function IconShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export function CosmicProfileModuleIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <circle cx="24" cy="16" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10 38c3-6 8-9 14-9s11 3 14 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </IconShell>
  );
}

export function ExpertModuleIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <circle cx="24" cy="18" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 40c2.5-5 6.5-8 12-8s9.5 3 12 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M32 14l3-2M16 14l-3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconShell>
  );
}
