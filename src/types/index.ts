// 치지직 API 응답 타입
export interface ChzzkApiResponse<T> {
  code: number;
  message: string | null;
  content: T;
}

// 채널 정보
export interface Channel {
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  verifiedMark: boolean;
  channelDescription: string | null;
  followerCount: number;
  openLive: boolean;
}

// 클립/비디오 정보
export interface Clip {
  videoNo: number;
  videoId: string;
  videoTitle: string;
  videoType: 'CLIP' | 'REPLAY';
  publishDate: string;
  thumbnailImageUrl: string;
  trailerUrl: string | null;
  duration: number;
  readCount: number;
  publishDateAt: number;
  categoryType: string | null;
  videoCategory: string | null;
  videoCategoryValue: string | null;
  channel: {
    channelId: string;
    channelName: string;
    channelImageUrl: string | null;
  };
}

// 클립 상세 정보 (HLS URL 포함)
export interface ClipDetail extends Clip {
  videoUrl: string;
  adult: boolean;
  clipActive: boolean;
  livePv: number;
  liveRewindPlaybackJson: string | null;
}

// 비디오 목록 응답
export interface VideoListResponse {
  size: number;
  page: {
    next: {
      concatContent: string | null;
    } | null;
  };
  data: Clip[];
}

// 그룹 (재생 목록)
export interface Group {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  clips: GroupClip[];
}

// 그룹에 저장된 클립 정보
export interface GroupClip {
  id: string;
  videoNo: number;
  title: string;
  thumbnailUrl: string;
  duration: number;
  channelName: string;
  channelId: string;
  orderIndex: number;
}

// 반복 모드
export type RepeatMode = 'none' | 'all' | 'one';

// 플레이어 상태
export interface PlayerState {
  playlist: GroupClip[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  currentVideoUrl: string | null;
}

// 채널 검색 결과
export interface ChannelSearchResult {
  channel: {
    channelId: string;
    channelName: string;
    channelImageUrl: string | null;
    verifiedMark: boolean;
  };
}

export interface ChannelSearchResponse {
  size: number;
  page: {
    next: {
      offset: number;
    } | null;
  };
  data: ChannelSearchResult[];
}
