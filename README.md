# BDS — 금융 도메인 디자인 시스템

금융 도메인을 위한 React 디자인 시스템 모노레포입니다. 현재는 컴포넌트를 추가하기 전, 기반 환경(워크스페이스 골격 · 코드 품질 · 버저닝)만 구성된 단계입니다.

## AI 기반 작업 방식

이 레포지토리의 모든 작업은 **AI(Claude Code)를 활용**해 진행합니다. 사람이 방향과 판단을 주고, AI가 조사·계획·구현을 수행하며, 그 산출물을 사람이 검토하는 협업 방식을 따릅니다.

작업은 즉흥적으로 코드를 쓰는 대신, 아래의 정해진 단계를 거칩니다.

## 작업 흐름: 조사 → 계획 → 실행

`.claude/skills/`에 정의된 두 스킬을 기반으로 **조사 → 계획 → 실행** 3단계로 작업합니다.

1. **조사 (research)** — `research-phase` 스킬
   코드베이스를 깊이 읽고 웹으로 최신 동향·모범 사례를 조사한 뒤, 그 결과를 `docs/research/<주제>.md`에 기록합니다. 이 문서가 사람의 검토 표면이 되어, 잘못된 이해나 방향을 조기에 바로잡습니다.

2. **계획 (plan)** — `plan-phase` 스킬
   조사 결과와 실제 코드를 토대로 `docs/plans/<주제>.md`에 구현 계획을 작성합니다. 사람이 문서에 인라인 노트를 달면 AI가 이를 반영하는 "주석 사이클"을 명시 승인까지 반복합니다.

3. **실행 (implement)**
   승인된 계획서의 할 일 목록을 따라 구현하며, 각 작업 완료 시 계획서에 완료 표시를 남깁니다.

조사·계획 산출물은 각각 `docs/research/`, `docs/plans/`에 영구적으로 누적됩니다.

## 두 AI의 협업 구조 (Claude Code × Codex)

대량 구현·빌드·시각 산출이 필요한 작업은 두 AI 도구를 **역할 분담**으로 운영합니다. 누가 더 나은지를 따지지 않고, 어떤 일을 누구에게 맡길지 먼저 정한 뒤 [`PROJECT.md`](PROJECT.md) 현황판으로 조율합니다.

- **Claude Code (판단)** — 조사·계획·리스크 검토·설계·리뷰. 행동 지침: [`CLAUDE.md`](CLAUDE.md)
- **Codex (실행)** — 컴포넌트 구현·토큰 빌드·스크립트 실행·문서/시각 산출. 행동 지침: [`AGENTS.md`](AGENTS.md)

조율 장치는 세 가지입니다.

- **현황판** — [`PROJECT.md`](PROJECT.md)의 `Goal` / `Work Board` / `Decisions` / `Handoff Log`로 작업 상태를 공유합니다.
- **파일 락** — 한 파일은 한 시점에 한 도구만 수정합니다. 다른 도구는 읽기·리뷰만 합니다.
- **핸드오프 로그** — 작업을 넘길 때 `[담당] changed: … / verified: … / next: …` 한 줄을 남깁니다.

규칙 상세는 [`docs/collab-protocol.md`](docs/collab-protocol.md), 시각 기준은 [`DESIGN.md`](DESIGN.md), 산출물 템플릿은 [`docs/templates.md`](docs/templates.md)에 있습니다. 한 도구로 빠른 단순 작업은 굳이 나누지 않습니다.

### RTK — AI 토큰 절감

두 AI 도구가 `git status`, `pnpm lint`, 빌드·테스트 같은 **긴 출력**을 읽을 때 토큰을 60~90% 줄이기 위해 [RTK](https://github.com/rtk-ai/rtk)(CLI 프록시)를 사용합니다.

- **Claude Code**: 전역 hook(`~/.claude/settings.json`)이 Bash 명령을 자동으로 `rtk <명령>`으로 재작성합니다. 별도 조치가 필요 없습니다.
- **Codex**: 루트 [`RTK.md`](RTK.md)와 [`AGENTS.md`](AGENTS.md)의 지침에 따라 셸 명령 앞에 `rtk`를 붙입니다.
- **설치**: `brew install rtk` 후 `rtk init -g`(Claude Code) / `rtk init --codex`(Codex). 절감 통계는 `rtk gain`으로 확인합니다.

## 기술 스택

- **패키지 매니저 / 워크스페이스**: [pnpm](https://pnpm.io) workspace + catalog
- **빌드 오케스트레이션**: [Turborepo](https://turborepo.dev)
- **Lint + Format**: [Biome](https://biomejs.dev) v2 (린터·포매터 통합)
- **버저닝 / 배포**: [Changesets](https://github.com/changesets/changesets)

## 디렉터리 구조

```
.
├─ apps/                # 문서 사이트 · 데모 앱 (향후)
├─ packages/            # 컴포넌트 · 토큰 라이브러리 (향후)
├─ docs/
│  ├─ research/         # 조사 단계 산출물
│  ├─ plans/            # 계획 단계 산출물
│  ├─ collab-protocol.md # 협업 규칙 (역할·파일 락·핸드오프)
│  └─ templates.md      # 산출물 템플릿
├─ PROJECT.md           # 협업 현황판 (Work Board / Handoff Log)
├─ CLAUDE.md            # Claude Code(판단) 작업 지침
├─ AGENTS.md            # Codex(실행) 작업 지침
├─ RTK.md               # RTK(토큰 절감) Codex용 지침
├─ DESIGN.md            # 시각 기준
└─ .changeset/          # Changesets 설정
```

## 기본 명령

```bash
pnpm install      # 의존성 설치
pnpm check        # Biome 검사 + 자동 수정 (lint + format + import 정리)
pnpm lint         # Turborepo로 패키지별 lint 실행
pnpm format       # Biome 포맷 적용
pnpm changeset    # 변경분 changeset 생성
```
