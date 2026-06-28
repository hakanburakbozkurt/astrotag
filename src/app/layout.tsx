import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RouterReadyProvider } from "@/lib/auth/router-ready-context.client";
import AppProviders from "@/components/providers/AppProviders";
import PwaRegister from "@/components/PwaRegister";
import SecurityBootstrap from "@/components/SecurityBootstrap";
import ToastBootstrap from "@/components/ToastBootstrap";
import StaleActionGuard from "@/components/errors/StaleActionGuard";
import NfcAuthPersistenceBootstrap from "@/components/nfc/NfcAuthPersistenceBootstrap";
import { SITE_URL, WELCOME_IMAGE_PATH } from "@/lib/nfc/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstroTag — Kozmik Satış Platformu",
  description:
    "NFC anahtarlık ve yıldız paketleri. Fiziksel AstroTag ile kozmik erişiminizi başlatın.",
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  applicationName: "AstroTag",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AstroTag",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "AstroTag",
    description: "NFC anahtarlık ve kozmik yıldız paketleri — astrotag.app",
    images: [{ url: WELCOME_IMAGE_PATH, width: 512, height: 512, alt: "AstroTag" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href={WELCOME_IMAGE_PATH} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="flex min-h-dvh flex-col overflow-y-auto bg-[#070b14] text-white">
        <RouterReadyProvider>
          <AppProviders>
            <PwaRegister />
            <SecurityBootstrap />
            <ToastBootstrap />
            <StaleActionGuard />
            <NfcAuthPersistenceBootstrap />
            {children}
          </AppProviders>
        </RouterReadyProvider>
      </body>
    </html>
  );
}
