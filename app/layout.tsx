import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VanCal - Systemic Calendar & Life Balance Manager",
  description: "Balance your life across Health, Work, and Relationships with VanCal's intelligent calendar system. Manage events, get AI insights, and maintain optimal life balance.",
  keywords: "calendar, scheduling, life balance, productivity, health, work, relationships",
  authors: [{ name: "VanCal Team" }],
  openGraph: {
    title: "VanCal - Systemic Calendar",
    description: "Balance your life across all your important systems",
    type: "website",
  },
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
        <ConvexClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
