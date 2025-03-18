"use client"

import { useState, useEffect } from "react";
import { User } from "@/db/models/user.model";
import { Track } from "@/db/models/tracks.model";
import { getCurrentUser, getLikedSongs } from "@/db/actions/user.actions";

import { useAudio } from "@/components/player/AudioContext";
import { FetchTracks } from "@/components/shared/FetchTracks";
import { PlaylistPreview } from "@/components/shared/PlaylistPreview";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { PlaylistGrid } from "@/components/shared/PlaylistGrid";

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
                console.error('Error fetching liked songs:', err);
                setError(err instanceof Error ? err.message : 'Unknown error fetching liked songs');
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
                        <h1 className="title-text">Здраствуйте!</h1>
                    </div>
                    {/* TABS */}
                    <Tabs defaultValue="favorite">
                        <TabsList className="w-full">
                            <TabsTrigger value="favorite">Понравившееся</TabsTrigger>
                            <TabsTrigger value="playlists">Плейлисты</TabsTrigger>
                        </TabsList>
                        <TabsContent value="favorite">
                            <FetchTracks
                                tracks={likedSongs}
                                isLoading={isLoading}
                                error={error}
                                handleTrackSelect={handleTrackSelect}
                                layout="list"
                            />
                        </TabsContent>
                        <TabsContent value="playlists">
                            <PlaylistGrid />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    );
};

export default Page;

function getAllPlaylists() {
    throw new Error("Function not implemented.");
}
