"use client"

import { useState, useEffect } from "react";
import { User } from "@/db/models/model.user";
import { Track } from "@/db/models/model.tracks";
import { getCurrentUser, getLikedSongs } from "@/db/actions/action.user";

import { useAudio } from "@/components/player/AudioContext";
import { FetchTracks } from "@/components/shared/FetchTracks";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";

const Page = () => {
    const [user, setUser] = useState<User | null>(null);
    const [likedSongs, setLikedSongs] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        playTrackAtIndex,
        isPlaying,
        togglePlayPause,
        currentTime,
        duration
    } = useAudio();

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
        <section className="flex flex-col w-full">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Здраствуйте, {user?.name}!</h1>
                    </div>
                    {/* TABS */}
                    <Tabs defaultValue="liked">
                        <TabsList className="w-full">
                            <TabsTrigger value="liked">Понравившееся</TabsTrigger>
                            <TabsTrigger value="playlists">Плейлисты</TabsTrigger>
                        </TabsList>
                        <TabsContent value="liked">
                            <FetchTracks
                                tracks={likedSongs}
                                isLoading={isLoading}
                                error={error}
                                handleTrackSelect={handleTrackSelect}
                                layout="list"
                            />
                        </TabsContent>
                        <TabsContent value="playlists">Плейлисты</TabsContent>
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
