"use client"

import dynamic from 'next/dynamic';

import { useState } from 'react';
import { CirclePlus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TrackActions = ({
    trackId
}: {
    trackId: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = () => setIsOpen(false);

    const LikeButton = dynamic(() => import('@/components/functions/LikeButton').then((mod) => mod.LikeButton), { ssr: false });
    const PlaylistActions = dynamic(() => import('@/components/functions/PlaylistActions').then((mod) => mod.PlaylistActions), { ssr: false });

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <CirclePlus className="size-6" strokeWidth={1} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glassmorphism">
                <DropdownMenuItem className="cursor-pointer" onSelect={handleClose}>
                    <LikeButton trackId={trackId} icon={false}/>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='flex items-center justify-center cursor-pointer' onSelect={handleClose}>
                    <PlaylistActions trackId={trackId} icon={false} />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};