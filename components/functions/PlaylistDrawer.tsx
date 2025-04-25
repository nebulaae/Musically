'use client';

import { useState } from 'react';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useToken } from '@/app/providers/TokenProvider';

import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, CirclePlusIcon } from 'lucide-react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/ui/drawer";

interface PlaylistDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trackId: string;
}

const PlaylistDrawer = ({ open, onOpenChange, trackId }: PlaylistDrawerProps) => {
    const isTokenExist = useToken();
    const {
        playlists,
        isLoading,
        addToPlaylist,
        removeFromPlaylist,
        createNewPlaylist,
        isTrackInPlaylist
    } = usePlaylist(trackId);

    const [newPlaylistName, setNewPlaylistName] = useState('');

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        const newPlaylist = await createNewPlaylist(newPlaylistName);
        if (newPlaylist) {
            setNewPlaylistName('');
            toast.success('Плейлист успешно создан!');
            onOpenChange(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="glassmorphism px-4 py-6">
                <DrawerHeader>
                    <DrawerTitle>Добавить в плейлист</DrawerTitle>
                    <DrawerDescription className="text-gray-500">
                        Выберите плейлист или создайте новый.
                    </DrawerDescription>
                </DrawerHeader>

                {!isTokenExist ? (
                    <p className="text-sm text-muted-foreground py-4">
                        Для действий с плейлистом вам сначала нужно зарегистрироваться.
                    </p>
                ) : (
                    <>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
                            {isLoading ? (
                                <p className="text-sm text-muted-foreground">Загрузка плейлистов...</p>
                            ) : !Array.isArray(playlists) || playlists.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Плейлисты не найдены.</p>
                            ) : (
                                playlists.map((playlist) => {
                                    const isInPlaylist = isTrackInPlaylist(playlist.id);

                                    const handleToggleTrack = async () => {
                                        if (isInPlaylist) {
                                            await removeFromPlaylist(playlist.id);
                                            toast.success("Песня успешна добавлена в плейлист.")
                                        } else {
                                            await addToPlaylist(playlist.id);
                                        }
                                    };

                                    return (
                                        <Button
                                            key={playlist.id}
                                            variant={isInPlaylist ? 'default' : 'ghost'}
                                            className="w-full justify-between purple-text"
                                            onClick={handleToggleTrack}
                                        >
                                            <span>{playlist.name}</span>
                                            {isInPlaylist && <Check className="h-4 w-4 purple-text" />}
                                        </Button>
                                    );
                                })
                            )}
                        </div>

                        <div className="border-t mt-4 pt-4">
                            <h4 className="text-sm mb-2 flex items-center gap-2 font-medium">
                                <CirclePlusIcon className="size-4" /> Создать новый плейлист
                            </h4>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    placeholder="Название плейлиста"
                                    className="flex-1"
                                />
                                <Button
                                    disabled={!newPlaylistName.trim()}
                                    onClick={handleCreatePlaylist}
                                    className="purple-accent"
                                >
                                    Создать
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                <DrawerFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Закрыть
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default PlaylistDrawer;