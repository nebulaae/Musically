import { getTracks } from '@/lib/tracks';
import { BottomPlayer } from '@/components/player/BottomPlayer';

export default async function Home() {
  const tracks = await getTracks();

  return (
    <main className="">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">My Music Player</h1>
        <p className="mb-4">Welcome to your simple music player.</p>
      </div>
      <BottomPlayer tracks={tracks} />
    </main>
  );
}