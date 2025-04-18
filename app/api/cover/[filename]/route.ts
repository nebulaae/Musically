import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const { filename } = await params;

        // Fetch the image from the backend
        const response = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/covers/${filename}`, {
            method: "GET",
            cache: "force-cache", // Cache the image data
            next: {
                revalidate: 3600 // Revalidate cache after 1 hour
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch image: ${response.status}`);
            // Return default image on error
            return NextResponse.redirect(new URL("/default-cover.jpg", req.url));
        }

        // Get the image data
        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/jpeg";

        // Return the image with appropriate headers
        return new NextResponse(imageData, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400" // Cache for 24 hours
            }
        });
    } catch (error) {
        console.error("Error fetching cover image:", error);
        // Return default image on error
        return NextResponse.redirect(new URL("/default-cover.jpg", req.url));
    }
}