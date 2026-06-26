import type { DashboardModule } from "./modules/config";

const iconClass = "h-7 w-7 text-amber-400/90";

function ModuleIcon({ icon }: { icon: DashboardModule["icon"] }) {
  switch (icon) {
    case "chart":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 3v18M3 12h18M7.5 7.5l9 9M16.5 7.5l-9 9" />
        </svg>
      );
    case "hearts":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5-3.5-7.5-6.5-7.5-9.5a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 3-3 6-7.5 9.5z" />
        </svg>
      );
    case "sky":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path strokeLinecap="round" d="M4 19h16" />
        </svg>
      );
    case "tarot":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path strokeLinecap="round" d="M12 7v4M12 15h.01" />
        </svg>
      );
    case "profile":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="8" r="3.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" />
          <path strokeLinecap="round" d="M4 12h2M18 12h2M12 4V2" />
        </svg>
      );
  }
}

export default ModuleIcon;
