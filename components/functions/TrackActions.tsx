"use client"

import dynamic from 'next/dynamic';

import { useState } from 'react';
import { useToken } from '@/app/providers/TokenProvider';

import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const LikeButton = dynamic(() => import('@/components/functions/LikeButton').then((mod) => mod.LikeButton), { ssr: false });
const PlaylistActions = dynamic(() => import('@/components/functions/PlaylistActions').then((mod) => mod.PlaylistActions), { ssr: false });

export const TrackActions = ({
    trackId
}: {
    trackId: string;
}) => {
    const { isTokenExist } = useToken();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild disabled={!isTokenExist}>
                <Button
                    variant="ghost"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CirclePlus className="size-6" strokeWidth={1} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col items-start gap-2 glassmorphism">
                <LikeButton trackId={trackId} icon={false} />
                <PlaylistActions trackId={trackId} icon={false} />
            </PopoverContent>
        </Popover>
    );
};