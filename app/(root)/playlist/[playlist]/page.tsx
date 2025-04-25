"use client";

import Image from "next/image";

import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Music,
    Play,
    PauseIcon,
    Calendar
} from "lucide-react";

import { use } from "react";
import { ru } from 'date-fns/locale'
import { useTheme } from "next-themes";
import { pluralize } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Track } from '@/server/models/track';
import { formatDistanceToNow } from 'date-fns';
import { getProxiedImageUrl } from "@/lib/utils";
import { usePlaylist } from '@/hooks/usePlaylist';
import { Playlist } from '@/server/models/playlist';
import { useAudio } from '@/components/player/AudioContext';
import { FetchTracks } from '@/components/functions/FetchTracks';

interface PlaylistPageProps {
    params: Promise<{
        playlist: string;
    }>;
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
    // Get the theme
    const { theme } = useTheme();

    // Unwrap params with React.use()
    const resolvedParams = use(params);
    const playlistId = resolvedParams.playlist;

    const { getPlaylistById } = usePlaylist();
    const [playlistData, setPlaylistData] = useState<{ playlist: Playlist; tracks: Track[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dominantColor, setDominantColor] = useState('from-purple-800');

    // Improved Spotify-like gradients
    const generateGradient = () => {
        const gradients: string[] = [
            'bg-gradient-to-r from-violet-200 to-pink-200',
            'bg-gradient-to-r from-blue-200 to-cyan-200',
            'bg-gradient-to-r from-teal-200 to-teal-500',
            'bg-gradient-to-r from-fuchsia-600 to-purple-600',
            'bg-gradient-to-r from-indigo-400 to-cyan-400',
        ];

        return gradients[Math.floor(Math.random() * gradients.length)];
    };

    const generateDarkGradient = () => {
        const gradients: string[] = [
            'bg-gradient-to-r from-indigo-900 to-purple-950',
            'bg-gradient-to-l from-fuchsia-900 to-purple-950',
            'bg-gradient-to-r from-emerald-900 to-teal-950',
            'bg-gradient-to-t from-rose-900 to-pink-950',
            'bg-gradient-to-b from-amber-900 to-orange-950',
            'bg-gradient-to-tl from-sky-900 to-blue-950',
            'bg-gradient-to-br from-slate-900 to-slate-700',
            'bg-gradient-to-bl from-slate-500 to-slate-800',
            'bg-gradient-to-tr from-blue-900 to-indigo-950'
        ];

        return gradients[Math.floor(Math.random() * gradients.length)];
    };

    const { playTrackAtIndex, isPlaying, togglePlayPause, currentTrackIndex, tracks: currentTracks } = useAudio();

    // Modify your useEffect to prevent constant re-renders
    useEffect(() => {
        const fetchPlaylistData = async () => {
            try {
                // Don't set loading if already loading
                if (!isLoading) setIsLoading(true);

                const data = await getPlaylistById(playlistId);
                // Only update state if necessary
                if (data) {
                    setDominantColor(theme === 'dark' ? generateDarkGradient() : generateGradient());
                    // Use JSON.stringify comparison to avoid unnecessary updates
                    if (JSON.stringify(data) !== JSON.stringify(playlistData)) {
                        setPlaylistData(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching playlist:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaylistData();

        // Set up a less frequent refresh interval instead of constant updates
        const refreshInterval = setInterval(fetchPlaylistData, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
    }, [playlistId, getPlaylistById]); // Remove theme and playlistData from dependencies

    const handlePlayPauseClick = () => {
        if (playlistData && playlistData.tracks.length > 0) {
            // Check if we're already playing this playlist
            const currentTrack = currentTracks[currentTrackIndex];
            const isCurrentPlaylist = currentTrack &&
                playlistData.tracks.some(track => track.id === currentTrack.id);

            if (isCurrentPlaylist) {
                togglePlayPause();
            } else {
                // Start playing from the first track
                playTrackAtIndex(0, playlistData.tracks);
            }
        }
    };

    // Check if the playlist is currently playing
    const isPlaylistPlaying = () => {
        if (!isPlaying || !playlistData || playlistData.tracks.length === 0) return false;

        const currentTrack = currentTracks[currentTrackIndex];
        return currentTrack && playlistData.tracks.some(track => track.id === currentTrack.id);
    };

    const handleTrackSelect = (index: number) => {
        if (playlistData) {
            playTrackAtIndex(index, playlistData.tracks);
        }
    };

    if (isLoading) {
        return (
            <div className="container flex flex-col gap-4 items-center justify-center w-full h-full">
                <Skeleton className="w-full h-64" />
                <Skeleton className="w-full h-96" />
            </div>
        );
    }

    if (!playlistData) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center h-64">
                    <p className="text-lg">Плейлист не найден.</p>
                </div>
            </div>
        );
    }

    const { playlist, tracks } = playlistData;
    const coverImage = getProxiedImageUrl(tracks?.length > 0 && tracks[0]?.cover ? tracks[0]?.cover : '/default-cover.jpg');
    const playlistCreatedAt = new Date(playlist?.createdAt);
    const formattedDate = formatDistanceToNow(playlistCreatedAt, {
        addSuffix: true,
        locale: ru,
    });

    return (
        <div className="flex flex-col w-full min-h-screen pb-42 bg-main relative">
            {/* Spotify-like gradient background overlay */}
            <div className={`absolute top-0 left-0 right-0 h-96 backdrop-blur-xl ${dominantColor} opacity-40 z-0`} />

            {/* Header content with transparent bottom */}
            <div className="relative z-10 pt-6 md:pt-8 px-6 md:px-8">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-white">
                    <div className="w-40 h-40 md:w-48 md:h-48 bg-neutral-800 shadow-lg rounded-md overflow-hidden flex-shrink-0">
                        {tracks.length > 0 ? (
                            <Image
                                src={coverImage}
                                width={192}
                                height={192}
                                alt={playlist.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                                <Music className="w-20 h-20 text-neutral-400" />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center md:items-start">
                        <p className="text-sm uppercase tracking-wider mb-1">Плейлист</p>
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{playlist.name}</h1>
                        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm opacity-80">
                            <p className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {tracks.length !== undefined ?
                                    `${tracks.length} ${pluralize(tracks.length, ['Песня', 'Песни', 'Песен'])}`
                                    : `${playlist.tracks.length} ${pluralize(playlist.tracks.length, ['Песня', 'Песни', 'Песен'])}`
                                }

                            </p>
                            <span className="hidden sm:flex">•</span>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Создано {formattedDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transparent gradient transition to content */}
            <div className="relative z-10 bg-gradient-to-b backdrop-blur-xl bg-opacity-50 from-transparent to-neutral-50 dark:to-neutral-800 h-24 mt-6" />

            <div className="relative z-10 bg-main">
                {/* Playlist Controls */}
                <div className="py-4 px-6 md:px-8 flex items-start gap-4 -mt-16">
                    <Button
                        onClick={handlePlayPauseClick}
                        className={`rounded-full size-18 flex items-center justify-center cursor-pointer purple-button`}
                        disabled={tracks.length === 0}
                    >
                        {isPlaylistPlaying() ? (
                            <PauseIcon className="size-6 purple-text fill-purple-800 dark:fill-purple-400" strokeWidth={1} />
                        ) : (
                            <Play className="size-6 purple-text fill-purple-800 dark:fill-purple-400" strokeWidth={1} />
                        )}
                    </Button>
                </div>

                {/* Tracks List */}
                <div className="px-6 md:px-8 pb-6">
                    {tracks.length > 0 ? (
                        <FetchTracks
                            tracks={tracks}
                            isLoading={false}
                            error={null}
                            handleTrackSelect={handleTrackSelect}
                            layout="list"
                        />
                    ) : (
                        <div className="text-center py-8 backdrop-blur-md bg-opacity-20 bg-neutral-800 rounded-xl p-8">
                            <p className="text-neutral-300 mb-4">Этот плейлист пустой.</p>
                            <p className="text-sm text-neutral-400">Добавьте песни через три точки и нажмите в "Добавить в плейлист".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}