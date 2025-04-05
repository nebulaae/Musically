"use client"

import { useState, useEffect } from "react";
import { User } from "@/db/models/user.model";
import { Track } from "@/db/models/tracks.model";
import { getCurrentUser, getLikedSongs } from "@/db/actions/user.actions";

import { PlaylistGrid } from "@/components/shared/PlaylistGrid";

const Page = () => {
    const [user, setUser] = useState<User | null>(null);
    const [likedSongs, setLikedSongs] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                console.error('Error fetching liked songs:', err);
                setError(err instanceof Error ? err.message : 'Unknown error fetching liked songs');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLikedSongs();
    }, []);

    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Ваши плейлисты</h1>
                    </div>
                    {error && (<p></p>)}
                    <PlaylistGrid />
                </div>
            </div>
        </section>
    );
};

export default Page;