import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TrpcProvider } from "@/lib/trpc/provider";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR/HMS Portalen",
  description: "Intern HR og HMS-løsning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HR/HMS",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
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
