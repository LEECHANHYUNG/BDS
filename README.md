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

## 기술 스택

- **패키지 매니저 / 워크스페이스**: [pnpm](https://pnpm.io) workspace + catalog
- **빌드 오케스트레이션**: [Turborepo](https://turborepo.dev)
- **Lint + Format**: [Biome](https://biomejs.dev) v2 (린터·포매터 통합)
- **버저닝 / 배포**: [Changesets](https://github.com/changesets/changesets)

## 디렉터리 구조

```
.
├─ apps/        # 문서 사이트 · 데모 앱 (향후)
├─ packages/    # 컴포넌트 · 토큰 라이브러리 (향후)
├─ docs/
│  ├─ research/ # 조사 단계 산출물
│  └─ plans/    # 계획 단계 산출물
└─ .changeset/  # Changesets 설정
```

## 기본 명령

```bash
pnpm install      # 의존성 설치
pnpm check        # Biome 검사 + 자동 수정 (lint + format + import 정리)
pnpm lint         # Turborepo로 패키지별 lint 실행
pnpm format       # Biome 포맷 적용
pnpm changeset    # 변경분 changeset 생성
```
