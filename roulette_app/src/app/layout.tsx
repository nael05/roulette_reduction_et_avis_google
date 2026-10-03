import type { Metadata } from "next";
import { Orbitron, Exo_2, Montserrat } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clean Wash & Co - Roulette",
  description: "Tournez la roue et gagnez des réductions !",
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${orbitron.variable} ${exo2.variable} ${montserrat.variable} antialiased`}>
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        {/* Background Elements */}
        <div className="hero-background" />
        <div className="grid-overlay" />
        <div className="gradient-sphere sphere-1" />
        <div className="gradient-sphere sphere-2" />

        {children}
      </body>
    </html>
  );
}
