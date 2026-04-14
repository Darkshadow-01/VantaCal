import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import ClientToastProvider from "./ClientToastProvider";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
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
      className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="h-screen flex flex-col">
        <ConvexClientProvider>
          <ClientToastProvider>
            <main className="flex-1 overflow-hidden">{children}</main>
          </ClientToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
