import type { MetadataRoute } from "next";

// Web App Manifest: rende l'app installabile in home come PWA.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ASSENZIO — La Ruota dei Sorteggi",
    short_name: "Assenzio",
    description:
      "Ruota dei sorteggi, giochi con gli amici e contabar delle bevute. Distillato di pura fortuna.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06110b",
    theme_color: "#06110b",
    lang: "it",
    categories: ["games", "entertainment", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
