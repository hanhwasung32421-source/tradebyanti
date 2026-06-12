# 거래소 데모 (모의 USDT)

OKX 공개 시세(차트/호가)를 붙이고, 가상 USDT로 모의체결을 할 수 있는 데모 프로젝트입니다.

주의: **실제 USDT 온체인 입금/출금, 실거래 체결 기능은 포함하지 않습니다.**

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## 권장 실행

Nuxt 4 개발서버가 Windows에서 `nuxt-vite` 파이프 오류를 낼 수 있어, 현재는 아래 **빌드 후 실행** 방식을 권장합니다.

```powershell
cd 'c:\trae\베트남\거래소\exchange-demo' ; npm.cmd install ; npm.cmd run build ; npm.cmd run start
```

브라우저:

```text
http://localhost:3000/
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev -- --host 127.0.0.1 --port 3000

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## 기본 계정/흐름

- 메인 사이트: 회원가입/로그인 가능
- 관리자 페이지: 로그인만 가능
  - 기본 총관리자: `admin` / `1121`

## 주요 페이지

- 거래 화면: `/exchange/BTCUSDT`
- 내 계정(잔고/포지션/거래내역): `/me`
- 수익/손실 인증 카드: `/profit`
- 관리자: `/admin`

## 관리자 기능(현재)

- 유저 목록 조회: `/admin/users`
- 가상 USDT 입금(잔고 증가): `/admin/users`에서 사용자별 입금
- 지사 관리자 계정 생성(총관리자만): `/admin` 하단 “지사 계정 생성”

## 데이터 저장

- SQLite 파일: `data/app.db` (프로젝트 폴더 내부)
- Supabase(자동 저장): `SUPABASE_EXTRA_TABLES.sql`를 Supabase SQL Editor에서 실행 후 사용

## 관리자 기본 잔고(데모)

- 총관리자 `admin` 계정은 데모 편의상 USDT가 최소 `10000`이 되도록 시드가 들어갑니다.
- 값을 바꾸려면 배포 환경변수 `SEED_ADMIN_USDT`로 조정할 수 있습니다. (예: `SEED_ADMIN_USDT=50000`)

## Supabase 연결(anon)

- URL: `https://dyfycrmltqosezmsufup.supabase.co`
- anon key: `nuxt.config.ts`의 `public.supabaseAnonKey` 사용 (환경변수 `SUPABASE_ANON_KEY`로 덮어쓸 수 있음)

## GitHub 자동 푸시

원격 저장소:

- `https://github.com/hanhwasung32421-source/usdetrade.git`

한 번만 푸시:

```powershell
cd 'c:\trae\베트남\거래소\exchange-demo' ; .\auto_push.ps1
```

수정될 때마다 자동 감시/푸시:

```powershell
cd 'c:\trae\베트남\거래소\exchange-demo' ; .\watch_push.ps1
```

## 버전 표기

- 우측 상단에 `vYYMMDD.N` 형식으로 표시됩니다. (예: `v260612.1`)
- `auto_push.ps1`/`watch_push.ps1`가 커밋 전에 `version.json`을 자동으로 올립니다.

## 배포

- GitHub Pages에는 이 프로젝트를 그대로 배포할 수 없습니다. 서버 API와 SQLite가 필요하기 때문입니다.
- 대신 GitHub 저장소를 소스로 사용해 Docker 지원 서버(Render, Railway, VPS, Docker 호스팅 등)에 배포할 수 있도록 `Dockerfile`을 포함했습니다.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
