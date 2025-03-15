"use client";

import Image from 'next/image';

import { use } from 'react';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Track } from '@/db/models/tracks.model';
import { Playlist } from '@/db/models/user.model';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useAudio } from '@/components/player/AudioContext';
import { FetchTracks } from '@/components/shared/FetchTracks';
import { Music, Play, PauseIcon, Calendar } from 'lucide-react';

interface PlaylistPageProps {
    params: Promise<{
        playlist: string;
    }>;
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
    // Unwrap params with React.use()
    const resolvedParams = use(params);
    const playlistId = resolvedParams.playlist;

    const { getPlaylistById } = usePlaylist();
    const [playlistData, setPlaylistData] = useState<{ playlist: Playlist; tracks: Track[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { playTrackAtIndex, isPlaying, togglePlayPause, currentTrackIndex, tracks: currentTracks } = useAudio();

    useEffect(() => {
        const fetchPlaylistData = async () => {
            try {
                setIsLoading(true);
                const data = await getPlaylistById(playlistId);
                setPlaylistData(data);
            } catch (error) {
                console.error('Error fetching playlist:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaylistData();
    }, [playlistId, getPlaylistById]);

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

    // Generate a random gradient for the playlist header
    const generateGradient = () => {
        if (!playlistData) return 'from-blue-300 to-purple-300';

        const gradients: string[] = [
            'from-purple-300 to-pink-300', // Purple to Pink
            'from-rose-300 to-fuchsia-300', // Rose to Fuchsia
            'from-pink-300 to-purple-300', // Pink to Purple
            'from-fuchsia-300 to-rose-300', // Fuchsia to Rose
            'from-indigo-300 to-purple-300',
        ];

        // Use a hash of the playlist ID to ensure consistent colors
        const index = playlistData.playlist.id
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;

        return gradients[index];
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
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center h-64">
                    <p className="text-lg">Загрузка плейлистов...</p>
                </div>
            </div>
        );
    }

    if (!playlistData) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center h-64">
                    <p className="text-lg">Плейлисты не найдены</p>
                </div>
            </div>
        );
    }

    const { playlist, tracks } = playlistData;
    const coverImage = tracks.length > 0 && tracks[0].cover ? tracks[0].cover : '/default-cover.jpg';
    const playlistCreatedAt = new Date(playlist.createdAt);
    const formattedDate = formatDistanceToNow(playlistCreatedAt, { addSuffix: true });

    return (
        <div className="flex flex-col w-full min-h-screen">
            {/* Playlist Header */}
            <div className={`bg-gradient-to-b ${generateGradient()} p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 text-white`}>
                <div className="w-40 h-40 md:w-48 md:h-48 bg-neutral-800 shadow-lg rounded-lg overflow-hidden flex-shrink-0">
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
                    <div className="flex items-center gap-2 text-sm opacity-80">
                        <p>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</p>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Создано {formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Playlist Controls */}
            <div className="py-4 px-6 md:px-8 flex items-start gap-4">
                <Button
                    onClick={handlePlayPauseClick}
                    className={`rounded-full size-18 flex items-center justify-center ${isPlaylistPlaying() ? 'bg-purple-300' : 'bg-purple-300'} hover:bg-purple-400 text-white`}
                    disabled={tracks.length === 0}
                >
                    {isPlaylistPlaying() ? (
                        <PauseIcon className="size-8 fill-purple-800 text-purple-800" strokeWidth={1} />
                    ) : (
                        <Play className="size-8 fill-purple-800 text-purple-800" strokeWidth={1} />
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
                    <div className="text-center py-8 bg-neutral-100 rounded-xl p-8">
                        <p className="text-neutral-500 mb-4">Этот плейлист пустой.</p>
                        <p className="text-sm text-neutral-400">Добавьте песни через три точки и нажмите в "Добавить в плейлист".</p>
                    </div>
                )}
            </div>
        </div>
    );
}