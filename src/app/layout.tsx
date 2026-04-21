import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "Scoring System | Maritime Client Intelligence",
  description: "Advanced client scoring & analytics platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <div className="aurora-bg" />
        <div className="grain-overlay" />
        <div className="relative z-10 flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 lg:ml-72 p-4 sm:p-6 lg:p-8 grid-pattern overflow-auto">
            <CommandPalette />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
