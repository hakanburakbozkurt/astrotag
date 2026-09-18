export interface ProfileMenuLink {
  href: string;
  label: string;
  adminOnly?: boolean;
}

export const PROFILE_MENU_LINKS: ProfileMenuLink[] = [
  { href: "/profil/bilgiler", label: "Kişisel Bilgiler" },
  { href: "/profil/rozetler", label: "Rozetlerim" },
  { href: "/profil/gunlugum", label: "Günlüğüm" },
  { href: "/profil/paylasim", label: "Paylaşım" },
  { href: "/profil/hesap", label: "Hesap" },
  { href: "/profil/admin", label: "Admin", adminOnly: true },
];
