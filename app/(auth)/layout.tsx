import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProviders } from "../providers/ThemeProviders";

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
    title: "Auth Page",
    description: "Page that everyone hates.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <div
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
            <ThemeProviders>
                {children}
            </ThemeProviders>
        </div>
    );
};