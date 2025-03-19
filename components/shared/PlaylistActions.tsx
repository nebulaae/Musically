"use client"

import { useState } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';
import { Check, CirclePlusIcon, EllipsisVertical } from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface PlaylistProps {
  trackId: string;
}

export const PlaylistActions = ({ trackId }: PlaylistProps) => {
  const { playlists, isLoading, addToPlaylist, createNewPlaylist, isTrackInPlaylist } = usePlaylist(trackId);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist = await createNewPlaylist(newPlaylistName);

    if (newPlaylist) {
      setNewPlaylistName('');
      setDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full focus-visible:ring-0">
            <EllipsisVertical className="h-6 w-6" />
            <span className="sr-only">Добавить в плейлист</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white/60 glassmorphism">
          <span className="text-sm ml-2 mb-1">Добавить в плейлист:</span>
          {isLoading ? (
            <DropdownMenuItem disabled>Загрузка плейлистов...</DropdownMenuItem>
          ) : playlists.length === 0 ? (
            <DropdownMenuItem disabled>Плейлисты не найдены.</DropdownMenuItem>
          ) : (
            playlists.map((playlist) => (
              <DropdownMenuItem
                key={playlist.id}
                onClick={() => addToPlaylist(playlist.id)}
                className="flex items-center justify-between text-purple-800"
              >
                <span>{playlist.name}</span>
                {isTrackInPlaylist(playlist.id) && <Check className="h-4 w-4 ml-2 text-purple-800" />}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <CirclePlusIcon className="size-4 text-black" />
            Создать новый плейлист
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать новый плейлист</DialogTitle>
            <DialogDescription>
              Введите название вашему плейлисту. Вы можете добавить больше песен позже.
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={!newPlaylistName.trim()} className="bg-purple-200/50 text-purple-800 hover:bg-purple-300">
                Создать
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};