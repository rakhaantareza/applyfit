import type { Metadata } from "next";
import { AppearanceProvider } from "./components/AppearanceProvider";
import { AuthSessionProvider } from "./components/AuthSessionProvider";
import "./globals.css";

/* eslint-disable @next/next/no-page-custom-font -- The App Router root layout loads these fonts globally; explicit links avoid Vinext's missing next/font styles in dev. */

export const metadata: Metadata = {
  title: {
    default: "ApplyFit",
    template: "%s | ApplyFit",
  },
  description:
    "Pahami kecocokan profilmu dengan lowongan melalui skill dan bukti yang transparan.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const appearanceInitializationScript = `
(() => {
  const stored = localStorage.getItem("applyfit-appearance");
  const appearance = stored === "light" || stored === "dark" ? stored : "system";
  const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = appearance === "system" ? (prefersDark ? "dark" : "light") : appearance;
  document.documentElement.dataset.appearance = appearance;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitializationScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap"
        />
      </head>
      {/* Browser extensions may add attributes such as cz-shortcut-listen before
          React hydrates. Suppress only this root attribute mismatch; application
          content hydration remains fully checked. */}
      <body suppressHydrationWarning>
        <AppearanceProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
