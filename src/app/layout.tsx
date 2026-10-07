import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusPulse - Smart Campus Resource Finder",
  description: "Know before you go. Privacy-first smart campus resource finder and real-time crowd predictor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#040d1f] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
