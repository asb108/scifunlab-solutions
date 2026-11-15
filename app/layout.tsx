import "./globals.css";
import type { Metadata } from "next";
import { Bangers, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

const bangers = Bangers({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-comic",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "SciFunLab Open Textbook Solutions",
  description: "Standalone local workbench for contributing open-source 2D and 3D interactive textbook solutions and simulation kits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-comic-paper font-sans text-comic-ink antialiased">
        {children}
      </body>
    </html>
  );
}
