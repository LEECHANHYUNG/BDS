# PROJECT — BDS 협업 현황판

> 이 문서는 **Claude Code(판단)** 와 **Codex(실행)** 사이의 단일 현황판이다.
> 두 도구는 이 문서를 통해서만 작업 상태를 주고받는다. 작업을 시작·완료할 때 항상 이 문서를 먼저 갱신한다.
> 협업 규칙의 상세는 [`docs/collab-protocol.md`](docs/collab-protocol.md)에 있다.

## Goal

이 레포가 지금 해결하려는 일을 한 줄로 적는다. 작업 단위가 바뀌면 갱신한다.

- 현재 목표: 디자인 시스템 모노레포 세팅을 의사결정 기반으로 재정립 — 그릴링으로 도메인 골격(C>A>B, L1/L2, 주식주문 쇼케이스, mock 실시간) 확정. 다음은 A/B 스택을 `/research-phase`로 조사.
- 관련 산출물: `CONTEXT.md`, `docs/adr/0001~0003`, `DESIGN.md`, `docs/research/`(예정)

## Work Board

진행 중인 파일과 담당자, 락 상태를 적는다. 형식: `경로 — 담당 도구 · 상태`.
`✓ locked` 표시가 있는 파일은 **담당이 아닌 도구가 직접 수정 금지**(읽기·리뷰만 가능).

| 파일 | 담당 | 상태 |
| --- | --- | --- |
| _(없음 — 세션 핸드오프 훅 구현 완료, 락 해제)_ | — | — |

## Decisions

협업 중 합의한 규칙·결정을 누적한다. 새 결정은 맨 위에 날짜와 함께 추가한다.

- **같은 파일 동시 수정 금지.** 한 파일은 한 시점에 한 도구만 쓴다. Work Board에서 락을 잡고 작업한다.
- **판단/실행 분리.** Claude Code는 조사·계획·리스크 검토·문서 판단을, Codex는 코드 구현·빌드·스크립트 실행·시각 산출을 맡는다. (역할 상세: [`docs/collab-protocol.md`](docs/collab-protocol.md))
- **(2026-06-20) DS 도메인 골격 확정** (그릴링): 능력 우선순위 C(금융)>A(아키)>B(인프라); 2층 구조 L1(base-ui 인터페이스 철학)/L2(증권 도메인=본체); 데모 앱이 dogfooding 첫 소비자; 쇼케이스=주식주문; 데이터=mock 실시간. 근거는 `docs/adr/0001~0003`. **A/B 스택(모노레포 도구·빌드·스타일링·토큰·문서·publish)과 기존 환경(turbo/pnpm/biome/changeset) 채택 여부는 미결정 — `/research-phase`로 이월.**

## Handoff Log

작업을 넘길 때마다 한 줄 추가한다(최신이 위). 형식:

```
[담당 도구] changed: <수정 파일> / verified: <검증 상태> / next: <다음 담당과 할 일>
```

- [Claude Code] changed: .claude/hooks/{handoff-snapshot,handoff-write,handoff-inject}.sh, .claude/settings.json, .gitignore / verified: B·C 그룹 전부 통과 — 문법검사·JSON유효성 OK, snapshot 기록 OK, write가 실제 claude -p로 4항목 handoff.md 생성 OK, 재귀가드 OK, inject 주입 OK, 실패시 exit0 OK, gitignore OK. (남은 것: 실세션 end-to-end는 다음 세션에서) / next: _(완료)_
- [Claude Code] changed: docs/plans/session-handoff-hooks.md (G1~G4 [x]) / verified: 게이트 4개 실측 통과 — claude -p headless OK, transcript jq 필터 OK, CLAUDE_PROJECT_DIR=BDS루트 OK, HANDOFF_HOOK_RUNNING 환경변수 자식 훅 전파 OK(재귀 가드 작동) / next: B·C 그룹 직접 구현
- [Codex] changed: README.md, AGENTS.md, CLAUDE.md, DESIGN.md, docs/collab-protocol.md, docs/templates.md, docs/research/monorepo-foundation.md, docs/plans/monorepo-foundation.md, .claude/skills/research-phase/SKILL.md, .claude/skills/plan-phase/SKILL.md, .claude/skills/plan-phase/assets/plan-template.md, .claude/skills/implement-phase/SKILL.md, PROJECT.md / verified: `pnpm check` 통과, 숨김 파일 포함 관련 키워드 검색 매치 없음 / next: 작업 종료
