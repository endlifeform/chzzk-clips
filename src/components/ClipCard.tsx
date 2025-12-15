'use client';

import type { Clip } from '@/types';

interface ClipCardProps {
  clip: Clip;
  isSelected?: boolean;
  onSelect?: () => void;
  onAddToGroup?: () => void;
  onPlay?: () => void;
}

// 시간 포맷팅
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 조회수 포맷팅
function formatCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return count.toString();
}

export default function ClipCard({
  clip,
  isSelected,
  onSelect,
  onAddToGroup,
  onPlay,
}: ClipCardProps) {
  return (
    <div
      className={`group relative bg-gray-800 rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
      }`}
    >
      {/* 썸네일 */}
      <div className="relative aspect-video">
        <img
          src={clip.thumbnailImageUrl}
          alt={clip.videoTitle}
          className="w-full h-full object-cover"
        />

        {/* 재생시간 */}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
          {formatDuration(clip.duration)}
        </span>

        {/* 호버 시 오버레이 */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onPlay && (
            <button
              onClick={onPlay}
              className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
              title="재생"
            >
              <PlayIcon />
            </button>
          )}
          {onAddToGroup && (
            <button
              onClick={onAddToGroup}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="그룹에 추가"
            >
              <PlusIcon />
            </button>
          )}
        </div>

        {/* 선택 체크박스 */}
        {onSelect && (
          <button
            onClick={onSelect}
            className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'bg-black/40 border-white/60 hover:border-white'
            }`}
          >
            {isSelected && <CheckIcon />}
          </button>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3">
        <h3 className="font-medium text-white text-sm line-clamp-2 mb-1">
          {clip.videoTitle}
        </h3>
        <p className="text-gray-400 text-xs">
          조회수 {formatCount(clip.readCount)}회
        </p>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}
