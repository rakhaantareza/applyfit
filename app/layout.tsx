import type { Metadata } from "next";
import { AuthSessionProvider } from "./components/AuthSessionProvider";
import { LanguageProvider } from "./components/LanguageProvider";
import "./globals.css";
import "./design-system.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      {/* Browser extensions may add attributes such as cz-shortcut-listen before
          React hydrates. Suppress only this root attribute mismatch; application
          content hydration remains fully checked. */}
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
