import type { ReactNode } from"react";

interface LobbyIconProps {
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
 viewBox="0 0 48 48"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {children}
 </svg>
 );
}

/** Manifest — parşömen + yıldız niyeti */
export function ManifestModuleIcon({ className }: LobbyIconProps) {
 return (
 <IconShell className={className}>
 <path
 d="M14 8h16l6 6v26a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
 stroke="currentColor"
 strokeWidth="1.75"
 strokeLinejoin="round"
 />
 <path d="M30 8v6h6" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
 <path
 d="M17 20h14M17 26h10M17 32h12"
 stroke="currentColor"
 strokeWidth="1.75"
 strokeLinecap="round"
 />
 <path
 d="m34 14 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4L34 14Z"
 stroke="currentColor"
 strokeWidth="1.4"
 strokeLinejoin="round"
 />
 </IconShell>
 );
}

/** Natal — doğum haritası tekerleği */
export function NatalModuleIcon({ className }: LobbyIconProps) {
 return (
 <IconShell className={className}>
 <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.75" />
 <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
 <path d="M24 8v32M8 24h32" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
 <path d="M12.7 12.7l22.6 22.6M35.3 12.7 12.7 35.3" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
 <circle cx="24" cy="24" r="3" fill="currentColor" />
 <circle cx="31" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
 </IconShell>
 );
}

/** Tarot — üç kart fan */
export function TarotModuleIcon({ className }: LobbyIconProps) {
 return (
 <IconShell className={className}>
 <rect
 x="10"
 y="14"
 width="14"
 height="22"
 rx="2.5"
 transform="rotate(-12 17 25)"
 stroke="currentColor"
 strokeWidth="1.75"
 />
 <rect
 x="17"
 y="11"
 width="14"
 height="22"
 rx="2.5"
 stroke="currentColor"
 strokeWidth="1.75"
 />
 <rect
 x="24"
 y="14"
 width="14"
 height="22"
 rx="2.5"
 transform="rotate(12 31 25)"
 stroke="currentColor"
 strokeWidth="1.75"
 />
 <path
 d="M24 18v4M24 28h.01"
 stroke="currentColor"
 strokeWidth="1.75"
 strokeLinecap="round"
 />
 <circle cx="24" cy="24" r="1.5" fill="currentColor" />
 </IconShell>
 );
}

/** Horary — kum saati + kozmik nokta */
export function HoraryModuleIcon({ className }: LobbyIconProps) {
 return (
 <IconShell className={className}>
 <path
 d="M16 10h16l-4 6v4l4 6H16l4-6v-4l-4-6Z"
 stroke="currentColor"
 strokeWidth="1.75"
 strokeLinejoin="round"
 />
 <path
 d="M20 16h8M20 28h8"
 stroke="currentColor"
 strokeWidth="1.5"
 strokeLinecap="round"
 opacity="0.65"
 />
 <path
 d="M24 22v4"
 stroke="currentColor"
 strokeWidth="1.75"
 strokeLinecap="round"
 />
 <circle cx="24" cy="8" r="1.5" fill="currentColor" />
 <path d="M24 6.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
 </IconShell>
 );
}

/** Bond — çift kalp / bağ */
export function BondModuleIcon({ className }: LobbyIconProps) {
 return (
 <IconShell className={className}>
 <path
 d="M18 30s-6-4.2-6-9.2c0-3.4 2.6-5.8 5.8-5.8 1.8 0 3.4.9 4.2 2.2.8-1.3 2.4-2.2 4.2-2.2 3.2 0 5.8 2.4 5.8 5.8C32 25.8 26 30 26 30"
 stroke="currentColor"
 strokeWidth="1.75"
 strokeLinejoin="round"
 />
 <path
 d="M14 34c2.2 2.4 4.8 3.6 10 3.6s7.8-1.2 10-3.6"
 stroke="currentColor"
 strokeWidth="1.5"
 strokeLinecap="round"
 opacity="0.55"
 />
 <path
 d="M24 12v3M20 13.5l2 2M28 13.5l-2 2"
 stroke="currentColor"
 strokeWidth="1.5"
 strokeLinecap="round"
 />
 </IconShell>
 );
}

/** Nexus — orbit halkaları */
export function NexusModuleIcon({ className }: LobbyIconProps) {
 return (
 <IconShell className={className}>
 <ellipse
 cx="24"
 cy="24"
 rx="14"
 ry="6"
 stroke="currentColor"
 strokeWidth="1.75"
 transform="rotate(-28 24 24)"
 />
 <ellipse
 cx="24"
 cy="24"
 rx="14"
 ry="6"
 stroke="currentColor"
 strokeWidth="1.75"
 transform="rotate(28 24 24)"
 />
 <circle cx="24" cy="24" r="3.5" stroke="currentColor" strokeWidth="1.75" />
 <circle cx="24" cy="24" r="1.25" fill="currentColor" />
 <circle cx="34" cy="18" r="2" fill="currentColor" />
 </IconShell>
 );
}
