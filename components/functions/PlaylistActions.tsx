"use client"

import { Button } from "@/components/ui/button";
import { PlaylistDrawer } from './PlaylistDrawer';
import { EllipsisVertical, LibraryBig, Trash2 } from 'lucide-react';

import { useState } from 'react';
import { usePlaylist } from "@/hooks/usePlaylist";
import { useToken } from '@/app/providers/TokenProvider';
import { usePathname } from "next/navigation";

interface PlaylistProps {
  trackId: string;
  icon?: boolean;
};

export const PlaylistActions = ({
  trackId,
  icon = true,
}: PlaylistProps) => {
  const { isTokenExist } = useToken();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Extract playlist ID from path, assuming it's something like /playlist/123
  const playlistIdMatch = pathname?.match(/playlist\/([^\/]+)/);
  const playlistId = playlistIdMatch?.[1];

  const { removeFromPlaylist } = usePlaylist(trackId);

  const handleRemove = async () => {
    if (!playlistId) return;
    await removeFromPlaylist(playlistId);
    window.location.reload();
  };

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <Button
          variant="ghost"
          size={icon ? "icon" : "default"}
          className={icon ? "rounded-full focus-visible:ring-0" : ""}
          onClick={() => setDrawerOpen(true)}
          disabled={!isTokenExist}
        >
          {icon ? (
            <EllipsisVertical className="h-6 w-6" />
          ) : (
            <span className="flex flex-row items-start gap-4">
              Добавить в плейлист
              <LibraryBig />
            </span>
          )}
          <span className="sr-only">Добавить в плейлист</span>
        </Button>


        {playlistId ? (
          <Button
            variant="ghost"
            size={icon ? "icon" : "default"}
            className={icon ? "rounded-full focus-visible:ring-0 text-red-500 bg-none hover:text-red-700" : "text-red-500 bg-none hover:text-red-700"}
            onClick={handleRemove}
            disabled={!isTokenExist}
          >
            <span>Удалить из плейлиста</span>
            <Trash2 className="h-6 w-6" />
            <span className="sr-only">Удалить из плейлиста</span>
          </Button>
        ) : (
          <></>
        )}
      </div>

      <PlaylistDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trackId={trackId}
      />
    </>
  );
};
