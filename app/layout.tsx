import "./globals.css";
import type { Metadata } from "next";
import "./globals.css"; // <--- C'EST CETTE LIGNE QUI MANQUE SOUVENT !

export const metadata: Metadata = {
  title: "TriCoach AI",
  description: "Premium Athlete Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}