import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studiengine",
  description: "Studiengine",
  themeColor: "#2563eb",
  icons: {
    // main favicon / icon
    icon: "/studiengine-logo.svg",
    // if you still have the old 192x192 icon
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studiengine",
  },
  openGraph: {
    title: "Studiengine",
    description: "Studiengine",
    images: ["/studiengine-logo.svg"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


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
