import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AppContextProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: { default: "CampusPulse", template: "%s | CampusPulse" },
  description: "Know before you go. Privacy-first smart campus resource finder and crowd predictor.",
  keywords: ["campus", "study spaces", "occupancy", "crowd prediction", "university"],
  openGraph: {
    title: "CampusPulse",
    description: "Know before you go.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <AppContextProvider>
            {children}
          </AppContextProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
