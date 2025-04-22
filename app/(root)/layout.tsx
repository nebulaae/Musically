import { Metadata } from "next";

import BottomPlayer from "@/components/player/BottomPlayer";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Bottombar } from "@/components/shared/Bottombar";
import { ThemeProviders } from "../providers/ThemeProviders";
import { AudioProvider } from "@/components/player/AudioContext";
import { AppSidebar, Trigger } from "@/components/shared/AppSidebar";

import "../globals.css";

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
    <section>
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