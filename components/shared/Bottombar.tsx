"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import {
    Home,
    Search,
    LibraryBig,
    Heart
} from "lucide-react";

export const Bottombar = () => {
    const pathname = usePathname();

    const links = [
        {
            id: 1,
            title: "Главная",
            url: "/",
            icon: <Home />,
        },
        {
            id: 2,
            title: "Поиск",
            url: "/search",
            icon: <Search />,
        },
        {
            id: 3,
            title: "Плейлисты",
            url: "/playlist",
            icon: <LibraryBig />,
        },
        {
            id: 4,
            title: "Понравившиеся",
            url: "/favorite",
            icon: <Heart />,
        },
    ]

    return (
        <nav className="fixed bottom-0 p-4 xs:px-7 md:hidden z-10 w-full bg-sidebar glassmorphism border-t-[1px] bg-neutral-300" >
            <div className="flex items-center justify-between gap-2 xs:gap-4">
                {links.map((link) => {
                    return (
                        <Link
                            href={link.url}
                            key={link.id}
                            className={`relative flex flex-col items-center gap-2 rounded-lg p-2 sm:flex-1 sm:px-2 sm:py-2.5 ${
                                pathname === link.url
                                    ? "text-purple-800 mb-2 before:absolute before:-bottom-1 before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-800"
                                    : ""}`}
                        >
                            {link.icon}
                            <p className="max-sm:hidden text-xs">
                                {link.title.split(/\s+/)[0]}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};