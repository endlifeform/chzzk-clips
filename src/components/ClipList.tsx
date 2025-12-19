'use client';

import { useState, useEffect, useRef } from 'react';
import { getClipList } from '@/lib/chzzk-api';
import { useGroupStore } from '@/stores/groupStore';
import { usePlayerStore } from '@/stores/playerStore';
import { clipToGroupClip } from '@/lib/storage';
import type { Clip, Group } from '@/types';
import ClipCard from './ClipCard';

interface ClipListProps {
  channelId: string;
  channelName: string;
}

export default function ClipList({ channelId, channelName }: ClipListProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<{ clipUID: string; readCount?: number } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [orderType, setOrderType] = useState<'RECENT' | 'POPULAR'>('RECENT');
  const [showGroupModal, setShowGroupModal] = useState(false);

  // ref로 최신 값 추적 (클로저 문제 방지)
  const isLoadingRef = useRef(false);

  const { groups, addClipToGroup, createGroup } = useGroupStore();
  const { setPlaylist } = usePlayerStore();

  // 클립 목록 불러오기
  const loadClips = async (
    cursor: { clipUID: string; readCount?: number } | null,
    targetOrderType: 'RECENT' | 'POPULAR',
    reset: boolean
  ) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await getClipList(channelId, {
        cursor: cursor || undefined,
        size: 20,
        orderType: targetOrderType,
      });

      const newClips = response.data || [];

      if (reset) {
        setClips(newClips);
      } else {
        // 중복 제거
        setClips((prev) => {
          const existingIds = new Set(prev.map((c) => c.clipUID));
          const uniqueNewClips = newClips.filter((c) => !existingIds.has(c.clipUID));
          return [...prev, ...uniqueNewClips];
        });
      }

      // 다음 페이지 커서 설정
      setNextCursor(response.page.next);
      setHasMore(response.page.next !== null);
    } catch (error) {
      console.error('Failed to load clips:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  // 채널 변경 시 초기화 및 로드
  useEffect(() => {
    setClips([]);
    setNextCursor(null);
    setSelectedClips(new Set());
    setHasMore(true);
    setOrderType('RECENT');

    if (channelId) {
      loadClips(null, 'RECENT', true);
    }
  }, [channelId]);

  // 정렬 변경
  const handleOrderChange = (newOrder: 'RECENT' | 'POPULAR') => {
    if (newOrder !== orderType) {
      setOrderType(newOrder);
      setClips([]);
      setNextCursor(null);
      setHasMore(true);
      loadClips(null, newOrder, true);
    }
  };

  // 더 보기
  const handleLoadMore = () => {
    loadClips(nextCursor, orderType, false);
  };

  // 클립 선택 토글
  const toggleSelect = (clipUID: string) => {
    setSelectedClips((prev) => {
      const next = new Set(prev);
      if (next.has(clipUID)) {
        next.delete(clipUID);
      } else {
        next.add(clipUID);
      }
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedClips.size === clips.length) {
      setSelectedClips(new Set());
    } else {
      setSelectedClips(new Set(clips.map((c) => c.clipUID)));
    }
  };

  // 선택된 클립을 그룹에 추가
  const handleAddToGroup = async (group: Group) => {
    const selectedClipsList = clips.filter((c) => selectedClips.has(c.clipUID));

    for (const clip of selectedClipsList) {
      await addClipToGroup(group.id, clip, channelName);
    }

    setSelectedClips(new Set());
    setShowGroupModal(false);
  };

  // 클립 바로 재생
  const handlePlay = (clip: Clip) => {
    const groupClip = clipToGroupClip(clip, channelName);
    setPlaylist([groupClip], 0);
  };

  // 선택된 클립 모두 재생
  const handlePlaySelected = () => {
    const selectedClipsList = clips
      .filter((c) => selectedClips.has(c.clipUID))
      .map((c, i) => clipToGroupClip(c, channelName, i));

    if (selectedClipsList.length > 0) {
      setPlaylist(selectedClipsList, 0);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-white truncate">
          {channelName}의 클립
        </h2>

        {/* 정렬 */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => handleOrderChange('RECENT')}
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
              orderType === 'RECENT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => handleOrderChange('POPULAR')}
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${
              orderType === 'POPULAR'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            인기순
          </button>
        </div>
      </div>

      {/* 선택 액션 바 */}
      {clips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-800 rounded-lg">
          <button
            onClick={toggleSelectAll}
            className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors"
          >
            {selectedClips.size === clips.length ? '전체 해제' : '전체 선택'}
          </button>

          {selectedClips.size > 0 && (
            <>
              <span className="text-xs sm:text-sm text-gray-400">
                {selectedClips.size}개 선택
              </span>

              <button
                onClick={handlePlaySelected}
                className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors"
              >
                재생
              </button>

              <button
                onClick={() => setShowGroupModal(true)}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 transition-colors"
              >
                그룹 추가
              </button>
            </>
          )}
        </div>
      )}

      {/* 클립 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {clips.map((clip) => (
          <ClipCard
            key={clip.clipUID}
            clip={clip}
            isSelected={selectedClips.has(clip.clipUID)}
            onSelect={() => toggleSelect(clip.clipUID)}
            onPlay={() => handlePlay(clip)}
            onAddToGroup={() => {
              setSelectedClips(new Set([clip.clipUID]));
              setShowGroupModal(true);
            }}
          />
        ))}
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
        </div>
      )}

      {/* 더 보기 */}
      {!isLoading && hasMore && clips.length > 0 && (
        <button
          onClick={handleLoadMore}
          className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          더 보기
        </button>
      )}

      {/* 결과 없음 */}
      {!isLoading && clips.length === 0 && (
        <p className="text-center text-gray-400 py-8">클립이 없습니다.</p>
      )}

      {/* 그룹 선택 모달 */}
      {showGroupModal && (
        <GroupSelectModal
          groups={groups}
          onSelect={handleAddToGroup}
          onCreate={createGroup}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
}

// 그룹 선택 모달
function GroupSelectModal({
  groups,
  onSelect,
  onCreate,
  onClose,
}: {
  groups: Group[];
  onSelect: (group: Group) => void;
  onCreate: (title: string) => Promise<Group>;
  onClose: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const newGroup = await onCreate(newTitle.trim());
    onSelect(newGroup);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-white mb-4">그룹에 추가</h3>

        {/* 새 그룹 만들기 */}
        {isCreating ? (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewTitle('');
                }
              }}
              placeholder="그룹 이름"
              autoFocus
              className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              생성
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full p-3 mb-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            + 새 그룹 만들기
          </button>
        )}

        {/* 기존 그룹 목록 */}
        {groups.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelect(group)}
                className="w-full p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
              >
                <p className="font-medium text-white">{group.title}</p>
                <p className="text-sm text-gray-400">
                  {group.clips.length}개 클립
                </p>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
