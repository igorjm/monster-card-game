import type { MetadataRoute } from "next";
import { getDefaultThemePack } from "@/lib/themes/registry";

export default function manifest(): MetadataRoute.Manifest {
  const theme = getDefaultThemePack();
  return {
    id: "/",
    name: theme.brand.title,
    short_name: theme.shortName,
    description: theme.brand.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: theme.palette.background,
    theme_color: theme.palette.background,
    lang: theme.locale,
    dir: "ltr",
    categories: ["games", "entertainment"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
