import type { Metadata } from "next";
import "./globals.css";
import { SmartNav } from "@/components/SmartNav"; // Import de la nav

export const metadata: Metadata = {
  title: "TriPulse App",
  description: "AI Coaching for Triathletes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      {/* md:pl-24 crée l'espace pour la barre latérale sur PC */}
      <body className="antialiased md:pl-24 bg-zinc-50">
        <SmartNav />
        {children}
      </body>
    </html>
  );
}