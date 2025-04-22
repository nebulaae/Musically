import { Metadata } from "next";
import { ThemeProviders } from "../providers/ThemeProviders";

import "../globals.css";

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
        <div>
            <ThemeProviders>
                {children}
            </ThemeProviders>
        </div>
    );
};