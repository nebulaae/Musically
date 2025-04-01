"use client"

import { useState, useEffect } from "react";
import { User } from "@/db/models/user.model";
import { Track } from "@/db/models/tracks.model";
import { getCurrentUser, getLikedSongs } from "@/db/actions/user.actions";

import { useAudio } from "@/components/player/AudioContext";
import { FetchTracks } from "@/components/shared/FetchTracks";

const Page = () => {
    const [user, setUser] = useState<User | null>(null);
    const [likedSongs, setLikedSongs] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { playTrackAtIndex } = useAudio();

    useEffect(() => {
        const fetchLikedSongs = async () => {
            try {
                setIsLoading(true);
                const userData = await getCurrentUser();
                setUser(userData);

                setIsLoading(true);
                const songs = await getLikedSongs();
                setLikedSongs(songs);
            } catch (err) {
                console.error('Ошибка при загрузке понравившихся песен:', err);
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке понравившихся песен.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLikedSongs();
    }, []);

    const handleTrackSelect = (index: number) => {
        playTrackAtIndex(index, likedSongs);
    };

    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Понравившиеся песни</h1>
                    </div>
                    <FetchTracks
                        tracks={likedSongs}
                        isLoading={isLoading}
                        error={error}
                        handleTrackSelect={handleTrackSelect}
                        layout="list"
                    />
                </div>
            </div>
        </section>
    );
};

export default Page;