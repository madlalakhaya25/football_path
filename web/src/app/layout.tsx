import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import { InstallPrompt } from "@/components/install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GrowFit Path",
    template: "%s · GrowFit Path",
  },
  description:
    "Track development, build digital player passports, and connect coaches, players, and parents.",
  applicationName: "GrowFit Path",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GrowFit Path",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "GrowFit Path",
    title: "GrowFit Path — Football Development Platform",
    description: "Build the next generation of footballers through structured training and digital player passports.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4d7c0f" },
    { media: "(prefers-color-scheme: dark)", color: "#4d7c0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
