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
    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="mt-4">
                            {links.map((link) => (
                                <SidebarMenuItem key={link.id}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={link.url}
                                            className="flex flex-row items-center px-4"
                                        >
                                            <div className="flex items-center justify-center size-8">{link.icon}</div>
                                            <span className="hidden lg:flex text-[18px]">{link.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};