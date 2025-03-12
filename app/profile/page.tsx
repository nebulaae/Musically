"use client"

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Track } from '@/db/models/model.tracks';
import { User, Playlist } from '@/db/models/model.user';
import { useAudio } from '@/components/player/AudioContext';
import { 
    getCurrentUser, 
    getLikedSongs, 
    getAllPlaylists, 
    getPlaylistWithTracks 
} from '@/db/actions/action.user';

export const Page = () => {
const [user, setUser] = useState<User | null>(null);
    const [likedSongs, setLikedSongs] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { playTrack } = useAudio();

    useEffect(() => {
        async function loadUserData() {
            try {
                setIsLoading(true);
                const userData = await getCurrentUser();
                setUser(userData);

                const liked = await getLikedSongs();
                setLikedSongs(liked);

                const userPlaylists = await getAllPlaylists();
                setPlaylists(userPlaylists);
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadUserData();
    }, []);

    useEffect(() => {
        async function loadPlaylistTracks() {
            if (!selectedPlaylist) {
                setPlaylistTracks([]);
                return;
            }

            try {
                const result = await getPlaylistWithTracks(selectedPlaylist);
                if (result) {
                    setPlaylistTracks(result.tracks);
                }
            } catch (error) {
                console.error('Error loading playlist tracks:', error);
            }
        }

        loadPlaylistTracks();
    }, [selectedPlaylist]);

    const handlePlayTrack = (track: Track) => {
        const trackList = selectedPlaylist ? playlistTracks : likedSongs;
        playTrack(track, trackList);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>

            {user && (
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Hello, {user.name}</h2>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">Your Playlists</h3>

                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedPlaylist(null)}
                                className={`w-full text-left p-2 rounded-md hover:bg-gray-200 ${!selectedPlaylist ? 'bg-gray-200 font-medium' : ''}`}
                            >
                                Liked Songs ({likedSongs.length})
                            </button>

                            {playlists.map(playlist => (
                                <button
                                    key={playlist.id}
                                    onClick={() => setSelectedPlaylist(playlist.id)}
                                    className={`w-full text-left p-2 rounded-md hover:bg-gray-200 ${selectedPlaylist === playlist.id ? 'bg-gray-200 font-medium' : ''}`}
                                >
                                    {playlist.name} ({playlist.tracks.length})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            {selectedPlaylist
                                ? playlists.find(p => p.id === selectedPlaylist)?.name || 'Playlist'
                                : 'Liked Songs'}
                        </h3>

                        <div className="space-y-2">
                            {(selectedPlaylist ? playlistTracks : likedSongs).length === 0 ? (
                                <p className="text-gray-500 italic">
                                    {selectedPlaylist
                                        ? 'This playlist is empty. Add some tracks!'
                                        : 'You haven\'t liked any songs yet.'}
                                </p>
                            ) : (
                                (selectedPlaylist ? playlistTracks : likedSongs).map(track => (
                                    <div
                                        key={track.id}
                                        className="flex items-center p-2 hover:bg-gray-200 rounded-md cursor-pointer"
                                        onClick={() => handlePlayTrack(track)}
                                    >
                                        <div className="relative w-12 h-12 mr-3">
                                            <Image
                                                src={track.cover || '/default-cover.jpg'}
                                                alt={track.title}
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 rounded-md">
                                                <Play className="text-white w-6 h-6" />
                                            </div>
                                        </div>

                                        <div className="flex-grow">
                                            <div className="font-medium">{track.title}</div>
                                            <div className="text-sm text-gray-600">{track.author}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;