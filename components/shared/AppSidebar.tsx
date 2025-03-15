"use client"

import Link from "next/link";

import {
    Home,
    Search,
    LibraryBig,
    UserRound,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

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
        title: "Подборки",
        url: "/collections",
        icon: <LibraryBig />,
    },
    {
        id: 4,
        title: "Профиль",
        url: "/profile",
        icon: <UserRound />,
    },
]

export const AppSidebar = () => {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="mt-12">
                            {links.map((link) => {
                                const isActive = pathname === link.url;
                                return (
                                    <SidebarMenuItem key={link.id}>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={link.url}
                                                className={`flex flex-row items-center px-4 ${isActive ? 'before:absolute before:-left-1 before:h-1.5 before:w-1.5 before:rounded-full before:bg-purple-800' : ''}`}
                                            >
                                                <div className={`flex items-center justify-center size-8 ${isActive ? 'text-purple-800' : ''}`}>{link.icon}</div>
                                                <span className={`text-[18px] ${isActive ? 'text-purple-800' : ''}`}>{link.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};

export const Trigger = () => {
    const { open, toggleSidebar } = useSidebar()

    return (
        <div>
            <div onClick={toggleSidebar} className="fixed hidden cursor-pointer select-none -translate-x-4 mt-4 z-50 md:flex bg-purple-200/50 rounded-full">
                {open ? <ChevronLeft className="size-8 text-purple-800" strokeWidth={1.25} /> : <ChevronRight className="size-8 text-purple-800" strokeWidth={1.25} />}
            </div>
        </div>
    );
};