import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // Call backend logout endpoint
        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/auth/logout`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${(await cookies()).get("token")?.value || ""}`
                }
            }
        );

        // Clear frontend cookie regardless of backend response
        (await cookies()).delete("token");

        return NextResponse.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        // Still clear cookie on error
        (await cookies()).delete("token");
        return NextResponse.json({ message: "Logged out successfully" });
    }
}