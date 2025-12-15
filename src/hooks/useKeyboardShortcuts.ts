'use client';

import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

export function useKeyboardShortcuts() {
  const {
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleMute,
    volume,
    setVolume,
  } = usePlayerStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space - 재생/일시정지
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case 'arrowleft': // ← - 5초 뒤로
          e.preventDefault();
          seekVideo(-5);
          break;

        case 'arrowright': // → - 5초 앞으로
          e.preventDefault();
          seekVideo(5);
          break;

        case 'n': // N - 다음 클립
          e.preventDefault();
          playNext();
          break;

        case 'p': // P - 이전 클립
          e.preventDefault();
          playPrevious();
          break;

        case 's': // S - 셔플 토글
          e.preventDefault();
          toggleShuffle();
          break;

        case 'r': // R - 반복 모드 전환
          e.preventDefault();
          toggleRepeat();
          break;

        case 'm': // M - 음소거 토글
          e.preventDefault();
          toggleMute();
          break;

        case 'f': // F - 전체화면 토글
          e.preventDefault();
          toggleFullscreen();
          break;

        case 'arrowup': // ↑ - 볼륨 증가
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;

        case 'arrowdown': // ↓ - 볼륨 감소
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
      }
    },
    [
      isPlaying,
      setIsPlaying,
      playNext,
      playPrevious,
      toggleShuffle,
      toggleRepeat,
      toggleMute,
      volume,
      setVolume,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 비디오 탐색
function seekVideo(seconds: number) {
  const video = document.querySelector('video');
  if (video) {
    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seconds)
    );
  }
}

// 전체화면 토글
function toggleFullscreen() {
  const video = document.querySelector('video');
  if (!video) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    video.requestFullscreen();
  }
}
