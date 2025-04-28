"use client"

import { Button } from "@/components/ui/button";
import { PlaylistDrawer } from './PlaylistDrawer';
import { EllipsisVertical, LibraryBig } from 'lucide-react';

import { useState } from 'react';
import { useToken } from '@/app/providers/TokenProvider';

interface PlaylistProps {
  trackId: string;
  icon?: boolean
};

export const PlaylistActions = ({
  trackId,
  icon = true,
}: PlaylistProps) => {
  const { isTokenExist } = useToken();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
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

      <PlaylistDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trackId={trackId}
      />
    </>
  );
};