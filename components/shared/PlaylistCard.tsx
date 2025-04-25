"use client"

import Link from 'next/link';

import { useState } from 'react';
import { pluralize } from '@/lib/utils';
import { usePlaylist } from '@/hooks/usePlaylist';
import { Playlist } from '@/server/models/playlist';

import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlaylistCardProps {
    playlist: Playlist;
    trackCount?: number;
}

export const PlaylistCard = ({ playlist, trackCount }: PlaylistCardProps) => {
    const { renamePlaylist, removePlaylist, refreshPlaylists } = usePlaylist();
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState(playlist.name);

    const handleDeletePlaylist = async () => {
        await removePlaylist(playlist.id);
        toast.success("Плейлист был успешно удален.")
        setIsDeleteDialogOpen(false);
        refreshPlaylists();
        window.location.reload();
    };

    const handleRenamePlaylist = async () => {
        await renamePlaylist(playlist.id, newPlaylistName);
        toast.success("Плейлист был успешно переименован.")
        setIsRenameDialogOpen(false);
        refreshPlaylists();
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Generate a random gradient for each playlist
    const generateGradient = () => {
        const gradients = [
            'from-blue-500 to-purple-500',
            'from-green-500 to-teal-500',
            'from-purple-500 to-pink-500',
            'from-yellow-500 to-orange-500',
            'from-red-500 to-pink-500',
            'from-blue-500 to-cyan-500',
            'from-indigo-500 to-purple-500',
            'from-green-500 to-blue-500',
            'from-orange-500 to-red-500',
            'from-teal-500 to-green-500'
        ];

        // Use a hash of the playlist ID to ensure consistent colors for the same playlist
        const index = playlist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
        return gradients[index];
    };

    return (
        <div className="relative">
            <Link href={`/playlist/${playlist.id}`}>
                <div className={`relative w-full h-40 rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${generateGradient()}`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-70">
                        <Music className="w-20 h-20 text-white opacity-50" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg truncate">{playlist.name}</h3>
                        <p className="text-sm opacity-80">
                            {trackCount !== undefined ?
                                `${trackCount} ${pluralize(trackCount, ['Песня', 'Песни', 'Песен'])}`
                                : `${playlist.tracks.length} ${pluralize(playlist.tracks.length, ['Песня', 'Песни', 'Песен'])}`}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Dropdown Menu */}
            <div className="absolute top-2 right-2" onClick={handleMenuClick}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full bg-main focus-visible:ring-0 cursor-pointer">
                            <EllipsisVertical className="h-5 w-5" />
                            <span className="sr-only">Действия с плейлистом</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-main">
                        <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
                            <Pencil className="size-4 mr-1" />
                            <span>Переименовать</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="size-4 mr-1 text-red-500" />
                            <span className="text-red-500">Удалить</span>
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
                            <Button type="submit" disabled={!newPlaylistName.trim()} className="purple-button">
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