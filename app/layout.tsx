import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TrpcProvider } from "@/lib/trpc/provider";
import { ToastProvider } from "@/lib/toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Truls HR",
  description: "HR og HMS-system",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Truls HR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1b2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <TrpcProvider>
            <ToastProvider>{children}</ToastProvider>
          </TrpcProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
