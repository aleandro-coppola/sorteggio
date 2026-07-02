import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASSENZIO — La Ruota dei Sorteggi",
  description:
    "Distillato di pura fortuna dal 1805. Duelli, eliminazioni, squadre, penitenze e sfottò in napoletano. Da usare con amici, al mare e nei giochi alcolici. Bere responsabilmente, perdere con dignità.",
};

export const viewport: Viewport = {
  themeColor: "#06110b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
