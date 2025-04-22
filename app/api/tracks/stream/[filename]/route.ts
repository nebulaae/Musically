// src/app/api/tracks/stream/[trackId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { trackId: string } } // Use trackId to match useTracks
) {
  try {
    const { trackId } = params; // Use trackId

    if (!trackId) {
      return new NextResponse('Track ID is required', { status: 400 });
    }

    // Get the Range header from the incoming request (client -> Next.js proxy)
    const rangeHeader = req.headers.get('range');

    console.log(`[Proxy Request] TrackID: ${trackId}, Range: ${rangeHeader || 'None'}`); // Optional logging

    // Fetch from the backend, forwarding the Range header
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/tracks/stream/${trackId}`, {
      method: 'GET',
      headers: {
        // Forward Range header if it exists
        ...(rangeHeader && { 'Range': rangeHeader }),
        // Add any other necessary headers (like auth tokens if needed)
        // Example: 'Authorization': req.headers.get('Authorization') || '',
      },
      // IMPORTANT: Disable Next.js caching for stream responses
      cache: 'no-store',
    });

    // Check if the backend responded successfully (e.g., 200 OK or 206 Partial Content)
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read backend error body');
      console.error(`[Proxy Error] Backend stream error for track ${trackId}: ${response.status} ${response.statusText}. Body: ${errorBody}`);
      return new NextResponse(errorBody || `Backend Error: ${response.status}`, {
        status: response.status,
        headers: { // Pass through CORS headers if needed, though often not required server-to-server
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Get the readable stream from the backend response body
    const backendStream = response.body;

    if (!backendStream) {
      console.error(`[Proxy Error] Backend response body stream is null for track ${trackId}`);
      return new NextResponse('Backend response body stream is null', { status: 500 });
    }

    // Create headers for the response (Next.js proxy -> client)
    // Pass through relevant headers from the backend response
    const responseHeaders = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg', // Default MIME type
      'Accept-Ranges': response.headers.get('Accept-Ranges') || 'bytes', // Crucial for seeking
      // Pass through CORS headers if your client needs them
      'Access-Control-Allow-Origin': '*', // Adjust as needed for security
    });

    // Conditionally pass through Content-Length and Content-Range
    // These are important for the client player to understand the stream/seek state
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    console.log(`[Proxy Response] Status: ${response.status}, Content-Type: ${responseHeaders.get('Content-Type')}, Content-Range: ${contentRange || 'N/A'}, Content-Length: ${contentLength || 'N/A'}`); // Optional logging

    // Return the response with the stream, using the status code from the backend (important for 206 Partial Content)
    return new NextResponse(backendStream, {
      status: response.status, // Use backend's status (e.g., 200 or 206)
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`[Proxy Error] Error proxying track stream for ${params.trackId}:`, error);
    return new NextResponse('Internal server error while proxying track stream', { status: 500 });
  }
}

// Optional: Add basic OPTIONS handler for CORS preflight if needed by the browser
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      'Access-Control-Allow-Origin': '*', // Match your desired origin
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Authorization', // Allow Range header
    },
  });
}