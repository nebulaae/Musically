import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { trackId } = await req.json();
        
        if (!trackId) {
            return NextResponse.json({ error: "Track ID is required" }, { status: 400 });
        }

        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/users/likes/${trackId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${tokenCookie.value}`
            }
        });

        if (!res.ok) {
            const data = await res.json();
            return NextResponse.json({ error: data.message }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error("Unlike track error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}