import type {
  ChzzkApiResponse,
  Channel,
  ClipDetail,
  VideoListResponse,
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
 */
export async function getClipList(
  channelId: string,
  options: {
    page?: number;
    size?: number;
    sortType?: 'LATEST' | 'POPULAR';
  } = {}
): Promise<VideoListResponse> {
  const { page = 0, size = 20, sortType = 'LATEST' } = options;

  const params = new URLSearchParams({
    videoType: 'CLIP',
    pagingType: 'PAGE',
    page: page.toString(),
    size: size.toString(),
    sortType,
  });

  return fetchApi<VideoListResponse>(`/channels/${channelId}/videos?${params}`);
}

/**
 * 클립 상세 정보 조회 (HLS URL 포함)
 */
export async function getClipDetail(videoNo: number): Promise<ClipDetail> {
  return fetchApi<ClipDetail>(`/videos/${videoNo}`);
}

/**
 * 여러 클립의 상세 정보를 병렬로 조회
 */
export async function getClipDetails(
  videoNos: number[]
): Promise<(ClipDetail | null)[]> {
  const promises = videoNos.map(async (videoNo) => {
    try {
      return await getClipDetail(videoNo);
    } catch {
      console.error(`Failed to fetch clip ${videoNo}`);
      return null;
    }
  });

  return Promise.all(promises);
}

export { ChzzkApiError };
