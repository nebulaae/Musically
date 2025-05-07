"use client"

import dynamic from 'next/dynamic';

import { useState, useEffect } from 'react';
import { useToken } from '@/app/providers/TokenProvider';

import { CirclePlus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const LikeButton = dynamic(() => import('@/components/functions/LikeButton').then((mod) => mod.LikeButton), { ssr: false });
const PlaylistActions = dynamic(() => import('@/components/functions/PlaylistActions').then((mod) => mod.PlaylistActions), { ssr: false });

export const TrackActions = ({
    trackId,
    heart = false,
}: {
    trackId: string;
    heart?: boolean;
}) => {
    const { isTokenExist } = useToken();
    const [isOpen, setIsOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if (!trackId || !isTokenExist) return;

        const fetchLikeStatus = async () => {
            try {
                const res = await fetch('/api/user/isSongLiked', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trackId }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setIsLiked(data.isLiked);
                }
            } catch (err) {
                console.error('Error fetching like status:', err);
            }
        };

        fetchLikeStatus();
    }, [trackId, isTokenExist]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild disabled={!isTokenExist}>
                <Button
                    variant="ghost"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {heart ? (
                        <Heart className={`size-6 
                                            ${isLiked
                                ? 'fill-red-500 text-red-500'
                                : 'text-neutral-800 hover:text-neutral-700 dark:text-neutral-50 dark:hover:text-neutral-200'}`}
                        />
                    ) : (
                        <CirclePlus className="size-6" strokeWidth={1} />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col items-start gap-2 glassmorphism">
                <LikeButton trackId={trackId} icon={false} />
                <PlaylistActions trackId={trackId} icon={false} />
            </PopoverContent>
        </Popover>
    );
};