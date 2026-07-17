export interface LandingNavItem {
  label: string;
  href: string;
  description?: string;
}

export const LANDING_NAV_ITEMS: LandingNavItem[] = [
  {
    label: "Profilim",
    href: "/dashboard/profile",
    description: "Kozmik profilin ve ayarların",
  },
  {
    label: "Mağaza",
    href: "#paketler",
    description: "Yıldız paketleri, anahtarlık ve hediye",
  },
  {
    label: "Uzman Platformu",
    href: "#uzman-katilim",
    description: "Astrologlar için profesyonel altyapı",
  },
  {
    label: "Kozmik Rehber",
    href: "#urun-rehberi",
    description: "Ürün rehberi ve güven merkezi",
  },
  {
    label: "Destek",
    href: "#destek",
    description: "Yardım ve iletişim",
  },
];

export const QUICK_ACCESS_ITEMS = [
  {
    id: "nfc",
    label: "NFC ile Bağlan",
    description: "Anahtarlığını telefonuna dokundur",
    href: "/nfc-login",
  },
  {
    id: "code",
    label: "Dijital Kod Gir",
    description: "Kart veya hediye kodunla giriş yap",
    href: "#",
  },
  {
    id: "guest",
    label: "Misafir Olarak Keşfet",
    description: "Kayıt olmadan özellikleri incele",
    href: "#",
  },
  {
    id: "expert",
    label: "AstroTag Uzmanıyım",
    description: "Uzman paneline geç",
    href: "#",
  },
] as const;

export const VALUE_STEPS = [
  {
    id: "discover",
    title: "Yıldız Paketlerini Keşfet",
    description: "Kozmik enerjini yükle, Oracle ve Nexus deneyimini aç.",
    href: "#paketler",
    icon: "stars" as const,
  },
  {
    id: "gift",
    title: "Arkadaşlarına Hediye Gönder",
    description: "Anahtarlık kitleri ve yıldız paketleriyle anlamlı sürprizler.",
    href: "#paketler",
    icon: "gift" as const,
  },
  {
    id: "expert",
    title: "Uzmanlardan Analiz Al",
    description: "Dijital rehberliğin ötesinde birebir kozmik danışmanlık.",
    href: "#uzman-katilim",
    icon: "expert" as const,
  },
] as const;

export const FEATURE_CARDS = [
  {
    id: "natal",
    title: "Natal Harita",
    description:
      "Doğum anının gökyüzü haritasını oku; güçlü yanların ve yaşam temaların netleşsin.",
  },
  {
    id: "synastry",
    title: "Sinastri",
    description:
      "İki haritayı yan yana getir; ilişkilerde uyum, gerilim ve ortak potansiyeli keşfet.",
  },
  {
    id: "tarot",
    title: "Tarot & Oracle",
    description:
      "Anlık sorularına sembol diliyle yanıt al; günlük rehberlik ve derin içgörü.",
  },
] as const;

export const LANDING_HERO_SLOGAN =
  "Kozmik Yolculuğunu Fiziksel ve Dijital Dünyayla Taçlandır.";
