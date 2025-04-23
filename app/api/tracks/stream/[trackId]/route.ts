import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;

    if (!trackId) {
      return new NextResponse('Track ID is required', { status: 400 });
    }

    // Get the Range header from the incoming request
    const rangeHeader = req.headers.get('range');

    // Fetch from the backend with appropriate headers
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/tracks/stream/${trackId}`, {
      method: 'GET',
      headers: {
        ...(rangeHeader && { 'Range': rangeHeader }),
        'Accept': 'audio/*',  // Accept any audio content
      },
      cache: 'no-store',
    });

    // Check if the backend responded successfully
    if (!response.ok) {
      const errorStatus = response.status;
      const errorBody = await response.text().catch(() => 'Could not read backend error body');
      console.error(`[Proxy Error] Backend stream error: ${errorStatus} ${response.statusText}. Body: ${errorBody}`);

      return new NextResponse(errorBody || `Backend Error: ${errorStatus}`, {
        status: errorStatus,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Get the readable stream from the backend response body
    const backendStream = response.body;

    if (!backendStream) {
      console.error(`[Proxy Error] Backend response body stream is null for track ${trackId}`);
      return new NextResponse('Backend response body stream is null', { status: 500 });
    }

    // Create headers for the response
    const responseHeaders = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=86400',
    });

    // Pass through content headers
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    console.log(`[Proxy Response] Status: ${response.status}, Content-Type: ${responseHeaders.get('Content-Type')}, Range: ${contentRange || 'N/A'}, Length: ${contentLength || 'N/A'}`);

    // Return the response with the stream
    return new NextResponse(backendStream, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`[Proxy Error] Error proxying track stream:`, error);
    return new NextResponse('Internal server error while proxying track stream', { status: 500 });
  }
}

// Improved CORS handling
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
      'Access-Control-Max-Age': '86400', // Cache CORS preflight for 24 hours
    },
  });
}