import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Teach Me Lava Lamps",
  description:
    "A simulation of the lava lamps encryption algorithm that is controllable by an agentic AI for intuitive purposes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="c3b610e9-91ea-4d45-b2bc-2188b30fd7e6"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
