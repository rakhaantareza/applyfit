import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
