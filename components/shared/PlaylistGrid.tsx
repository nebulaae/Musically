"use client"

import { useState, useEffect } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';

import { PlusCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlaylistPreview } from '@/components/shared/PlaylistPreview';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export const PlaylistGrid = () => {
    const { playlists, isLoading, createNewPlaylist, refreshPlaylists } = usePlaylist();
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        refreshPlaylists();
    }, [refreshPlaylists]);

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPlaylistName.trim()) return;

        const newPlaylist = await createNewPlaylist(newPlaylistName);

        if (newPlaylist) {
            setNewPlaylistName('');
            setIsCreateDialogOpen(false);
            refreshPlaylists();
        }
    };

    if (isLoading) {
        return <div className="text-center py-8">Загрузка плейлистов...</div>;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Ваши плейлисты</h2>
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="flex items-center gap-2 bg-purple-200/50 text-purple-800 hover:bg-purple-300"
                >
                    <PlusCircle className="h-4 w-4" />
                    <span>Новый плейлист</span>
                </Button>
            </div>

            {playlists.length === 0 ? (
                <div className="text-center py-8 bg-neutral-100 rounded-xl p-8">
                    <p className="text-neutral-500 mb-4">У вас пока нет плейлистов.</p>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-purple-200/50 text-purple-800 hover:bg-purple-300"
                    >
                        Создайте свой первый плейлист
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {playlists.map((playlist) => (
                        <PlaylistPreview key={playlist.id} playlist={playlist} />
                    ))}
                </div>
            )}

            {/* Create Playlist Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Создать новый плейлист</DialogTitle>
                        <DialogDescription>
                            Введите название для плейлиста. Позже вы можете добавить в них песни
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePlaylist}>
                        <div className="py-4">
                            <Input
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                placeholder="Название плейлиста"
                                className="w-full"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={!newPlaylistName.trim()} className="bg-purple-200/50 text-purple-800 hover:bg-purple-300">
                                Создать
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};