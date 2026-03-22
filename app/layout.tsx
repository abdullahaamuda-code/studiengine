import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Studiengine",
  description: "Studiengine",
  themeColor: "#2563eb",
  icons: {
    // main favicon / icon
    icon: "/studiengine-logo.svg",
    // apple touch icon (what you had before)
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
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
