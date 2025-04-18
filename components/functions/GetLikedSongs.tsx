"use client"

import { Track } from "@/db/models/tracks";
import { useState, useEffect } from "react";

export const GetLikedSongs = () => {
    const [likedTracks, setLikedTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState("");

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
                setLoading(false);
            }
        };

        getLikedSongs();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (likedTracks.length === 0) return <div>No liked songs found</div>;

    return (
        <section>
            <h2>Your Liked Songs</h2>
            <ul className="space-y-2 mt-4">
                {likedTracks.map(track => (
                    <li key={track.id} className="p-3 bg-secondary rounded-lg">
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm">By: {track.author}</div>
                        {track.album && <div className="text-sm">Album: {track.album}</div>}
                    </li>
                ))}
            </ul>
        </section>
    );
};