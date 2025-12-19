import type {
  ChzzkApiResponse,
  Channel,
  ClipDetail,
  ClipListResponse,
  ChannelSearchResponse,
} from '@/types';

const API_BASE = '/api/chzzk/service/v1';

class ChzzkApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ChzzkApiError';
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);

  if (!response.ok) {
    throw new ChzzkApiError(response.status, `HTTP error: ${response.status}`);
  }

  const data: ChzzkApiResponse<T> = await response.json();

  if (data.code !== 200) {
    throw new ChzzkApiError(data.code, data.message || 'Unknown error');
  }

  return data.content;
}

/**
 * 채널 검색
 */
export async function searchChannels(
  keyword: string,
  size: number = 20,
  offset: number = 0
): Promise<ChannelSearchResponse> {
  const params = new URLSearchParams({
    keyword,
    size: size.toString(),
    offset: offset.toString(),
  });

  return fetchApi<ChannelSearchResponse>(`/search/channels?${params}`);
}

/**
 * 채널 정보 조회
 */
export async function getChannelInfo(channelId: string): Promise<Channel> {
  return fetchApi<Channel>(`/channels/${channelId}`);
}

/**
 * 채널의 클립 목록 조회
 * cursor: page.next 객체를 그대로 전달 (clipUID, readCount 포함)
 */
export async function getClipList(
  channelId: string,
  options: {
    cursor?: { clipUID: string; readCount?: number };
    size?: number;
    orderType?: 'RECENT' | 'POPULAR';
  } = {}
): Promise<ClipListResponse> {
  const { cursor, size = 20, orderType = 'RECENT' } = options;

  const params = new URLSearchParams({
    orderType,
    size: size.toString(),
  });

  if (cursor) {
    params.set('clipUID', cursor.clipUID);
    if (cursor.readCount !== undefined) {
      params.set('readCount', cursor.readCount.toString());
    }
  }

  return fetchApi<ClipListResponse>(`/channels/${channelId}/clips?${params}`);
}

/**
 * 클립 재생 정보 조회 (inKey 포함)
 */
interface ClipPlayInfo {
  contentType: string;
  contentId: string;
  videoId: string;
  inKey: string;
  contentTitle: string;
  adult: boolean;
}

async function getClipPlayInfo(clipUID: string): Promise<ClipPlayInfo> {
  const response = await fetch(`${API_BASE}/play-info/clip/${clipUID}`);

  if (!response.ok) {
    throw new ChzzkApiError(response.status, `HTTP error: ${response.status}`);
  }

  const data: ChzzkApiResponse<ClipPlayInfo> = await response.json();

  if (data.code !== 200) {
    throw new ChzzkApiError(data.code, data.message || 'Unknown error');
  }

  return data.content;
}

/**
 * 클립 상세 정보 조회 (재생 URL 포함)
 * clipUID를 사용하여 클립 재생 URL을 가져옵니다
 */
export async function getClipDetail(clipUID: string, videoId: string): Promise<ClipDetail> {
  try {
    // 1. 클립 재생 정보에서 inKey 가져오기
    const playInfo = await getClipPlayInfo(clipUID);

    // 2. neonplayer API로 재생 URL 가져오기
    const playbackUrl = `/api/neonplayer/vodplay/v2/playback/${playInfo.videoId}?key=${playInfo.inKey}`;
    const response = await fetch(playbackUrl);
    const data = await response.json();

    // DASH 응답에서 MP4 URL 추출
    if (data.period && data.period[0]?.adaptationSet) {
      const adaptationSet = data.period[0].adaptationSet;
      // 첫 번째 adaptationSet에서 가장 높은 품질의 representation 찾기
      for (const as of adaptationSet) {
        if (as.representation && as.representation.length > 0) {
          // 가장 높은 bandwidth (품질) 선택
          const bestRep = as.representation.reduce((best: { bandwidth?: number }, curr: { bandwidth?: number }) =>
            (curr.bandwidth || 0) > (best.bandwidth || 0) ? curr : best
          );

          if (bestRep.baseURL && bestRep.baseURL[0]?.value) {
            return {
              clipUID,
              videoId: playInfo.videoId,
              clipTitle: playInfo.contentTitle,
              thumbnailImageUrl: '',
              duration: 0,
              adult: playInfo.adult,
              videoUrl: bestRep.baseURL[0].value,
            };
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to get playback URL:', e);
  }

  throw new ChzzkApiError(404, 'Clip playback URL not found');
}

/**
 * 클립 재생 URL 직접 가져오기
 */
export async function getClipPlaybackUrl(clipUID: string): Promise<string | null> {
  try {
    // 1. 클립 재생 정보에서 inKey 가져오기
    const playInfo = await getClipPlayInfo(clipUID);

    // 2. neonplayer API로 재생 URL 가져오기
    const playbackUrl = `/api/neonplayer/vodplay/v2/playback/${playInfo.videoId}?key=${playInfo.inKey}`;
    const response = await fetch(playbackUrl);
    const data = await response.json();

    // DASH 응답에서 MP4 URL 추출
    if (data.period && data.period[0]?.adaptationSet) {
      const adaptationSet = data.period[0].adaptationSet;
      for (const as of adaptationSet) {
        if (as.representation && as.representation.length > 0) {
          const bestRep = as.representation.reduce((best: { bandwidth?: number }, curr: { bandwidth?: number }) =>
            (curr.bandwidth || 0) > (best.bandwidth || 0) ? curr : best
          );

          if (bestRep.baseURL && bestRep.baseURL[0]?.value) {
            return bestRep.baseURL[0].value;
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to get clip playback URL:', e);
  }

  return null;
}

export { ChzzkApiError };
