# Plan: 금융 디자인 시스템 모노레포 기반 환경 구성

> 작성: 2026-06-07 · 상태: 검토/주석 대기
> 조사 토대: [`docs/research/monorepo-foundation.md`](../research/monorepo-foundation.md)

## 1. 개요 / 목표

금융 도메인 React 디자인 시스템을 위한 **모노레포 골격만** 잡는다. 컴포넌트는 아직 추가하지 않으며, 코드 한 줄을 작성하기 전에 갖춰져야 할 토대 3종만 구성한다.

이번 범위 (사용자 확정):

1. **모노레포 골격** — pnpm workspace + Turborepo
2. **Lint + Format** — Biome v2 (올인원)
3. **버저닝** — Changesets

이번 범위에서 **명시적으로 제외** (지금 잡지 않음):

- 번들러(tsdown/tsup), 디자인 토큰 파이프라인(Style Dictionary), 스타일링 전략(Panda/vanilla-extract/Tailwind)
- 테스트(Vitest), 문서화(Storybook), 시각 회귀(Chromatic)
- 실제 컴포넌트/토큰 패키지의 소스 코드

→ 목표 상태: `pnpm install` → `pnpm lint` / `pnpm format` / `pnpm check` / `pnpm changeset` 이 동작하고, 향후 패키지를 `packages/` 아래에 추가하기만 하면 되는 **빈 골격**.

## 2. 접근 방식

### 2-1. 디렉터리 구조 (조사 3-3 기반)

```
BDS/
├─ apps/                  # (빈 디렉터리 — .gitkeep) 향후 문서 사이트/Storybook
├─ packages/              # (빈 디렉터리 — .gitkeep) 향후 컴포넌트/토큰 라이브러리
├─ docs/                  # 기존 (research, plans)
├─ package.json           # 루트 (private, workspace 스크립트)
├─ pnpm-workspace.yaml    # workspace + catalog 정의
├─ turbo.json             # 태스크 그래프
├─ biome.json             # lint + format 설정
├─ .changeset/
│  └─ config.json         # Changesets 설정
├─ .gitignore
├─ .npmrc                 # pnpm 동작 설정
└─ .nvmrc 또는 packageManager 필드   # Node/pnpm 버전 고정
```

`tooling/`(공유 tsconfig/설정 패키지)은 **이번에 만들지 않는다** — 공유할 패키지가 아직 0개라 빈 패키지를 미리 만들면 오히려 부채가 된다. 첫 컴포넌트 패키지를 추가하는 시점에 도입한다. (조사 3-3은 권장하나, 사용자의 "다른 설정은 지금 잡지 말자" 방침에 맞춰 보류.)

### 2-2. 패키지 매니저: pnpm workspace + catalog

- 로컬 환경 확인됨: **pnpm 10.10.0, Node v22.18.0, corepack 0.33.0**.
- `package.json`의 `packageManager` 필드로 pnpm 버전을 고정해 팀/CI 재현성 확보(corepack이 이 필드를 읽음).
- `pnpm-workspace.yaml`에 `packages` 글롭(`apps/*`, `packages/*`)과 **`catalog`**(React/TS 등 공통 버전 단일화 자리)을 둔다. 단 지금은 의존성이 거의 없으므로 catalog는 **빈 자리만 마련**하거나 최소 항목만.

### 2-3. 빌드 오케스트레이터: Turborepo

- 루트에 `turbo` 개발 의존성, `turbo.json`에 태스크 파이프라인 정의.
- 지금은 패키지가 없으므로 태스크는 `lint`, `format`, `check`(Biome), 향후 `build`/`test` 자리만 선언. 실제 실행 대상은 패키지가 생기면 붙는다.
- **원격 캐시(Vercel Remote Cache)는 이번에 연결하지 않는다** — 조사 미해결 질문 5번(금융권 보안 정책)이 미확정. 로컬 캐시만 사용. `turbo login/link`는 보류.

### 2-4. Lint + Format: Biome v2

- 루트에 `@biomejs/biome` 개발 의존성 + `biome.json`.
- Biome는 린터 + 포매터를 단일 도구로 처리(조사 3-6). `pnpm format`(쓰기), `pnpm lint`(검사), `pnpm check`(둘 다 + import 정리)로 스크립트 구성.
- **금융 접근성(jsx-a11y) 룰 커버리지 트레이드오프**(조사 4-4): Biome v2는 다수 a11y 룰을 내장하나 ESLint의 `jsx-a11y` 전체 세트보다 좁을 수 있다. 사용자가 Biome를 명시 선택했으므로 채택하되, 향후 컴포넌트 단계에서 a11y 린트가 부족하면 ESLint를 **보조로** 얹는 길을 열어둔다(지금은 안 함).
- 전역 CLAUDE.md에 `oxfmt` 설정 관련 커밋 예시가 있으나, 이번엔 **Biome 단일 도구로 포맷**한다(oxfmt는 조사상 beta라 보류).

### 2-5. 버저닝: Changesets

- `@changesets/cli` 개발 의존성 + `pnpm changeset init`으로 `.changeset/config.json` 생성.
- **전제: git 저장소 필요.** 현재 `BDS`는 git repo가 아니다(`git rev-parse` 실패 확인). Changesets는 git 기반으로 변경분을 추적하므로 **`git init`이 선행돼야 한다.** → 할 일 목록에 포함.
- 공개 저장소로 배포하므로 `.changeset/config.json`의 `access`는 **`public`** 으로 설정. `baseBranch`는 `main`.
- 초기 패키지가 없으므로 changeset 생성/배포는 동작 확인만(실제 publish는 패키지 생긴 뒤).
- 배포 자동화 GitHub Action(`changesets/action`)은 **이번 범위에서 제외**(CI 미확정, 조사 미해결 5번). config만 잡고 워크플로 파일은 나중에.

### 2-6. README.md (생성 확정)

루트 `README.md`에 다음 내용을 담는다 — 단순 사용법 나열이 아니라 **이 레포가 어떻게 일하는지**를 설명하는 문서:

1. **프로젝트 소개**: 금융 도메인 React 디자인 시스템 모노레포라는 한 줄 정체성.
2. **AI 기반 작업 방식**: 이 레포의 모든 작업은 AI(Claude Code)를 활용해 진행한다는 점을 명시.
3. **추가된 스킬 설명** (프로젝트 `.claude/skills/`에 실재하는 2종, 확인됨):
   - `research-phase` — 코드베이스를 깊이 읽고 웹으로 최신 동향을 조사해 `docs/research/<주제>.md`를 남기는 **조사 단계**.
   - `plan-phase` — 조사 결과와 실제 코드를 토대로 `docs/plans/<주제>.md` 구현 계획을 쓰고 주석 사이클로 다듬는 **계획 단계**.
4. **작업 흐름**: 위 스킬을 기반으로 **조사(research) → 계획(plan) → 실행(implement)** 3단계로 작업이 진행됨을 설명. 산출물이 각각 `docs/research/`, `docs/plans/`에 누적된다는 점도 함께.
5. (선택) 모노레포 기본 명령(`pnpm install` / `lint` / `format` / `check` / `changeset`)과 디렉터리 구조 요약.

> README는 한국어로 작성한다(전역 CLAUDE.md 방침 일관성).

## 3. 변경 / 생성 파일 경로

> 현재 루트에는 `.claude/`, `docs/` 만 존재(확인됨). 아래는 전부 **신규 생성**이다.

| 경로                     | 목적                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `.git/` (via `git init`) | Changesets 전제. 신규 저장소 초기화 + 원격 공개 저장소 `LEECHANHYUNG/BDS` 연결          |
| `.gitignore`             | `node_modules`, `.turbo`, `dist`, 로그 등 제외                                         |
| `.npmrc`                 | pnpm 동작 설정 (예: `auto-install-peers`, `shamefully-hoist=false`)                    |
| `package.json` (루트)    | `private: true`, `packageManager`, workspace 스크립트, devDeps(turbo/biome/changesets) |
| `pnpm-workspace.yaml`    | workspace 글롭 + catalog 자리                                                          |
| `turbo.json`             | 태스크 파이프라인 (lint/format/check + build/test 자리)                                |
| `biome.json`             | lint + format 규칙                                                                     |
| `.changeset/config.json` | Changesets 설정 (`changeset init` 산출물)                                              |
| `apps/.gitkeep`          | 빈 워크스페이스 디렉터리 유지                                                          |
| `packages/.gitkeep`      | 빈 워크스페이스 디렉터리 유지                                                          |
| `README.md`              | 모노레포 소개 + AI 기반 워크플로 설명 (아래 2-6 명세 참고)                              |

## 4. 코드 스니펫 (초안 — 검토용, 버전은 설치 시점 확정)

> 아래는 방향 제시용 초안이다. 실제 버전 핀은 구현 시 `pnpm add`로 설치된 최신 안정 버전을 따른다.

**`package.json` (루트)**

```jsonc
{
  "name": "bds",
  "private": true,
  "packageManager": "pnpm@10.10.0",
  "engines": { "node": ">=22" },
  "scripts": {
    "lint": "turbo run lint",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build && changeset publish",
  },
  "devDependencies": {
    "@biomejs/biome": "^2",
    "@changesets/cli": "^2",
    "turbo": "^2",
  },
}
```

> `lint`은 `turbo run lint`로 확정 — 향후 패키지별 lint를 캐싱·병렬화하기 위함. (패키지가 0개인 현 시점엔 실행 대상이 없어 no-op에 가깝지만 골격을 미리 맞춰둠.)

**`pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"

# 공통 의존성 버전 단일화 자리 (지금은 비어있거나 최소)
catalog: {}
```

**`turbo.json`**

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "lint": {},
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "check": {},
  },
}
```

**`biome.json`**

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true },
  "formatter": { "enabled": true, "indentStyle": "space" },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "double" } },
}
```

> 포맷 세부는 Biome 기본값으로 확정: `indentStyle: space`, `quoteStyle: double`, 세미콜론 기본(always).

**`.changeset/config.json`** (init 후 조정)

```jsonc
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
}
```

> `access`: 공개 저장소/공개 배포 방침이므로 `public`으로 확정.

## 5. 고려사항 / 트레이드오프

- **git 저장소 초기화 + 원격 연동 (이번 단계 포함)**: Changesets와 Biome의 `vcs` 연동 모두 git을 전제로 한다. 이번 단계에서 `git init` → 첫 커밋 → **원격 공개 저장소 연결**까지 수행한다.
  - 기본 브랜치명: `main` (`.changeset/config.json`의 `baseBranch`와 일치).
  - 원격 저장소 이름: **`BDS`** (현재 폴더명과 동일).
  - 공개 범위: **public** 저장소. 이에 맞춰 Changesets `access`도 `public`.
  - 원격 생성: `gh repo create BDS --public --source=. --remote=origin --push`. gh CLI 2.83.0 설치 + `LEECHANHYUNG` 계정 인증 확인됨 → `github.com/LEECHANHYUNG/BDS`로 생성.
- **catalog를 지금 채울지**: 공통 의존성(React/TS 등)이 아직 없으므로 빈 catalog로 시작. 첫 패키지 추가 시 채운다. 미리 React 버전만 박아둘 수도 있으나 컴포넌트가 없어 불필요.
- **`tooling/` 공유 설정 패키지 보류**: 조사는 권장하나 공유 대상이 0개라 지금은 부채. 사용자 방침("다른 설정 지금 잡지 말자")과도 일치.
- **Biome vs ESLint+Prettier 트레이드오프**(조사 4-4): 금융 a11y 룰 커버리지가 좁을 수 있음을 인지하고 채택. 부족 시 후속 보강.
- **원격 캐시·CI 배포 자동화 제외**: 보안 정책 미확정(조사 미해결 5번)이라 로컬 캐시 + 수동 흐름만. 나중에 추가 가능하게 config는 남김.
- **`packageManager` 핀**: corepack이 읽어 팀 전체 pnpm 버전을 통일. CI에서도 동일 버전 보장.

## 6. 할 일 목록

### A. git 저장소 초기화 & 원격 연동
- [x] `git init` (기본 브랜치 `main`으로 설정)
- [x] `.gitignore` 작성 (`node_modules`, `.turbo`, `dist`, `*.log`, `.DS_Store` 등)

### B. 패키지 매니저 / 워크스페이스 골격
- [x] 루트 `package.json` 생성 (`name: bds`, `private: true`, `packageManager: pnpm@10.10.0`, `engines.node: >=22`)
- [x] `pnpm-workspace.yaml` 생성 (`apps/*`, `packages/*` 글롭 + 빈 `catalog`)
- [x] `.npmrc` 생성 (pnpm 동작 설정)
- [x] `apps/.gitkeep`, `packages/.gitkeep` 생성

### C. Turborepo
- [x] `turbo`를 루트 devDependency로 설치 (2.9.16)
- [x] `turbo.json` 생성 (`lint`/`check`/`build`/`test` 태스크 자리 선언)
- [x] 루트 `package.json`에 `lint`/`format`/`check` 스크립트 추가 (`lint`은 `turbo run lint`)

### D. Biome v2 (lint + format)
- [x] `@biomejs/biome`를 루트 devDependency로 설치 (2.4.16)
- [x] `biome.json` 생성 (formatter+linter recommended, `space`/`double`/세미콜론 기본, git `vcs` 연동)
- [x] `pnpm check` 실행해 정상 동작 확인 (4개 파일 검사 통과)

### E. Changesets
- [x] `@changesets/cli`를 루트 devDependency로 설치 (2.31.0)
- [x] `pnpm changeset init` 실행 → `.changeset/config.json` 생성
- [x] `.changeset/config.json` 조정 (`access: public`, `baseBranch: main`)

### F. README
- [x] 루트 `README.md` 작성 (한국어): 프로젝트 소개 / AI 기반 작업 방식 / 스킬 2종(`research-phase`, `plan-phase`) 설명 / 조사→계획→실행 흐름 / 기본 명령·구조 요약

### G. 설치 & 검증
- [x] `pnpm install` 정상 동작 확인
- [x] `pnpm check` / `pnpm lint` / `pnpm format` 정상 동작 확인 (check 5파일 통과, lint는 패키지 0개라 no-op)
- [x] `pnpm changeset` 동작 확인 (CLI 정상 설치·실행. `status`의 HEAD diverge 에러는 커밋 0개라서 나는 예상된 상태로, 첫 커밋 후 해소됨)

### H. 첫 커밋 & 원격 연결
- [x] 전체를 첫 커밋 (`chore: 모노레포 기반 환경 구성`)
- [x] `gh repo create BDS --public --source=. --remote=origin --push`로 공개 원격 저장소 생성 및 푸시 (https://github.com/LEECHANHYUNG/BDS)
