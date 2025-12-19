'use client';

import { useState, useEffect } from 'react';
import { useGroupStore } from '@/stores/groupStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { decodeSharedGroup } from '@/lib/storage';
import ChannelSearch from '@/components/ChannelSearch';
import ClipList from '@/components/ClipList';
import GroupManager from '@/components/GroupManager';
import GroupList from '@/components/GroupList';
import Player from '@/components/Player';
import PlayerControls from '@/components/PlayerControls';
import Playlist from '@/components/Playlist';
import type { Group } from '@/types';

type MainTab = 'search' | 'player';
type MobileTab = 'search' | 'groups' | 'player';

export default function Home() {
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>('search');
  const [mobileTab, setMobileTab] = useState<MobileTab>('search');
  const [sharedGroup, setSharedGroup] = useState<Group | null>(null);

  const { loadGroups, groups, selectedGroupId, selectGroup, importGroup } = useGroupStore();
  const { playlist, currentIndex } = usePlayerStore();
  const { setPlaylist } = usePlayerStore();

  // 키보드 단축키 활성화
  useKeyboardShortcuts();

  // 그룹 데이터 로드
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 공유 URL 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');

    if (shareData) {
      const decoded = decodeSharedGroup(shareData);
      if (decoded) {
        setSharedGroup(decoded);
      }
      // URL에서 share 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 공유 그룹 가져오기
  const handleImportGroup = async () => {
    if (sharedGroup) {
      await importGroup(sharedGroup);
      setSharedGroup(null);
      setMobileTab('groups');
    }
  };

  // 채널 선택 시 그룹 선택 해제
  const handleSelectChannel = (channelId: string, channelName: string) => {
    setSelectedChannel({ id: channelId, name: channelName });
    selectGroup(null);
  };

  // 그룹 선택 시 채널 선택 해제 및 검색 탭으로 이동
  useEffect(() => {
    if (selectedGroupId) {
      setSelectedChannel(null);
      setMobileTab('search');
      setMainTab('search');
    }
  }, [selectedGroupId]);

  // 재생 시작 시 플레이어 탭으로 자동 전환
  const handlePlay = (clips: GroupClip[], startIndex: number) => {
    setPlaylist(clips, startIndex);
    setMainTab('player');
    setMobileTab('player');
  };

  // playlist가 변경되면 (ClipList에서 재생 시) 플레이어 탭으로 전환
  useEffect(() => {
    if (playlist.length > 0) {
      setMainTab('player');
      setMobileTab('player');
    }
  }, [playlist]);

  // 선택된 그룹 가져오기
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const currentClip = playlist[currentIndex];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 왼쪽 사이드바 - 그룹 관리 (데스크톱만) */}
      <aside className="hidden lg:flex w-72 bg-gray-800 border-r border-gray-700 flex-col">
        {/* 로고 */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">클립 플레이어</h1>
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
        {/* 모바일 헤더 */}
        <div className="lg:hidden p-3 border-b border-gray-700 bg-gray-800">
          <h1 className="text-lg font-bold text-white text-center">클립 플레이어</h1>
        </div>

        {/* 모바일: 탭별 콘텐츠 */}
        <div className="flex-1 flex flex-col overflow-hidden lg:hidden pb-16">
          {/* 검색 탭 */}
          {mobileTab === 'search' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <ChannelSearch onSelectChannel={handleSelectChannel} />
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {selectedChannel ? (
                  <ClipList
                    channelId={selectedChannel.id}
                    channelName={selectedChannel.name}
                  />
                ) : selectedGroup ? (
                  <SelectedGroupView group={selectedGroup} onPlay={handlePlay} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <SearchIcon className="w-12 h-12 mb-3 opacity-50" />
                    <p>채널을 검색하거나</p>
                    <p>그룹을 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 그룹 탭 */}
          {mobileTab === 'groups' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <GroupManager />
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <h2 className="text-sm font-medium text-gray-400 mb-3">내 그룹</h2>
                <GroupList />
              </div>
            </div>
          )}

          {/* 플레이어 탭 */}
          {mobileTab === 'player' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <Player />
              </div>
              <div className="p-3 border-b border-gray-700">
                <PlayerControls />
              </div>
              <div className="flex-1 overflow-hidden">
                <Playlist />
              </div>
            </div>
          )}
        </div>

        {/* 데스크톱: 탭 기반 레이아웃 */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col overflow-hidden">
          {/* 상단 탭 네비게이션 */}
          <div className="flex items-center border-b border-gray-700 bg-gray-800">
            <button
              onClick={() => setMainTab('search')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                mainTab === 'search'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <SearchIcon className="w-5 h-5" />
                검색
              </span>
            </button>
            <button
              onClick={() => setMainTab('player')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                mainTab === 'player'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <PlayCircleIcon className="w-5 h-5" />
                플레이어
                {playlist.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-600 rounded-full">
                    {playlist.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* 검색 탭 콘텐츠 */}
          {mainTab === 'search' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 채널 검색 */}
              <div className="p-4 border-b border-gray-700">
                <ChannelSearch onSelectChannel={handleSelectChannel} />
              </div>

              {/* 클립 목록 */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedChannel ? (
                  <ClipList
                    channelId={selectedChannel.id}
                    channelName={selectedChannel.name}
                  />
                ) : selectedGroup ? (
                  <SelectedGroupView group={selectedGroup} onPlay={handlePlay} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <SearchIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">채널을 검색하거나</p>
                    <p className="text-lg">그룹을 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 플레이어 탭 콘텐츠 */}
          {mainTab === 'player' && (
            <div className="flex-1 flex overflow-hidden">
              {/* 플레이어 영역 */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* 큰 플레이어 */}
                <div className="max-w-4xl w-full mx-auto">
                  <Player />
                </div>
                {/* 플레이어 컨트롤 */}
                <div className="max-w-4xl w-full mx-auto mt-4">
                  <PlayerControls />
                </div>
              </div>

              {/* 재생목록 사이드 */}
              <div className="w-80 border-l border-gray-700 flex flex-col overflow-hidden">
                <Playlist />
              </div>
            </div>
          )}
        </div>

        {/* 모바일 미니 플레이어 (플레이어 탭이 아닐 때) */}
        {mobileTab !== 'player' && currentClip && (
          <div
            className="lg:hidden p-2 bg-gray-800 border-t border-gray-700 flex items-center gap-3 cursor-pointer"
            onClick={() => setMobileTab('player')}
          >
            <img
              src={currentClip.thumbnailUrl}
              alt={currentClip.title}
              className="w-12 h-8 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{currentClip.title}</p>
              <p className="text-xs text-gray-400 truncate">{currentClip.channelName}</p>
            </div>
            <MiniPlayButton />
          </div>
        )}

        {/* 모바일 하단 탭 네비게이션 */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex border-t border-gray-700 bg-gray-800 z-50">
          <button
            onClick={() => setMobileTab('search')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              mobileTab === 'search' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <SearchIcon className="w-5 h-5" />
            <span className="text-xs">검색</span>
          </button>
          <button
            onClick={() => setMobileTab('groups')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              mobileTab === 'groups' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <FolderIcon className="w-5 h-5" />
            <span className="text-xs">그룹</span>
          </button>
          <button
            onClick={() => setMobileTab('player')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              mobileTab === 'player' ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            <PlayCircleIcon className="w-5 h-5" />
            <span className="text-xs">플레이어</span>
          </button>
        </nav>
      </main>

      {/* 공유 그룹 가져오기 모달 */}
      {sharedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">공유된 그룹</h3>
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="font-medium text-white">{sharedGroup.title}</p>
              <p className="text-sm text-gray-400 mt-1">
                {sharedGroup.clips.length}개 클립
              </p>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              이 그룹을 내 그룹 목록에 추가하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSharedGroup(null)}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleImportGroup}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                가져오기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 미니 플레이어 재생 버튼
function MiniPlayButton() {
  const { isPlaying, setIsPlaying } = usePlayerStore();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsPlaying(!isPlaying);
      }}
      className="p-2 text-white"
    >
      {isPlaying ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}

// 선택된 그룹 표시 컴포넌트
interface GroupClip {
  id: string;
  clipUID: string;
  videoId: string;
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white truncate">{group.title}</h2>
        <button
          onClick={handlePlayAll}
          disabled={group.clips.length === 0}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
                  {formatDuration(clip.duration)}
                </span>
              </div>
              <div className="p-2 sm:p-3">
                <p className="text-xs sm:text-sm text-white truncate">{clip.title}</p>
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

// 아이콘들
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  );
}

function PlayCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </svg>
  );
}
