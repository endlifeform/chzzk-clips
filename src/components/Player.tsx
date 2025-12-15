'use client';

import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '@/stores/playerStore';
import { getClipDetail } from '@/lib/chzzk-api';

export default function Player() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const {
    playlist,
    currentIndex,
    currentVideoUrl,
    isPlaying,
    volume,
    isMuted,
    repeatMode,
    setCurrentVideoUrl,
    setIsPlaying,
    playNext,
  } = usePlayerStore();

  const currentClip = playlist[currentIndex];

  // 현재 클립의 HLS URL 가져오기
  useEffect(() => {
    if (!currentClip) return;

    const fetchVideoUrl = async () => {
      try {
        const detail = await getClipDetail(currentClip.videoNo);
        if (detail.videoUrl) {
          setCurrentVideoUrl(detail.videoUrl);
        }
      } catch (error) {
        console.error('Failed to fetch video URL:', error);
        // 에러 발생 시 다음 클립으로 이동
        playNext();
      }
    };

    if (!currentVideoUrl) {
      fetchVideoUrl();
    }
  }, [currentClip, currentVideoUrl, setCurrentVideoUrl, playNext]);

  // HLS 초기화 및 재생
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    // 기존 HLS 인스턴스 정리
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        startLevel: -1, // Auto quality
      });

      hlsRef.current = hls;

      hls.loadSource(currentVideoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          video.play().catch((e) => console.log('Autoplay blocked:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else {
            playNext();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari 네이티브 HLS 지원
      video.src = currentVideoUrl;
      if (isPlaying) {
        video.play().catch((e) => console.log('Autoplay blocked:', e));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentVideoUrl, isPlaying, playNext]);

  // 볼륨 및 음소거 처리
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  // 재생/일시정지 처리
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideoUrl) return;

    if (isPlaying) {
      video.play().catch((e) => console.log('Play blocked:', e));
    } else {
      video.pause();
    }
  }, [isPlaying, currentVideoUrl]);

  // 재생 종료 이벤트
  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch((e) => console.log('Repeat play blocked:', e));
      }
    } else {
      playNext();
    }
  }, [repeatMode, playNext]);

  // 재생 상태 동기화
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  if (!currentClip) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">재생할 클립을 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        poster={currentClip.thumbnailUrl}
      />
      {!currentVideoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
