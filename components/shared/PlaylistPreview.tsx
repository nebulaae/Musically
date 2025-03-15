"use client"

import Link from 'next/link';
import { useState } from 'react';
import { Music, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { Playlist } from '@/db/models/user.model';
import { usePlaylist } from '@/hooks/usePlaylist';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlaylistPreviewProps {
    playlist: Playlist;
    trackCount?: number;
}

export const PlaylistPreview = ({ playlist, trackCount }: PlaylistPreviewProps) => {
    const { removePlaylist, renamePlaylist, refreshPlaylists } = usePlaylist();
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState(playlist.name);

    // Generate a random gradient for each playlist
    const generateGradient = () => {
        const gradients = [
            'from-blue-600 to-purple-600',
            'from-green-600 to-teal-600',
            'from-purple-600 to-pink-600',
            'from-yellow-600 to-orange-600',
            'from-red-600 to-pink-600',
            'from-blue-600 to-cyan-600',
            'from-indigo-600 to-purple-600',
        ];

        // Use a hash of the playlist ID to ensure consistent colors for the same playlist
        const index = playlist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
        return gradients[index];
    };

    const handleDeletePlaylist = async () => {
        await removePlaylist(playlist.id);
        setIsDeleteDialogOpen(false);
    };

    const handleRenamePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();

        await renamePlaylist(playlist.id, newPlaylistName);

        setIsRenameDialogOpen(false);
        refreshPlaylists();
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        // Prevent click from triggering the Link navigation
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="relative group">
            <Link href={`/playlist/${playlist.id}`}>
                <div className={`relative w-full h-40 rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${generateGradient()}`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-70">
                        <Music className="w-20 h-20 text-white opacity-50" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg truncate">{playlist.name}</h3>
                        <p className="text-sm opacity-80">
                            {trackCount !== undefined
                                ? `${trackCount} ${trackCount === 1 ? 'Песня' : 'Песен'}`
                                : `${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'Песни' : 'Песен'}`}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Dropdown Menu */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleMenuClick}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/50 glassmorphism focus-visible:ring-0">
                            <EllipsisVertical className="h-5 w-5" />
                            <span className="sr-only">Действия с плейлистом</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white/60 glassmorphism">
                        <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                            <Pencil className="size-4 mr-1 text-black" />
                            <span>Переименовать</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500">
                            <Trash2 className="size-4 mr-1 text-red-500" />
                            <span>Удалить</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Переименовать</DialogTitle>
                        <DialogDescription>
                            Введите новое название плейлиста
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRenamePlaylist}>
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
                            <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={!newPlaylistName.trim()} className="bg-purple-200/50 text-purple-800 hover:bg-purple-300">
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Удалить плейлист?</DialogTitle>
                        <DialogDescription>
                            Вы уверены что хотите удалить "{playlist.name}"? Это действие необратимо.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="button" onClick={handleDeletePlaylist} className="bg-red-500 text-white hover:bg-red-700">
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};