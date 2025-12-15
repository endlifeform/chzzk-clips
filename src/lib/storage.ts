import type { Group, GroupClip } from '@/types';

// 저장소 인터페이스 (추후 백엔드 API로 교체 가능)
export interface IStorageService {
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | null>;
  saveGroup(group: Group): Promise<void>;
  deleteGroup(id: string): Promise<void>;
  addClipToGroup(groupId: string, clip: GroupClip): Promise<void>;
  removeClipFromGroup(groupId: string, clipId: string): Promise<void>;
  reorderClips(groupId: string, clips: GroupClip[]): Promise<void>;
}

const STORAGE_KEY = 'chzzk-clip-groups';

// LocalStorage 구현체
class LocalStorageService implements IStorageService {
  private getStorageData(): Group[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private setStorageData(groups: Group[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }

  async getGroups(): Promise<Group[]> {
    return this.getStorageData();
  }

  async getGroup(id: string): Promise<Group | null> {
    const groups = this.getStorageData();
    return groups.find((g) => g.id === id) || null;
  }

  async saveGroup(group: Group): Promise<void> {
    const groups = this.getStorageData();
    const index = groups.findIndex((g) => g.id === group.id);

    if (index >= 0) {
      groups[index] = { ...group, updatedAt: Date.now() };
    } else {
      groups.push(group);
    }

    this.setStorageData(groups);
  }

  async deleteGroup(id: string): Promise<void> {
    const groups = this.getStorageData();
    const filtered = groups.filter((g) => g.id !== id);
    this.setStorageData(filtered);
  }

  async addClipToGroup(groupId: string, clip: GroupClip): Promise<void> {
    const groups = this.getStorageData();
    const group = groups.find((g) => g.id === groupId);

    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    // 중복 체크
    const exists = group.clips.some((c) => c.clipUID === clip.clipUID);
    if (exists) {
      return;
    }

    // orderIndex 설정
    const maxOrder = group.clips.reduce(
      (max, c) => Math.max(max, c.orderIndex),
      -1
    );
    clip.orderIndex = maxOrder + 1;

    group.clips.push(clip);
    group.updatedAt = Date.now();

    this.setStorageData(groups);
  }

  async removeClipFromGroup(groupId: string, clipId: string): Promise<void> {
    const groups = this.getStorageData();
    const group = groups.find((g) => g.id === groupId);

    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    group.clips = group.clips.filter((c) => c.id !== clipId);
    group.updatedAt = Date.now();

    // orderIndex 재정렬
    group.clips.forEach((c, i) => {
      c.orderIndex = i;
    });

    this.setStorageData(groups);
  }

  async reorderClips(groupId: string, clips: GroupClip[]): Promise<void> {
    const groups = this.getStorageData();
    const group = groups.find((g) => g.id === groupId);

    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    group.clips = clips.map((c, i) => ({ ...c, orderIndex: i }));
    group.updatedAt = Date.now();

    this.setStorageData(groups);
  }
}

// 유틸리티: 새 그룹 생성
export function createNewGroup(title: string): Group {
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    clips: [],
  };
}

// 유틸리티: 클립을 GroupClip으로 변환
export function clipToGroupClip(
  clip: {
    clipUID: string;
    videoId: string;
    clipTitle: string;
    thumbnailImageUrl: string;
    duration: number;
    ownerChannelId: string;
  },
  channelName: string,
  orderIndex: number = 0
): GroupClip {
  return {
    id: crypto.randomUUID(),
    clipUID: clip.clipUID,
    videoId: clip.videoId,
    title: clip.clipTitle,
    thumbnailUrl: clip.thumbnailImageUrl,
    duration: clip.duration,
    channelName: channelName,
    channelId: clip.ownerChannelId,
    orderIndex,
  };
}

// 싱글톤 인스턴스
let storageInstance: IStorageService | null = null;

export function getStorage(): IStorageService {
  if (!storageInstance) {
    storageInstance = new LocalStorageService();
  }
  return storageInstance;
}

// 추후 백엔드 연동 시 사용할 함수
export function setStorageImplementation(impl: IStorageService): void {
  storageInstance = impl;
}
