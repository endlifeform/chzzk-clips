'use client';

import { create } from 'zustand';
import type { GroupClip, RepeatMode } from '@/types';

interface PlayerState {
  // 상태
  playlist: GroupClip[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  currentVideoUrl: string | null;
  shuffledIndices: number[];

  // 액션
  setPlaylist: (clips: GroupClip[], startIndex?: number) => void;
  setCurrentIndex: (index: number) => void;
  setCurrentVideoUrl: (url: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  clearPlaylist: () => void;
}

// Fisher-Yates 셔플 알고리즘
function shuffleArray(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);

  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // 현재 인덱스를 맨 앞으로 이동
  const currentPos = indices.indexOf(currentIndex);
  if (currentPos > 0) {
    [indices[0], indices[currentPos]] = [indices[currentPos], indices[0]];
  }

  return indices;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // 초기 상태
  playlist: [],
  currentIndex: 0,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'none',
  volume: 1,
  isMuted: false,
  currentVideoUrl: null,
  shuffledIndices: [],

  // 액션
  setPlaylist: (clips, startIndex = 0) => {
    const shuffledIndices = shuffleArray(clips.length, startIndex);
    set({
      playlist: clips,
      currentIndex: startIndex,
      currentVideoUrl: null,
      shuffledIndices,
    });
  },

  setCurrentIndex: (index) => {
    set({ currentIndex: index, currentVideoUrl: null });
  },

  setCurrentVideoUrl: (url) => {
    set({ currentVideoUrl: url });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  playNext: () => {
    const { playlist, currentIndex, isShuffle, repeatMode, shuffledIndices } =
      get();
    if (playlist.length === 0) return;

    // 단일 반복 모드
    if (repeatMode === 'one') {
      set({ currentVideoUrl: null }); // 다시 로드를 위해 URL 초기화
      return;
    }

    let nextIndex: number;

    if (isShuffle) {
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      const nextShufflePos = currentShufflePos + 1;

      if (nextShufflePos >= shuffledIndices.length) {
        if (repeatMode === 'all') {
          // 전체 반복: 셔플 다시 시작
          const newShuffled = shuffleArray(playlist.length, shuffledIndices[0]);
          set({ shuffledIndices: newShuffled });
          nextIndex = newShuffled[0];
        } else {
          // 반복 없음: 정지
          set({ isPlaying: false });
          return;
        }
      } else {
        nextIndex = shuffledIndices[nextShufflePos];
      }
    } else {
      nextIndex = currentIndex + 1;

      if (nextIndex >= playlist.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    set({ currentIndex: nextIndex, currentVideoUrl: null });
  },

  playPrevious: () => {
    const { playlist, currentIndex, isShuffle, repeatMode, shuffledIndices } =
      get();
    if (playlist.length === 0) return;

    let prevIndex: number;

    if (isShuffle) {
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      const prevShufflePos = currentShufflePos - 1;

      if (prevShufflePos < 0) {
        if (repeatMode === 'all') {
          prevIndex = shuffledIndices[shuffledIndices.length - 1];
        } else {
          prevIndex = shuffledIndices[0];
        }
      } else {
        prevIndex = shuffledIndices[prevShufflePos];
      }
    } else {
      prevIndex = currentIndex - 1;

      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = playlist.length - 1;
        } else {
          prevIndex = 0;
        }
      }
    }

    set({ currentIndex: prevIndex, currentVideoUrl: null });
  },

  toggleShuffle: () => {
    const { isShuffle, playlist, currentIndex } = get();
    if (!isShuffle) {
      // 셔플 켜기
      const shuffledIndices = shuffleArray(playlist.length, currentIndex);
      set({ isShuffle: true, shuffledIndices });
    } else {
      // 셔플 끄기
      set({ isShuffle: false });
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  clearPlaylist: () => {
    set({
      playlist: [],
      currentIndex: 0,
      currentVideoUrl: null,
      isPlaying: false,
      shuffledIndices: [],
    });
  },
}));
