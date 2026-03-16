import type { Metadata, Viewport } from "next";
import AppNav from "@/components/AppNav";
import "@/styles/auth.css";
import "@/styles/search.css";
import "@/styles/profile-log.css";

export const metadata: Metadata = {
  title:       "NutriTrack — Kalori & Beslenme Takibi",
  description: "Hedef kaloriye göre yiyecek önerisi, makro takibi ve günlük beslenme günlüğü.",
  manifest:    "/manifest.json",
  appleWebApp: {
    capable:       true,
    statusBarStyle: "black-translucent",
    title:         "NutriTrack",
  },
  openGraph: {
    title:       "NutriTrack",
    description: "Akıllı kalori takip uygulaması",
    type:        "website",
  },
};

export const viewport: Viewport = {
  themeColor:    "#b6f542",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1,   // mobilde zoom engellemek için
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon"             href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
