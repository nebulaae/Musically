"use client"

import { useState } from 'react';
import { Heart, Plus, X } from 'lucide-react';
import { useMusicActions } from '@/hooks/useMusicActions';

interface TrackActionsProps {
    trackId: string;
}

export const TrackActions = ({ trackId }: TrackActionsProps) => {
    const { isLiked, playlists, toggleLike, addToPlaylist, createNewPlaylist } = useMusicActions(trackId);
    const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPlaylistName.trim()) return;

        const newPlaylist = await createNewPlaylist(newPlaylistName);

        if (newPlaylist) {
            setNewPlaylistName('');
            setIsCreatingPlaylist(false);
        }
    };

    return (
        <div className="flex items-center gap-2 relative">
            <button
                onClick={toggleLike}
                className={`p-2 rounded-full hover:bg-gray-100 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
                aria-label={isLiked ? 'Unlike' : 'Like'}
            >
                <Heart className={isLiked ? 'fill-current' : ''} />
            </button>

            <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                aria-label="Add to playlist"
            >
                <Plus />
            </button>

            {showPlaylistMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-lg rounded-md z-10 border border-gray-200">
                    <div className="flex justify-between items-center p-2 border-b">
                        <h3 className="font-medium">Add to playlist</h3>
                        <button
                            onClick={() => setShowPlaylistMenu(false)}
                            className="p-1 rounded-full hover:bg-gray-100"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {playlists.map(playlist => (
                            <button
                                key={playlist.id}
                                onClick={async () => {
                                    await addToPlaylist(playlist.id);
                                    setShowPlaylistMenu(false);
                                }}
                                className="w-full text-left p-2 hover:bg-gray-100"
                            >
                                {playlist.name}
                            </button>
                        ))}

                        {!isCreatingPlaylist ? (
                            <button
                                onClick={() => setIsCreatingPlaylist(true)}
                                className="w-full text-left p-2 hover:bg-gray-100 text-blue-600 font-medium"
                            >
                                Create new playlist
                            </button>
                        ) : (
                            <form onSubmit={handleCreatePlaylist} className="p-2">
                                <input
                                    type="text"
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    placeholder="Playlist name"
                                    className="w-full p-2 border rounded mb-2"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingPlaylist(false)}
                                        className="px-3 py-1 text-sm rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newPlaylistName.trim()}
                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}