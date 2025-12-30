export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

const CHZZK_API_BASE = 'https://api.chzzk.naver.com';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  let targetUrl = '';

  try {
    const { path } = await context.params;
    const pathString = path.join('/');
    const query = request.nextUrl.search;
    targetUrl = `${CHZZK_API_BASE}/${pathString}${query}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response', text: text.substring(0, 500), targetUrl },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : 'Unknown';
    return NextResponse.json(
      { error: 'Proxy error', name, message, targetUrl },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
