import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Proxy to backend by_phone endpoint with all query params
    const url = `${API_BASE_URL}/api/appointments/by_phone/?${queryString}`;
    
    console.log('[API Proxy] GET /api/appointments/by_phone:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[API Proxy] Backend error:', response.status, response.statusText);
    }

    const data = await response.json();
    console.log('[API Proxy] Response:', { status: response.status, dataType: Array.isArray(data) ? 'array' : 'object', length: Array.isArray(data) ? data.length : '?' });
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments by phone' },
      { status: 500 }
    );
  }
}
