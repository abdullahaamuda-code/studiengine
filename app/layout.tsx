import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Studiengine — AI CBT Exam Prep for Nigerian Students",
  description: "Turn your notes and past questions into CBT practice. Built for JAMB, WAEC, NECO and Nigerian university students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studiengine",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
<head>
  <meta name="theme-color" content="#2563eb" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Studiengine" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <link rel="manifest" href="/manifest.json" />
  
  <!-- Added icons and openGraph for Next.js metadata -->
  <meta property="og:image" content="/studiengine-logo.svg" />
</head>

      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
