export interface ProfileMenuLink {
  href: string;
  label: string;
  adminOnly?: boolean;
  expertOnly?: boolean;
}

export const PROFILE_MENU_LINKS: ProfileMenuLink[] = [
  { href: "/dashboard/expert-services", label: "Hizmet Ekle / Yönet", expertOnly: true },
  { href: "/profil/bilgiler", label: "Kişisel Bilgiler" },
  { href: "/profil/rozetler", label: "Rozetlerim" },
  { href: "/profil/gunlugum", label: "Günlüğüm" },
  { href: "/profil/paylasim", label: "Paylaşım" },
  { href: "/profil/hesap", label: "Hesap" },
  { href: "/profil/admin", label: "Admin", adminOnly: true },
];
