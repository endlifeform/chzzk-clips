'use client';

import { useState, useEffect } from 'react';
import { useGroupStore } from '@/stores/groupStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ChannelSearch from '@/components/ChannelSearch';
import ClipList from '@/components/ClipList';
import GroupManager from '@/components/GroupManager';
import GroupList from '@/components/GroupList';
import Player from '@/components/Player';
import PlayerControls from '@/components/PlayerControls';
import Playlist from '@/components/Playlist';

export default function Home() {
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { loadGroups, groups, selectedGroupId, selectGroup } = useGroupStore();
  const { setPlaylist } = usePlayerStore();

  // 키보드 단축키 활성화
  useKeyboardShortcuts();

  // 그룹 데이터 로드
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 채널 선택 시 그룹 선택 해제
  const handleSelectChannel = (channelId: string, channelName: string) => {
    setSelectedChannel({ id: channelId, name: channelName });
    selectGroup(null);
  };

  // 그룹 선택 시 채널 선택 해제
  useEffect(() => {
    if (selectedGroupId) {
      setSelectedChannel(null);
    }
  }, [selectedGroupId]);

  // 선택된 그룹 가져오기
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 사이드바 - 그룹 관리 */}
      <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* 로고 */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">치지직 클립</h1>
          <p className="text-sm text-gray-400 mt-1">클립을 모아서 연속 재생</p>
        </div>

        {/* 그룹 생성 */}
        <div className="p-4 border-b border-gray-700">
          <GroupManager />
        </div>

        {/* 그룹 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-sm font-medium text-gray-400 mb-3">내 그룹</h2>
          <GroupList />
        </div>

        {/* 키보드 단축키 안내 */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          <p className="mb-1">단축키: Space 재생, N/P 이동</p>
          <p>S 셔플, R 반복, M 음소거</p>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 - 채널 검색 */}
        <div className="p-4 border-b border-gray-700">
          <ChannelSearch onSelectChannel={handleSelectChannel} />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 클립 목록 / 플레이어 영역 */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedChannel ? (
              <ClipList
                channelId={selectedChannel.id}
                channelName={selectedChannel.name}
              />
            ) : selectedGroup ? (
              <SelectedGroupView
                group={selectedGroup}
                onPlay={(clips, startIndex) => setPlaylist(clips, startIndex)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <SearchIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">채널을 검색하거나</p>
                <p className="text-lg">그룹을 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 오른쪽 사이드바 - 플레이어 & 재생목록 */}
      <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* 플레이어 */}
        <div className="p-4 border-b border-gray-700">
          <Player />
        </div>

        {/* 플레이어 컨트롤 */}
        <div className="p-4 border-b border-gray-700">
          <PlayerControls />
        </div>

        {/* 재생 목록 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Playlist />
        </div>
      </aside>
    </div>
  );
}

// 선택된 그룹 표시 컴포넌트
interface GroupClip {
  id: string;
  videoNo: number;
  title: string;
  thumbnailUrl: string;
  duration: number;
  channelName: string;
  channelId: string;
  orderIndex: number;
}

interface SelectedGroupViewProps {
  group: {
    id: string;
    title: string;
    clips: GroupClip[];
  };
  onPlay: (clips: GroupClip[], startIndex: number) => void;
}

function SelectedGroupView({ group, onPlay }: SelectedGroupViewProps) {
  const handlePlayAll = () => {
    if (group.clips.length > 0) {
      onPlay(group.clips, 0);
    }
  };

  return (
    <div className="space-y-4">
      {/* 그룹 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{group.title}</h2>
        <button
          onClick={handlePlayAll}
          disabled={group.clips.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          전체 재생
        </button>
      </div>

      {/* 클립 목록 */}
      {group.clips.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p>그룹에 클립이 없습니다.</p>
          <p className="text-sm mt-2">채널에서 클립을 검색하여 추가하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {group.clips.map((clip, index) => (
            <div
              key={clip.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer"
              onClick={() => onPlay(group.clips, index)}
            >
              <div className="relative aspect-video">
                <img
                  src={clip.thumbnailUrl}
                  alt={clip.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                  {formatDuration(clip.duration)}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm text-white truncate">{clip.title}</p>
                <p className="text-xs text-gray-400 truncate">
                  {clip.channelName}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 시간 포맷팅
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 검색 아이콘
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}
