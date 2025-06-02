"use client"

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Music, PauseIcon, Play } from "lucide-react";

import { useState, useEffect } from "react";
import { useTracks } from "@/hooks/useTracks";
import { useAudio } from "@/components/player/AudioContext";
import { getProxiedImageUrl, pluralize } from "@/lib/utils";
import { FetchTracks } from "@/components/functions/FetchTracks";

const Page = () => {
    const [gradient, setGradient] = useState<string>("");
    const { playTrackAtIndex, isPlaying, togglePlayPause, currentTrackIndex, tracks: currentTracks } = useAudio();

    useEffect(() => {
        // Generate a random gradient for each playlist
        const gradient = [
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

        const index = Math.floor(Math.random() * gradient.length);
        setGradient(gradient[index]);
    }, []);


    // НАЧАЛО
    const someCollection = useTracks(({
        trackNames: ["6e845139983cb5b131542dc028af8303", '89e15d83498a252730be17161fe3b4e1'], // it should render the selected track
        page: 1,
        limit: 10
    }));

    const tracks = someCollection.tracks;

    // КОНЕЦ
    const coverImage = getProxiedImageUrl(tracks?.length > 0 && tracks[0]?.cover ? tracks[0]?.cover : '/default-cover.jpg');

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
        <div className="flex flex-col w-full min-h-screen pb-42 bg-main relative">
            {/* Spotify-like gradient background overlay */}
            <div className={`absolute top-0 left-0 right-0 h-96 backdrop-blur-xl ${gradient} opacity-40 z-0`} />

            {/* Header content with transparent bottom */}
            <div className="relative z-10 pt-6 md:pt-8 px-6 md:px-8">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-white">
                    <div className="w-40 h-40 md:w-48 md:h-48 bg-neutral-800 shadow-lg rounded-md overflow-hidden flex-shrink-0">
                        {tracks.length > 0 ? (
                            <Image
                                src={coverImage}
                                width={192}
                                height={192}
                                alt={tracks[0].title}
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
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">Название плейлиста</h1>
                        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm opacity-80">
                            <p className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                {someCollection.tracks.length !== undefined ?
                                    `${tracks.length} ${pluralize(tracks.length, ['Песня', 'Песни', 'Песен'])}`
                                    : ''
                                }

                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transparent gradient transition to content */}
            <div className="relative z-10 bg-gradient-to-b backdrop-blur-xl bg-opacity-50 from-transparent to-neutral-50 dark:to-neutral-800 h-24 mt-6" />

            {/* Кнопка паузы и проигрывания */}
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
            </div>
            {/* Конец */}


            <div className="relative z-10 bg-main">
                {/* Tracks List */}
                <div className="px-6 md:px-8 pb-6">
                    {tracks.length > 0 ? (
                        <FetchTracks
                            tracks={someCollection.tracks}
                            isLoading={someCollection.isLoading}
                            error={someCollection.error}
                            handleTrackSelect={someCollection.handleTrackSelect}
                            layout="list"
                            variant="flex"
                            totalPages={someCollection.totalPages}
                            currentPage={someCollection.currentPage}
                            goToPage={someCollection.goToPage}
                        />
                    ) : (
                        <div className="text-center py-8 backdrop-blur-md bg-opacity-20 bg-neutral-800 rounded-xl p-8">
                            <p className="text-neutral-300 mb-4">Этот плейлист пустой.</p>
                            <p className="text-sm text-neutral-400">Добавьте песни через сердечко или круглый плюс, и нажмите в "Добавить в плейлист".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;