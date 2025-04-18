import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { trackId: string } }
) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const trackId = params.trackId;
        const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_API}/api/users/likes/${trackId}`;

        const res = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${tokenCookie.value}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.message }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Unlike track error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}