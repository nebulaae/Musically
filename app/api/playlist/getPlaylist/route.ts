import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const playlistId = searchParams.get('id');

        if (!playlistId) {
            return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
        }

        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/playlists/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${tokenCookie.value}`
            },
        });

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 404) {
                return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
            }
            return NextResponse.json({ error: data.message || "Failed to get playlist" }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Get playlist error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}