"use client"

import { FetchTracks } from "./FetchTracks";
import { useState, useEffect } from "react";
import { Track } from "@/server/models/track";
import { useAudio } from "../player/AudioContext";

export const GetLikedSongs = ({
    limit,
    title,
}: {
    limit?: number;
    title?: string;
}) => {
    const [likedTracks, setLikedTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState("");

    const { playTrackAtIndex } = useAudio();

    useEffect(() => {
        const getLikedSongs = async () => {
            try {
                const response = await fetch('/api/user/likedSongs/', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch liked songs');
                }

                const data = await response.json();
                setLikedTracks(data.tracks || []);
            } catch (err: any) {
                console.error('Error fetching liked songs:', err);
                setError(err.message || 'Failed to fetch liked songs');
            } finally {
                setIsLoading(false);
            }
        };

        getLikedSongs();
    }, []);

    const handleTrackSelect = (index: number) => {
        playTrackAtIndex(index, likedTracks);
    };

    return (
        <FetchTracks
            tracks={likedTracks}
            isLoading={isLoading}
            error={error}
            handleTrackSelect={handleTrackSelect}
            layout="list"
            likes={true}
            title={title}
            limit={limit}
        />
    );
};