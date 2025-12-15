'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortType, setSortType] = useState<'LATEST' | 'POPULAR'>('LATEST');
  const [showGroupModal, setShowGroupModal] = useState(false);

  const { groups, addClipToGroup } = useGroupStore();
  const { setPlaylist } = usePlayerStore();

  // 클립 목록 불러오기
  const loadClips = useCallback(
    async (reset = false) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const currentPage = reset ? 0 : page;
        const response = await getClipList(channelId, {
          page: currentPage,
          size: 20,
          sortType,
        });

        const newClips = response.data || [];

        if (reset) {
          setClips(newClips);
          setPage(0);
        } else {
          setClips((prev) => [...prev, ...newClips]);
        }

        setHasMore(newClips.length === 20);
        if (!reset) setPage((p) => p + 1);
      } catch (error) {
        console.error('Failed to load clips:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [channelId, page, sortType, isLoading]
  );

  // 채널 변경 시 초기화
  useEffect(() => {
    setClips([]);
    setPage(0);
    setSelectedClips(new Set());
    setHasMore(true);
  }, [channelId]);

  // 초기 로드
  useEffect(() => {
    if (channelId && clips.length === 0) {
      loadClips(true);
    }
  }, [channelId, sortType]);

  // 정렬 변경
  const handleSortChange = (newSort: 'LATEST' | 'POPULAR') => {
    if (newSort !== sortType) {
      setSortType(newSort);
      setClips([]);
      setPage(0);
      setHasMore(true);
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {channelName}의 클립
        </h2>

        {/* 정렬 */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSortChange('LATEST')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortType === 'LATEST'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => handleSortChange('POPULAR')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortType === 'POPULAR'
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
        <div className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
          <button
            onClick={toggleSelectAll}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            {selectedClips.size === clips.length ? '전체 해제' : '전체 선택'}
          </button>

          {selectedClips.size > 0 && (
            <>
              <span className="text-sm text-gray-400">
                {selectedClips.size}개 선택됨
              </span>

              <button
                onClick={handlePlaySelected}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                선택 재생
              </button>

              <button
                onClick={() => setShowGroupModal(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                그룹에 추가
              </button>
            </>
          )}
        </div>
      )}

      {/* 클립 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          onClick={() => loadClips(false)}
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
  onClose,
}: {
  groups: Group[];
  onSelect: (group: Group) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-white mb-4">그룹에 추가</h3>

        {groups.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            생성된 그룹이 없습니다. 먼저 그룹을 만들어주세요.
          </p>
        ) : (
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
