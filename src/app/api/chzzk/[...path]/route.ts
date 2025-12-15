import { NextRequest, NextResponse } from 'next/server';

const CHZZK_API_BASE = 'https://api.chzzk.naver.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const query = request.nextUrl.search;
  const targetUrl = `${CHZZK_API_BASE}/${pathString}${query}`;

  const headers = new Headers();
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  headers.set('Referer', 'https://chzzk.naver.com/');
  headers.set('Origin', 'https://chzzk.naver.com');
  headers.set('Accept', 'application/json');
  headers.set('Accept-Language', 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7');

  // 클라이언트에서 전달받은 쿠키가 있다면 릴레이 (인증이 필요한 콘텐츠용)
  const clientCookies = request.headers.get('cookie');
  if (clientCookies) {
    headers.set('Cookie', clientCookies);
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Chzzk', code: 500 },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
