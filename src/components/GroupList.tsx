'use client';

import { useState } from 'react';
import { useGroupStore } from '@/stores/groupStore';
import { usePlayerStore } from '@/stores/playerStore';
import { encodeGroupForShare } from '@/lib/storage';
import type { Group } from '@/types';

export default function GroupList() {
  const {
    groups,
    selectedGroupId,
    selectGroup,
    deleteGroup,
    updateGroupTitle,
  } = useGroupStore();

  const { setPlaylist } = usePlayerStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 그룹 재생
  const handlePlay = (group: Group) => {
    if (group.clips.length === 0) return;
    setPlaylist(group.clips, 0);
  };

  // 그룹 삭제
  const handleDelete = async (id: string) => {
    if (confirm('정말 이 그룹을 삭제하시겠습니까?')) {
      await deleteGroup(id);
    }
  };

  // 편집 시작
  const startEdit = (group: Group) => {
    setEditingId(group.id);
    setEditTitle(group.title);
  };

  // 편집 저장
  const saveEdit = async () => {
    if (editingId && editTitle.trim()) {
      await updateGroupTitle(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // 그룹 공유
  const handleShare = async (group: Group) => {
    if (group.clips.length === 0) return;

    const encoded = encodeGroupForShare(group);
    const shareUrl = `${window.location.origin}?share=${encoded}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(group.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // 클립보드 실패 시 프롬프트로 표시
      prompt('공유 URL을 복사하세요:', shareUrl);
    }
  };

  if (groups.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">
        생성된 그룹이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div
          key={group.id}
          className={`p-3 rounded-lg transition-colors cursor-pointer ${
            selectedGroupId === group.id
              ? 'bg-blue-600/20 border border-blue-500'
              : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
          }`}
          onClick={() => selectGroup(group.id)}
        >
          {editingId === group.id ? (
            // 편집 모드
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                autoFocus
                className="flex-1 px-2 py-1 bg-gray-700 rounded text-white text-sm focus:outline-none"
              />
              <button
                onClick={saveEdit}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                저장
              </button>
              <button
                onClick={cancelEdit}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500"
              >
                취소
              </button>
            </div>
          ) : (
            // 일반 모드
            <>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white truncate flex-1">
                  {group.title}
                </h3>
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handlePlay(group)}
                    disabled={group.clips.length === 0}
                    className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="재생"
                  >
                    <PlayIcon />
                  </button>
                  <button
                    onClick={() => handleShare(group)}
                    disabled={group.clips.length === 0}
                    className="p-1.5 text-gray-400 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="공유"
                  >
                    {copiedId === group.id ? <CheckIcon /> : <ShareIcon />}
                  </button>
                  <button
                    onClick={() => startEdit(group)}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    title="편집"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    title="삭제"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {group.clips.length}개 클립
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}
