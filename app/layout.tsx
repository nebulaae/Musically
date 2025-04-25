import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { getToken } from "@/lib/token";
import { Toaster } from "@/components/ui/sonner";
import { TokenProvider } from "./providers/TokenProvider";
import { ThemeProviders } from "./providers/ThemeProviders";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ayfaar Radio",
  description: "Music player as spotify, but with author's favorite music.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tokenResult = await getToken();
  const token = tokenResult?.token?.value;

  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProviders>
          <TokenProvider token={token}>
            {children}
            <Toaster />
          </TokenProvider>
        </ThemeProviders>
      </body>
    </html>
  );
};