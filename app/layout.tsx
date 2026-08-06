import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PwaPrompts } from "@/components/PwaPrompts";
import "./globals.css";

const pixelTitle = Press_Start_2P({
  variable: "--font-pixel-title",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const pixelBody = VT323({
  variable: "--font-pixel-body",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const APP_URL = "https://lobisomem-monstros.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "Monstros",
  title: {
    default: "Lobisomem por Uma Noite — Monstros",
    template: "%s · Monstros",
  },
  description:
    "Jogo multiplayer online de dedução social. Descubra quem é o lobisomem antes que seja tarde demais!",
  keywords: [
    "lobisomem",
    "one night",
    "monstros",
    "jogo",
    "multiplayer",
    "dedução",
  ],
  authors: [{ name: "Igor Melo" }],
  creator: "Igor Melo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Monstros",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Monstros",
    title: "Lobisomem por Uma Noite — Monstros",
    description:
      "Jogo multiplayer online de dedução social. 3 a 7 jogadores, uma noite.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "Lobisomem por Uma Noite — Monstros",
    description: "Jogo multiplayer online de dedução social.",
    images: ["/icons/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#14092b" },
    { media: "(prefers-color-scheme: light)", color: "#14092b" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${pixelTitle.variable} ${pixelBody.variable} h-full antialiased`}
    >
      <body
        className="min-h-dvh flex flex-col bg-night text-parchment font-body"
        suppressHydrationWarning
      >
        {children}
        <ServiceWorkerRegister />
        <PwaPrompts />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
