import {
    Home,
    Search,
    LibraryBig,
    UserRound,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

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
        title: "Библиотека",
        url: "/library",
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
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="mt-2">
                            {links.map((link) => (
                                <SidebarMenuItem key={link.id}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={link.url}
                                            className="px-4 py-5"
                                        >
                                            {link.icon}
                                            <span className="text-[16px]">{link.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}