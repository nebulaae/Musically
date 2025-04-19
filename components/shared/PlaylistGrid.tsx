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
import { Skeleton } from '../ui/skeleton';

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
        return (
            <div className="flex flex-col items-start justify-center mt-1">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-full h-48 mt-4" />
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="flex items-center gap-2 purple-accent"
                >
                    <PlusCircle className="h-4 w-4" />
                    <span>Новый плейлист</span>
                </Button>
            </div>

            {playlists.length === 0 ? (
                <div className="text-center glassmorphism border-none rounded-xl py-8 px-2">
                    <p className="text-neutral-500 mb-4">У вас пока нет плейлистов.</p>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="purple-accent"
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
                            <Button type="submit" disabled={!newPlaylistName.trim()} className="purple-accent">
                                Создать
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};