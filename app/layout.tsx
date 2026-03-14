import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "json-maps/styles.css";
import { Sidebar } from "@/components/sidebar";
import { PasswordGate } from "@/components/password-gate";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "F3 Intelligence — Fresh from Farm",
  description: "AI-Powered Fresh Produce Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${dmSerif.variable} ${jetbrains.variable}`}>
      <body className="antialiased font-body bg-background text-foreground min-h-screen selection:bg-primary/20">
        <PasswordGate>
          <Sidebar />
          <main className="min-h-screen px-4 pt-[72px] pb-24 lg:ml-64 lg:px-8 lg:pt-8 lg:pb-8">
            {children}
          </main>
        </PasswordGate>
      </body>
    </html>
  );
}
