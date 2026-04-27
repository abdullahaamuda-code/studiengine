import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";

/* ─────────────────────────────────────────────
   METADATA
───────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "Studiengine — AI-Powered CBT Practice",
    template: "%s · Studiengine",
  },
  description:
    "Turn your notes and past questions into real CBT practice. AI-generated MCQs, topic analytics, and step-by-step explanations — built for African students.",
  keywords: [
    "JAMB", "WAEC", "CBT practice", "past questions", "AI quiz",
    "Nigerian students", "exam prep", "study tool",
  ],
  authors: [{ name: "Studiengine" }],
  creator: "Studiengine",

  icons: {
    icon: [
      { url: "/studiengine-logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: "/icon-192.png",
    shortcut: "/studiengine-logo.svg",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studiengine",
  },

  openGraph: {
    type: "website",
    locale: "en_NG",
    title: "Studiengine — AI-Powered CBT Practice",
    description:
      "Upload your notes or past questions and get instant CBT practice with AI explanations. Built for JAMB, WAEC & beyond.",
    siteName: "Studiengine",
    images: [
      {
        url: "/studiengine-logo.svg",
        width: 512,
        height: 512,
        alt: "Studiengine logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "Studiengine — AI-Powered CBT Practice",
    description:
      "Turn your notes & past questions into real CBT practice. Free for African students.",
  },

  manifest: "/manifest.json",
};

/* ─────────────────────────────────────────────
   VIEWPORT  (themeColor moved here in Next 14+)
───────────────────────────────────────────── */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#080c14" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,   // prevent iOS double-tap zoom
  userScalable: false,
};

/* ─────────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        suppressHydrationWarning on <html> prevents React from warning when
        ThemeProvider adds data-theme before hydration completes.
      */}
      <head>
        {/* Preconnect to font origins for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Prevent flash of unstyled theme — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (!t) {
                  t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                document.documentElement.setAttribute('data-theme', t);
              } catch(e) {}
            `,
          }}
        />
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
