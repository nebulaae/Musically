"use client"

import Link from "next/link";
import { useState, useEffect } from "react";

import { usePathname } from "next/navigation";
import {
    Home,
    Search,
    LibraryBig,
    UserRound
} from "lucide-react";

export const Bottombar = () => {
    const pathname = usePathname();

    const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
    const [prevScrollPos, setPrevScrollPos] = useState(0);

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
            title: "Профиль",
            url: "/profile",
            icon: <UserRound />,
        },
    ]

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.scrollY;

            if (currentScrollPos > prevScrollPos && currentScrollPos > 100) {
                setIsBottomBarVisible(false);
            } else {
                setIsBottomBarVisible(true);
            }

            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos]);

    const bottomBarStyle = {
        transform: isBottomBarVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
    };

    return (
        <nav style={bottomBarStyle} className="fixed bottom-0 p-2 xs:px-7 md:hidden z-10 w-full bg-sidebar glassmorphism border-t-[1px]" >
            <div className="flex items-center justify-between gap-2 xs:gap-4">
                {links.map((link) => {
                    return (
                        <Link
                            href={link.url}
                            key={link.id}
                            className={`relative flex flex-col items-center gap-2 rounded-lg p-2 sm:flex-1 sm:px-2 sm:py-2.5 ${pathname === link.url
                                    ? "purple-text"
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