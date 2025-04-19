import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import BottomPlayer from "@/components/player/BottomPlayer";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Bottombar } from "@/components/shared/Bottombar";
import { ThemeProviders } from "../providers/ThemeProviders";
import { AudioProvider } from "@/components/player/AudioContext";
import { AppSidebar, Trigger } from "@/components/shared/AppSidebar";

import "../globals.css";

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

  return (
    <section
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <ThemeProviders>
        <SidebarProvider>
          <AudioProvider>
            <AppSidebar />
            <Trigger />
            {children}
            <BottomPlayer />
            <Bottombar />
          </AudioProvider>
        </SidebarProvider>
      </ThemeProviders>
    </section>
  );
};