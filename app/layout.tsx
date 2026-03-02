import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "json-maps/styles.css";
import { Sidebar } from "@/components/sidebar";

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
    <html lang="en">
      <body className="antialiased">
        <Sidebar />
        {/* pt-14 = mobile top header (56px), pb-20 = mobile bottom tab bar (80px) */}
        <main className="min-h-screen px-4 pt-[72px] pb-24 lg:ml-64 lg:px-8 lg:pt-8 lg:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
