'use client';

import { usePlayerStore } from '@/stores/playerStore';
import { useGroupStore } from '@/stores/groupStore';

// 시간 포맷팅
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Playlist() {
  const {
    playlist,
    currentIndex,
    setCurrentIndex,
    clearPlaylist,
  } = usePlayerStore();

  const { selectedGroupId, removeClipFromGroup } = useGroupStore();

  // 클립 삭제 (그룹에서 삭제)
  const handleRemove = async (clipId: string) => {
    if (selectedGroupId) {
      await removeClipFromGroup(selectedGroupId, clipId);
    }
  };

  if (playlist.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>재생 목록이 비어있습니다.</p>
        <p className="text-sm mt-2">
          채널에서 클립을 검색하거나<br />
          그룹을 선택하여 재생하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="font-medium text-white">
          재생 목록 ({playlist.length})
        </h3>
        <button
          onClick={clearPlaylist}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          전체 삭제
        </button>
      </div>

      {/* 클립 목록 */}
      <div className="flex-1 overflow-y-auto">
        {playlist.map((clip, index) => (
          <div
            key={clip.id}
            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
              index === currentIndex
                ? 'bg-blue-600/20'
                : 'hover:bg-gray-800'
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            {/* 인덱스 / 재생 아이콘 */}
            <div className="w-6 text-center flex-shrink-0">
              {index === currentIndex ? (
                <PlayingIcon />
              ) : (
                <span className="text-sm text-gray-400">{index + 1}</span>
              )}
            </div>

            {/* 썸네일 */}
            <div className="w-16 h-9 rounded overflow-hidden flex-shrink-0">
              <img
                src={clip.thumbnailUrl}
                alt={clip.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm truncate ${
                  index === currentIndex ? 'text-white font-medium' : 'text-gray-300'
                }`}
              >
                {clip.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {clip.channelName} · {formatDuration(clip.duration)}
              </p>
            </div>

            {/* 삭제 버튼 */}
            {selectedGroupId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(clip.id);
                }}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                title="목록에서 제거"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 총 재생시간 */}
      <div className="p-3 border-t border-gray-700 text-center text-sm text-gray-400">
        총 {formatTotalDuration(playlist.reduce((sum, c) => sum + c.duration, 0))}
      </div>
    </div>
  );
}

// 총 재생시간 포맷팅 (초 -> HH:MM:SS 또는 MM:SS)
function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${mins}분 ${secs}초`;
  }
  return `${mins}분 ${secs}초`;
}

function PlayingIcon() {
  return (
    <svg className="w-4 h-4 text-blue-400 mx-auto animate-pulse" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}
