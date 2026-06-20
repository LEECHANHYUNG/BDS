# PROJECT — BDS 협업 현황판

> 이 문서는 **Claude Code(판단)** 와 **Codex(실행)** 사이의 단일 현황판이다.
> 두 도구는 이 문서를 통해서만 작업 상태를 주고받는다. 작업을 시작·완료할 때 항상 이 문서를 먼저 갱신한다.
> 협업 규칙의 상세는 [`docs/collab-protocol.md`](docs/collab-protocol.md)에 있다.

## Goal

이 레포가 지금 해결하려는 일을 한 줄로 적는다. 작업 단위가 바뀌면 갱신한다.

- 현재 목표: 린트/포맷 노선을 Biome → **oxlint + oxfmt**로 전환 완료(ADR-0008). 이후 `@bds/tokens`·`@bds/react` 첫 패키지 추가로 복귀.
- 관련 산출물: `docs/research/lint-format-toolchain.md`, `docs/plans/lint-format-toolchain.md`, `CONTEXT.md`, `docs/adr/0001~0008`, `DESIGN.md`

## Work Board

진행 중인 파일과 담당자, 락 상태를 적는다. 형식: `경로 — 담당 도구 · 상태`.
`✓ locked` 표시가 있는 파일은 **담당이 아닌 도구가 직접 수정 금지**(읽기·리뷰만 가능).

| 파일                                             | 담당 | 상태 |
| ------------------------------------------------ | ---- | ---- |
| _(없음 — 린트/포맷 oxc 전환 구현 완료, 락 해제)_ | —    | —    |

## Decisions

협업 중 합의한 규칙·결정을 누적한다. 새 결정은 맨 위에 날짜와 함께 추가한다.

- **(2026-06-20) 린트/포맷 = oxlint + oxfmt로 전환** (그릴링): Biome 완전 제거 → oxlint(린트)+oxfmt(포맷). **조사 결론은 "Biome 유지"였으나**(제품 합리성), 학습 동기(현업 oxc 운영 대비)+코드 0줄 타이밍으로 **의식적으로 뒤집음**. 확정 사항: printWidth 100(oxfmt 기본), `check`=검증 전용(비파괴, CI 대비), oxlint는 correctness만(나머지 보류), oxfmt는 정확 버전 고정(0.x 잡음 차단)·oxlint는 캐럿(stable), 설정은 oxlint `.oxlintrc.json`+JSONC 주석 / oxfmt `.oxfmtrc.jsonc`. CodeRabbit은 `tools.oxc`(키명 주의)로 전환하되 **Biome enabled면 oxlint 안 돎**. 재평가 트리거 A(oxfmt 1.0 정체/포맷 깨짐)·B(type-aware 필요)·C(a11y 룰 부족 실측). ADR-0004 supersede, 근거는 ADR-0008.
- **(2026-06-20) CodeRabbit 리뷰 설정 확정** (그릴링): 언어 `ko-KR`; 프로파일 `chill`(로컬 정적 도구와 신호 중복 회피, 설계·도메인 위험 집중); `request_changes_workflow: false`(머지 비차단, 조언자); 도구는 ADR-0008 이후 `oxc` on·Biome off·gitleaks on·markdownlint off; `auto_review.drafts: false`; `knowledge_base` 학습 유지; `path_instructions`는 실재 경로(`docs/**`·`.changeset/**`)에만, `packages/**`는 첫 컴포넌트 시점 보류. 근거·재평가 트리거(CI 도입 시 request_changes→true, 첫 컴포넌트 시 packages 관점 추가)는 ADR-0007.
- **같은 파일 동시 수정 금지.** 한 파일은 한 시점에 한 도구만 쓴다. Work Board에서 락을 잡고 작업한다.
- **판단/실행 분리.** Claude Code는 조사·계획·리스크 검토·문서 판단을, Codex는 코드 구현·빌드·스크립트 실행·시각 산출을 맡는다. (역할 상세: [`docs/collab-protocol.md`](docs/collab-protocol.md))
- **(2026-06-20) 모노레포 골격 스택 확정** (그릴링): 기존 환경(pnpm/turbo/biome/changeset)을 의사결정 기반으로 하나씩 재검토해 **4종 모두 유지 재확인**(ADR-0004); 패키지 구조 = `@bds/tokens`+`@bds/react` 2패키지, L1/L2는 `@bds/react` 내부 폴더, 스코프 `@bds/*`, independent 버전(ADR-0005); 번들러·exports·tsconfig·CI·토큰파이프·Storybook·a11y 보강은 재평가 트리거와 함께 의식적 보류(ADR-0006). Biome은 a11y 부족분 실측 후 ESLint 보조를 얹는 조건부 결정.
- **(2026-06-20) DS 도메인 골격 확정** (그릴링): 능력 우선순위 C(금융)>A(아키)>B(인프라); 2층 구조 L1(base-ui 인터페이스 철학)/L2(증권 도메인=본체); 데모 앱이 dogfooding 첫 소비자; 쇼케이스=주식주문; 데이터=mock 실시간. 근거는 `docs/adr/0001~0003`.

## Handoff Log

작업을 넘길 때마다 한 줄 추가한다(최신이 위). 형식:

```
[담당 도구] changed: <수정 파일> / verified: <검증 상태> / next: <다음 담당과 할 일>
```

- [Claude Code] changed: (리뷰만, 파일 수정 없음) / verified: 리뷰 5축 통과 — ① 계획 준수: A~F 19작업 전부 반영, printWidth100·check비파괴·correctness만·oxfmt exact/oxlint캐럿·CodeRabbit oxc+biome:false·ADR-0008 supersede/트레이드오프/트리거 ABC 정확 ② 검증 실재: worktree에서 `pnpm check` 실제 통과(oxlint OK+oxfmt 41파일 OK) ③ 접근성: jsx-a11y 명시·색대비는 axe-core/Storybook 영역 기술 ④ 파급: 컴포넌트·토큰 영향 없음, ADR-0004 supersede 표기·pnpm/turbo/changesets 유지 명시 ⑤ 범위 밖 md 15개 재포맷=oxfmt 정당 결과(내용변경0), 사용자 "그대로 둔다" 승인. 보완 인정: `--no-error-on-unmatched-pattern`(코드0줄 대응)·`.oxlintrc.json` JSONC / next: 브랜치 codex/lint-format-toolchain PR·머지. 머지 후 CodeRabbit이 oxc로 첫 리뷰 도는지 확인
- [Codex] changed: package.json, pnpm-lock.yaml, biome.json(삭제), .oxlintrc.json, .oxfmtrc.jsonc, .coderabbit.yaml, docs/adr/0004·0007·0008, docs/research/monorepo-foundation.md, docs/plans/lint-format-toolchain.md, PROJECT.md, oxfmt 적용 문서 포맷 / verified: `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm check`, oxlint `--print-config`, oxfmt 설정 check, Ruby YAML parse 및 `tools.oxc=true`·`tools.biome=false` 확인 통과. 타입체크는 tsconfig·TS 소스·typecheck 스크립트가 없어 적용 불가 / next: Claude Code가 계획 준수·접근성·파급 리뷰
- [Claude Code] changed: docs/research/lint-format-toolchain.md, docs/plans/lint-format-toolchain.md, PROJECT.md / verified: 그릴링 8건 결정 박제, 미해결 2건(CodeRabbit oxlint 지원=oxc 키·Biome off 필요 / oxc 설정 형식) 웹 조사로 해소, 계획서 §5 결정 5건 확정·§6 할 일 19개 확정, 노트 사이클 완료(주석 0) / next: Codex가 docs/plans/lint-format-toolchain.md대로 oxc 전환 구현(A~F 그룹). 구현 후 Claude Code가 계획 준수·접근성·파급 리뷰
- [Claude Code] changed: .coderabbit.yaml, docs/adr/0007-coderabbit-review-config.md, PROJECT.md (브랜치 chore/coderabbit-config) / verified: 그릴링 8개 결정 yaml 반영, CodeRabbit 스키마 키 검증(language·reviews.profile·request_changes_workflow·auto_review.drafts·tools.biome/gitleaks/markdownlint·path_filters·path_instructions·chat·knowledge_base), 실재 경로만 path_instructions에 사용 / next: PR 생성·머지 후 CodeRabbit 첫 리뷰 동작 확인. CI 도입 시 request_changes_workflow→true, 첫 컴포넌트 시 packages/\*\* path_instructions 추가(ADR-0007 트리거)
- [Claude Code] changed: docs/adr/0004~0006 (모노레포 골격 스택·패키지 구조·보류 항목), PROJECT.md / verified: 결정과 기존 설정 파일(.changeset/config.json fixed:[]·linked:[], pnpm-workspace catalog:{}) 정합 확인 — 파일 변경 불필요. ADR은 그릴링 결정 7건을 3개로 묶어 기록 / next: 첫 패키지(@bds/tokens·@bds/react) 추가 시 ADR-0006 트리거대로 번들러·exports·a11y 보강 결정 (Codex 핸드오프 대상)
- [Claude Code] changed: .claude/hooks/{handoff-snapshot,handoff-write,handoff-inject}.sh, .claude/settings.json, .gitignore / verified: B·C 그룹 전부 통과 — 문법검사·JSON유효성 OK, snapshot 기록 OK, write가 실제 claude -p로 4항목 handoff.md 생성 OK, 재귀가드 OK, inject 주입 OK, 실패시 exit0 OK, gitignore OK. (남은 것: 실세션 end-to-end는 다음 세션에서) / next: _(완료)_
- [Claude Code] changed: docs/plans/session-handoff-hooks.md (G1~G4 [x]) / verified: 게이트 4개 실측 통과 — claude -p headless OK, transcript jq 필터 OK, CLAUDE_PROJECT_DIR=BDS루트 OK, HANDOFF_HOOK_RUNNING 환경변수 자식 훅 전파 OK(재귀 가드 작동) / next: B·C 그룹 직접 구현
- [Codex] changed: README.md, AGENTS.md, CLAUDE.md, DESIGN.md, docs/collab-protocol.md, docs/templates.md, docs/research/monorepo-foundation.md, docs/plans/monorepo-foundation.md, .claude/skills/research-phase/SKILL.md, .claude/skills/plan-phase/SKILL.md, .claude/skills/plan-phase/assets/plan-template.md, .claude/skills/implement-phase/SKILL.md, PROJECT.md / verified: `pnpm check` 통과, 숨김 파일 포함 관련 키워드 검색 매치 없음 / next: 작업 종료
