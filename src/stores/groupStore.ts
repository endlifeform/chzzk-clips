'use client';

import { create } from 'zustand';
import type { Group, GroupClip, Clip } from '@/types';
import {
  getStorage,
  createNewGroup,
  clipToGroupClip,
} from '@/lib/storage';

interface GroupState {
  // 상태
  groups: Group[];
  selectedGroupId: string | null;
  isLoading: boolean;

  // 액션
  loadGroups: () => Promise<void>;
  createGroup: (title: string) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
  updateGroupTitle: (id: string, title: string) => Promise<void>;
  selectGroup: (id: string | null) => void;
  addClipToGroup: (groupId: string, clip: Clip, channelName: string) => Promise<void>;
  removeClipFromGroup: (groupId: string, clipId: string) => Promise<void>;
  reorderClips: (groupId: string, clips: GroupClip[]) => Promise<void>;
  getSelectedGroup: () => Group | null;
  importGroup: (group: Group) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  // 초기 상태
  groups: [],
  selectedGroupId: null,
  isLoading: false,

  // 액션
  loadGroups: async () => {
    set({ isLoading: true });
    try {
      const storage = getStorage();
      const groups = await storage.getGroups();
      set({ groups, isLoading: false });
    } catch (error) {
      console.error('Failed to load groups:', error);
      set({ isLoading: false });
    }
  },

  createGroup: async (title) => {
    const storage = getStorage();
    const newGroup = createNewGroup(title);

    await storage.saveGroup(newGroup);

    set((state) => ({
      groups: [...state.groups, newGroup],
    }));

    return newGroup;
  },

  deleteGroup: async (id) => {
    const storage = getStorage();
    await storage.deleteGroup(id);

    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      selectedGroupId:
        state.selectedGroupId === id ? null : state.selectedGroupId,
    }));
  },

  updateGroupTitle: async (id, title) => {
    const storage = getStorage();
    const { groups } = get();
    const group = groups.find((g) => g.id === id);

    if (!group) return;

    const updatedGroup = { ...group, title, updatedAt: Date.now() };
    await storage.saveGroup(updatedGroup);

    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? updatedGroup : g)),
    }));
  },

  selectGroup: (id) => {
    set({ selectedGroupId: id });
  },

  addClipToGroup: async (groupId, clip, channelName) => {
    const storage = getStorage();
    const { groups } = get();
    const group = groups.find((g) => g.id === groupId);

    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    // 중복 체크
    if (group.clips.some((c) => c.clipUID === clip.clipUID)) {
      return;
    }

    const groupClip = clipToGroupClip(clip, channelName, group.clips.length);
    await storage.addClipToGroup(groupId, groupClip);

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              clips: [...g.clips, groupClip],
              updatedAt: Date.now(),
            }
          : g
      ),
    }));
  },

  removeClipFromGroup: async (groupId, clipId) => {
    const storage = getStorage();
    await storage.removeClipFromGroup(groupId, clipId);

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              clips: g.clips
                .filter((c) => c.id !== clipId)
                .map((c, i) => ({ ...c, orderIndex: i })),
              updatedAt: Date.now(),
            }
          : g
      ),
    }));
  },

  reorderClips: async (groupId, clips) => {
    const storage = getStorage();
    await storage.reorderClips(groupId, clips);

    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              clips: clips.map((c, i) => ({ ...c, orderIndex: i })),
              updatedAt: Date.now(),
            }
          : g
      ),
    }));
  },

  getSelectedGroup: () => {
    const { groups, selectedGroupId } = get();
    if (!selectedGroupId) return null;
    return groups.find((g) => g.id === selectedGroupId) || null;
  },

  importGroup: async (group) => {
    const storage = getStorage();
    await storage.saveGroup(group);

    set((state) => ({
      groups: [...state.groups, group],
      selectedGroupId: group.id,
    }));
  },
}));
