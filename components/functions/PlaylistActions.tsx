'use client'

import dynamic from 'next/dynamic';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from 'lucide-react';
import { useToken } from '@/app/providers/TokenProvider';

interface PlaylistProps {
  trackId: string;
  icon?: boolean
}

const DynamicPlaylistDrawer = dynamic(() => import('./PlaylistDrawer'), {
  loading: () => null,
  ssr: false,
});

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
        size="icon"
        className="rounded-full focus-visible:ring-0"
        onClick={() => setDrawerOpen(true)}
        disabled={!isTokenExist}
      >
        {icon ? (
          <EllipsisVertical className="h-6 w-6" />
        ) : (
          <span>Добавить в плейлист</span>
        )}
        <span className="sr-only">Добавить в плейлист</span>
      </Button>

      <DynamicPlaylistDrawer open={drawerOpen} onOpenChange={setDrawerOpen} trackId={trackId} />
    </>
  );
};