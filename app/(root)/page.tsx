"use client"

import Link from "next/link";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTracks } from "@/hooks/useTracks";
import { useToken } from "../providers/TokenProvider";
import { useAudio } from "@/components/player/AudioContext";
import { PlaylistList } from "@/components/shared/PlaylistGrid";
import { FetchTracks } from "@/components/functions/FetchTracks";
import { GetLikedSongs } from "@/components/functions/GetLikedSongs";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, PauseIcon, Play } from "lucide-react";
import { CollectionCard } from "@/components/shared/Collections";
import { WavyBackground } from "@/components/ui/magic/wavy-background";

interface User {
    username: string;
    email: string;
}

const Page = () => {
    const { theme } = useTheme();
    const { isTokenExist } = useToken();
    const { playTrackAtIndex, isPlaying, togglePlayPause, currentTrackIndex, tracks: currentTracks } = useAudio();

    const [user, setUser] = useState<User | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(!!isTokenExist);
    const [error, setError] = useState("");

    // Треки которые вы хотите видеть в окне приветствия
    const someCollection = useTracks({
        trackNames: ["6e845139983cb5b131542dc028af8303", '89e15d83498a252730be17161fe3b4e1'],
        page: 1,
        limit: 10
    });

    const tracks = someCollection.tracks;

    useEffect(() => {
        if (!isTokenExist) {
            setLoading(false);
            setUser(undefined);
            return;
        }
        const getMe = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                setUser(data.user);
            } catch (err) {
                console.error('Error fetching current user:', err);
                setError('Failed to fetch tracks');
            } finally {
                setLoading(false);
            }
        };
        getMe();
    }, [isTokenExist]);

    // Кнопка паузы и проигрывания
    const handlePlayPauseClick = () => {
        if (tracks && tracks.length > 0) {
            // Check if we're already playing this playlist
            const currentTrack = currentTracks[currentTrackIndex!];
            const isCurrentPlaylist = currentTrack &&
                tracks.some(track => track.id === currentTrack.id);

            if (isCurrentPlaylist) {
                togglePlayPause();
            } else {
                // Start playing from the first track
                playTrackAtIndex(0, tracks);
            }
        }
    };

    // Check if the playlist is currently playing
    const isPlaylistPlaying = () => {
        if (!isPlaying || !tracks || tracks.length === 0) return false;

        const currentTrack = currentTracks[currentTrackIndex!];
        return currentTrack && tracks.some(track => track.id === currentTrack.id);
    };

    return (
        <section className="flex flex-col items-center w-full h-full mt-48">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <WavyBackground
                        className="flex flex-col items-center justify-center"
                        backgroundFill={theme === "dark" ? "#262626" : "#fafafa"}
                    >
                        <div className="flex items-center justify-center w-full">
                            {loading ? (
                                <Skeleton className="w-full h-10" />
                            ) : error ? (
                                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">{error}</h1>
                            ) : isTokenExist && user ? (
                                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">С возвращением, {user.username}!</h1>
                            ) : (
                                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">Добро пожаловать!</h1>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-8 mt-8">
                            <Button
                                onClick={handlePlayPauseClick}
                                className="purple-button"
                                disabled={tracks.length === 0}

                            >
                                Слушать музыку
                                {isPlaylistPlaying() ? (
                                    <PauseIcon />
                                ) : (
                                    <Play />
                                )}
                            </Button>
                            <Link
                                href="/home"
                                className="flex flex-row gap-2 bg-neutral-300/50 hover:bg-neutral-300 dark:bg-neutral-700/50 dark:hover:bg-neutral-700 transition-all duration-200 ease-linear py-2 px-4 rounded-full"
                            >
                                На главную
                                <ChevronRight />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 w-full">
                            {/* 1. Fetch and display tracks */}
                            <div className="w-full h-full">
                                <FetchTracks
                                    tracks={someCollection.tracks}
                                    isLoading={someCollection.isLoading}
                                    error={someCollection.error}
                                    handleTrackSelect={someCollection.handleTrackSelect}
                                    layout="list"
                                    totalPages={someCollection.totalPages}
                                    currentPage={someCollection.currentPage}
                                    goToPage={someCollection.goToPage}
                                    title="Рекомендуемые треки"
                                />
                            </div>

                            {/* 2. Show current collections with links */}
                            <div className="w-full h-full">
                                <div className="flex flex-col gap-4 w-full p-6 glassmorphism rounded-xl">
                                    {/* Добавляйте ваши подборки */}
                                    <div className="flex flex-col xl:flex-row gap-2">
                                        <CollectionCard href="ayfar" name="Медитация" size="xl" /> {/* href ссылка. name название */}
                                        <CollectionCard href="ansamble" name="Ансамбль" size="xl" /> {/* href ссылка. name название */}
                                    </div>

                                    <Link
                                        href="/collections"
                                        className="w-full flex flex-row gap-2 purple-text-hover"
                                    >
                                        Подборки
                                        <ChevronRight />
                                    </Link>
                                </div>
                            </div>

                            {/* 3. Fetch and display user's playlists if logged in */}
                            {isTokenExist && (
                                <div className="w-full h-full">
                                    <PlaylistList />
                                    <div className="w-full p-6 mt-4 glassmorphism rounded-xl">
                                        <Link
                                            href="/profile"
                                            className="w-full flex flex-row gap-2 purple-text-hover"
                                        >
                                            Показать все
                                            <ChevronRight />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* 4. Fetch and display user's liked songs if exist */}
                            {isTokenExist && (
                                <div className="w-full h-full">
                                    <GetLikedSongs title="Ваши любимые песни" limit={5} />
                                    <div className="w-full p-6 mt-4 glassmorphism rounded-xl">
                                        <Link
                                            href="/profile"
                                            className="w-full flex flex-row gap-2 purple-text-hover"
                                        >
                                            Показать все
                                            <ChevronRight />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </WavyBackground>
                </div>
            </div>
        </section>
    );
};

export default Page;