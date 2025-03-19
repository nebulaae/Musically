"use client"

import Link from "next/link";

import {
    Home,
    Search,
    LibraryBig,
    Heart,
    PanelRightClose,
    PanelRightOpen,
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

export const AppSidebar = () => {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="mt-14">
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
            <div onClick={toggleSidebar} className="fixed hidden cursor-pointer select-none -translate-x-10 mt-4 z-50 md:flex">
                {open ? <PanelRightClose className="size-6 text-purple-800" /> : <PanelRightOpen className="size-6 text-purple-800" />}
            </div>
        </div>
    );
};