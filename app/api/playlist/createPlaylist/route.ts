import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { playlistName } = body;

        if (!playlistName) {
            return NextResponse.json({ error: "Playlist name is required" }, { status: 400 });
        }

        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/playlists/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${tokenCookie.value}`
            },
            body: JSON.stringify({ name: playlistName }),
        });

        const data = await res.json();
        
        if (!res.ok) {
            return NextResponse.json({ error: data.message || "Failed to create playlist" }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Create playlist error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}