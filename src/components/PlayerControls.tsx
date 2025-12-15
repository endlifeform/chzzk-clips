'use client';

import { usePlayerStore } from '@/stores/playerStore';

// 시간 포맷팅 (초 -> MM:SS)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerControls() {
  const {
    playlist,
    currentIndex,
    isPlaying,
    isShuffle,
    repeatMode,
    volume,
    isMuted,
    setIsPlaying,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  const currentClip = playlist[currentIndex];

  if (playlist.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* 현재 재생 중인 클립 정보 */}
      {currentClip && (
        <div className="mb-4">
          <h3 className="font-medium text-white truncate">{currentClip.title}</h3>
          <p className="text-sm text-gray-400">
            {currentClip.channelName} · {formatTime(currentClip.duration)}
          </p>
        </div>
      )}

      {/* 메인 컨트롤 */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {/* 셔플 */}
        <button
          onClick={toggleShuffle}
          className={`p-2 rounded-full transition-colors ${
            isShuffle
              ? 'text-blue-400 bg-blue-400/20'
              : 'text-gray-400 hover:text-white'
          }`}
          title="셔플 (S)"
        >
          <ShuffleIcon />
        </button>

        {/* 이전 */}
        <button
          onClick={playPrevious}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="이전 (P)"
        >
          <PreviousIcon />
        </button>

        {/* 재생/일시정지 */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
          title="재생/일시정지 (Space)"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* 다음 */}
        <button
          onClick={playNext}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="다음 (N)"
        >
          <NextIcon />
        </button>

        {/* 반복 */}
        <button
          onClick={toggleRepeat}
          className={`p-2 rounded-full transition-colors ${
            repeatMode !== 'none'
              ? 'text-blue-400 bg-blue-400/20'
              : 'text-gray-400 hover:text-white'
          }`}
          title="반복 (R)"
        >
          {repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
        </button>
      </div>

      {/* 볼륨 컨트롤 */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="음소거 (M)"
        >
          {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeIcon />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 accent-white"
        />
      </div>

      {/* 재생목록 위치 */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {currentIndex + 1} / {playlist.length}
      </div>
    </div>
  );
}

// 아이콘 컴포넌트들
function PlayIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PreviousIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  );
}

function RepeatOneIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function VolumeMuteIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  );
}
