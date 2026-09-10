import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PwaPrompts } from "@/components/PwaPrompts";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getDefaultThemeId, getDefaultThemePack } from "@/lib/themes/registry";
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

const defaultTheme = getDefaultThemePack();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lobisomem-monstros.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: defaultTheme.shortName,
  title: {
    default: defaultTheme.brand.title,
    template: `%s · ${defaultTheme.shortName}`,
  },
  description: defaultTheme.brand.description,
  keywords: [
    "one night",
    "jogo",
    "multiplayer",
    "dedução",
    "jogo social",
    defaultTheme.shortName.toLocaleLowerCase(defaultTheme.locale),
  ],
  authors: [{ name: "Igor Melo" }],
  creator: "Igor Melo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: defaultTheme.shortName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: defaultTheme.shortName,
    title: defaultTheme.brand.title,
    description: defaultTheme.brand.description,
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: defaultTheme.brand.title,
    description: defaultTheme.brand.description,
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
    { media: "(prefers-color-scheme: dark)", color: defaultTheme.palette.background },
    { media: "(prefers-color-scheme: light)", color: defaultTheme.palette.background },
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
        className="min-h-dvh flex flex-col bg-night text-parchment font-body overflow-x-hidden"
        suppressHydrationWarning
      >
        <ThemeProvider themeId={getDefaultThemeId()}>
          {children}
          <ServiceWorkerRegister />
          <PwaPrompts />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
