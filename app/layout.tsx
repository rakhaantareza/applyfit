import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist+Mono&display=swap"
        />
      </head>
      {/* Browser extensions may add attributes such as cz-shortcut-listen before
          React hydrates. Suppress only this root attribute mismatch; application
          content hydration remains fully checked. */}
      <body suppressHydrationWarning>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
