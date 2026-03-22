import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Studiengine — AI Exam Prep for Nigerian Students",
  description: "Turn your notes and past questions into interactive quizzes. Built for JAMB, WAEC, and Nigerian university students.",
    icons: { icon: "/studiengine-logo.svg" },
  openGraph: {
    images: ["/studiengine-logo.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/studiengine-logo.svg" type="image/svg+xml" />
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
