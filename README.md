# 클립 플레이어

Chzzk(네이버 스트리밍 플랫폼) 클립을 검색하고 그룹화하여 연속 재생할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **채널 검색**: Chzzk 채널을 검색하고 클립 목록 조회
- **그룹 관리**: 클립을 그룹(재생목록)으로 관리
- **연속 재생**: 셔플, 반복(전체/단일) 모드 지원
- **키보드 단축키**: 마우스 없이 완전 제어 가능
- **반응형 UI**: 모바일, 태블릿, 데스크톱 지원
- **로컬 저장**: 그룹 데이터는 브라우저에 자동 저장

## 기술 스택

- **프레임워크**: Next.js 16 + React 19
- **언어**: TypeScript 5
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS 4
- **비디오 재생**: HLS.js

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm run start
```

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── chzzk/[...path]/route.ts      # Chzzk API 프록시
│   │   └── neonplayer/[...path]/route.ts # 비디오 스트리밍 프록시
│   ├── layout.tsx                         # 루트 레이아웃
│   ├── page.tsx                           # 메인 페이지
│   └── globals.css                        # 전역 스타일
├── components/
│   ├── ChannelSearch.tsx                  # 채널 검색 UI
│   ├── ClipCard.tsx                       # 클립 카드
│   ├── ClipList.tsx                       # 클립 목록
│   ├── GroupManager.tsx                   # 그룹 생성 UI
│   ├── GroupList.tsx                      # 그룹 목록
│   ├── Player.tsx                         # 비디오 플레이어
│   ├── PlayerControls.tsx                 # 재생 컨트롤
│   └── Playlist.tsx                       # 재생목록 사이드바
├── stores/
│   ├── playerStore.ts                     # 플레이어 상태
│   └── groupStore.ts                      # 그룹 상태
├── lib/
│   ├── chzzk-api.ts                       # Chzzk API 클라이언트
│   └── storage.ts                         # LocalStorage 서비스
├── hooks/
│   └── useKeyboardShortcuts.ts            # 키보드 단축키 훅
└── types/
    └── index.ts                           # 타입 정의
```

## 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| `Space` | 재생/일시정지 |
| `N` | 다음 클립 |
| `P` | 이전 클립 |
| `S` | 셔플 토글 |
| `R` | 반복 모드 전환 |
| `M` | 음소거 토글 |
| `F` | 전체화면 |
| `↑` / `↓` | 볼륨 조절 |
| `←` / `→` | 5초 탐색 |

## 데이터 흐름

### 클립 검색 및 재생

```
채널 검색 → searchChannels() API
    ↓
클립 목록 조회 → getClipList() API
    ↓
클립 선택 → getClipPlaybackUrl() → 재생 URL 획득
    ↓
HLS.js로 비디오 스트리밍 재생
```

### 그룹 관리

```
그룹 생성 → groupStore.createGroup()
    ↓
클립 추가 → addClipToGroup()
    ↓
LocalStorage에 자동 저장
    ↓
그룹 재생 → setPlaylist(group.clips)
```

## API 프록시

CORS 우회를 위해 Next.js API Routes를 프록시로 사용합니다.

- `/api/chzzk/*` → `https://api.chzzk.naver.com/*`
- `/api/neonplayer/*` → `https://apis.naver.com/neonplayer/*`

## 라이선스

MIT
