import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TrpcProvider } from "@/lib/trpc/provider";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pulsfollo",
  description: "HR og HMS for Pulsfollo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pulsfollo",
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
    <html lang="nb">
      <body className={inter.className}>
        <TrpcProvider>
          <ToastProvider>{children}</ToastProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
