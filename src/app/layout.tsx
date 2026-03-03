import type { Metadata } from "next";
import { Outfit, Merriweather, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { AppStoreProvider } from "@/context/app-store";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "700"],
});

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "KPI Monitoring System",
  description: "Sistem Monitoring Pencapaian KPI Berjenjang",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased font-sans`} suppressHydrationWarning>
        <AuthProvider>
          <AppStoreProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AppStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}