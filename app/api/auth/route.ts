import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8).max(50),
});

export async function POST(req: NextRequest) {
    const body = await req.json();

    const parse = registerSchema.safeParse(body);
    if (!parse.success) {
        return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    try {
        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/auth/register`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data }, { status: res.status });
        }

        // Set cookie (or token if backend returns it)
        (await
            // Set cookie (or token if backend returns it)
            cookies()).set("user", JSON.stringify({
            username: data.username,
            email: data.email,
        }), {
            httpOnly: true,
            path: "/",
        });

        return NextResponse.json({ message: "Registered successfully", user: data });
    } catch (err) {
        console.error("Registration error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
