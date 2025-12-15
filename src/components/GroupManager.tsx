'use client';

import { useState } from 'react';
import { useGroupStore } from '@/stores/groupStore';

export default function GroupManager() {
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { createGroup } = useGroupStore();

  const handleCreate = async () => {
    if (!newGroupTitle.trim()) return;

    setIsCreating(true);
    try {
      await createGroup(newGroupTitle.trim());
      setNewGroupTitle('');
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newGroupTitle}
        onChange={(e) => setNewGroupTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="새 그룹 이름..."
        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500"
      />
      <button
        onClick={handleCreate}
        disabled={isCreating || !newGroupTitle.trim()}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isCreating ? '생성 중...' : '생성'}
      </button>
    </div>
  );
}
