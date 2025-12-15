'use client';

import { useState, useCallback } from 'react';
import { searchChannels } from '@/lib/chzzk-api';
import type { ChannelSearchResult } from '@/types';

interface ChannelSearchProps {
  onSelectChannel: (channelId: string, channelName: string) => void;
}

export default function ChannelSearch({ onSelectChannel }: ChannelSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ChannelSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchChannels(keyword.trim());
      setResults(response.data || []);
    } catch (err) {
      console.error('Search failed:', err);
      setError('검색 중 오류가 발생했습니다.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [keyword]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="채널명 검색..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !keyword.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.channel.channelId}
              onClick={() =>
                onSelectChannel(
                  result.channel.channelId,
                  result.channel.channelName
                )
              }
              className="w-full flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {/* 채널 이미지 */}
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                {result.channel.channelImageUrl ? (
                  <img
                    src={result.channel.channelImageUrl}
                    alt={result.channel.channelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserIcon />
                  </div>
                )}
              </div>

              {/* 채널 정보 */}
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-white truncate flex items-center gap-1">
                  {result.channel.channelName}
                  {result.channel.verifiedMark && (
                    <VerifiedIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 결과 없음 */}
      {!isLoading && keyword && results.length === 0 && !error && (
        <p className="text-gray-400 text-sm text-center py-4">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  );
}
