# 협업 프로토콜 — Claude Code × Codex

이 레포는 두 AI 도구를 **경쟁이 아니라 역할 분담**으로 운영한다. 누가 더 나은지를 따지지 않고, **어떤 작업을 누구에게 맡길지 먼저 정한 뒤** [`PROJECT.md`](../PROJECT.md)라는 단일 현황판으로 조율한다.

이 문서는 그 운영 규칙(역할·파일 락·핸드오프)을 정의한다. 두 도구는 각자의 행동 지침([`CLAUDE.md`](../CLAUDE.md), [`AGENTS.md`](../AGENTS.md))과 함께 이 문서를 따른다.

## 역할 분담

| 구분 | Claude Code (판단) | Codex (실행) |
| --- | --- | --- |
| 핵심 역할 | 조사·계획·리스크 검토·전략 판단·문서 | 코드 구현·빌드·스크립트 실행·시각 산출 |
| 디자인 시스템 맥락 | 토큰 체계 설계, 컴포넌트 API 설계, 접근성·표현 위험 검토, 변경의 파급 영향 판단, PR 리뷰 | 컴포넌트 구현, 토큰 빌드 파이프라인 실행, Storybook/문서 사이트 생성, 시각 회귀 스냅샷, 데모 캡처 |
| 산출물 | `docs/research/*.md`, `docs/plans/*.md`, 리스크 노트, 리뷰 | `packages/**` 소스, 빌드 산출물, 스토리, 스크린샷 |

이 분담은 절대 규칙이 아니라 기본값이다. 한 도구로 더 빠른 단순 작업은 굳이 나누지 않는다(아래 "이 구조를 쓰지 않는 경우" 참고).

## 작업 시작 ~ 종료 절차

모든 협업 작업은 다음 4단계를 거친다.

1. **목표 확인** — `PROJECT.md`의 `Goal`을 읽거나 갱신한다.
2. **락 잡기** — 작업할 파일을 `PROJECT.md`의 `Work Board`에 `담당 · 작업 중 ✓ locked`로 등록한다.
3. **작업** — 락을 잡은 파일만 수정한다. 다른 도구가 락을 잡은 파일은 **읽기·리뷰만** 한다.
4. **핸드오프** — 작업이 끝나면 락을 해제하고 `Handoff Log`에 한 줄 기록한 뒤, 다음 담당에게 넘긴다.

## 파일 락 (Files Locked)

같은 파일을 두 도구가 동시에 고치면 서로의 변경을 덮어쓴다. 이를 막는 장치다.

| 상황 | 조치 |
| --- | --- |
| Codex가 `packages/**` 컴포넌트를 구현 중 | Claude Code는 **리뷰만**, 직접 수정 금지 |
| Claude Code가 `docs/plans/*.md` 계획을 쓰는 중 | Codex는 **참고만**, 수정 금지 |
| 작업 완료 후 | `Work Board`에서 해당 파일 락 해제 |

- 락은 `Work Board`의 `✓ locked` 표기로 표현한다.
- 락이 걸린 파일을 꼭 고쳐야 하면, 직접 고치지 말고 담당 도구에게 핸드오프로 요청한다.

## RTK — 토큰 절감 규칙

긴 출력을 내는 셸 명령(`git status`/`git diff`, `pnpm lint`/`pnpm check`, 빌드·테스트 등)은 [RTK](https://github.com/rtk-ai/rtk) 프록시로 실행해 LLM 토큰을 아낀다.

- **Claude Code**: 전역 hook이 Bash 명령을 자동으로 `rtk <명령>`으로 재작성하므로 별도 조치가 필요 없다. (단 `Read`/`Grep`/`Glob` 내장 도구는 hook을 거치지 않으니, 큰 파일 요약이 필요하면 `rtk read`/`rtk grep`을 명시적으로 쓴다.)
- **Codex**: 셸 명령 앞에 `rtk`를 붙인다. 상세는 루트 [`RTK.md`](../RTK.md).
- 절감 효과는 `rtk gain`으로 확인한다.

## Handoff Log 형식

작업을 넘길 때 `PROJECT.md`의 `Handoff Log`에 한 줄 추가한다(최신이 위).

```
[담당 도구] changed: <수정 파일> / verified: <검증 상태> / next: <다음 담당과 할 일>
```

예시:

```
[Claude Code] changed: docs/plans/toast-system.md / verified: 계획 승인됨 / next: Codex가 packages/ui에 Toast 구현
[Codex] changed: packages/ui/src/toast/* / verified: 빌드·스토리 통과 / next: Claude Code가 접근성·API 리뷰
```

- `verified`에는 무엇으로 검증했는지를 적는다(빌드 통과, 테스트 통과, 계획 승인 등). 검증 안 했으면 "미검증"이라고 솔직히 적는다.
- `next`가 비면 작업 종료를 뜻한다.

## 산출물 체크리스트

| 산출물 | 담당 | 확인 포인트 |
| --- | --- | --- |
| `docs/research/*.md` | Claude Code | 코드베이스·웹 양축 조사, 출처 URL, 미해결 질문 명시 |
| `docs/plans/*.md` | Claude Code | 실제 코드 기반, 주석 사이클 승인 완료, 할 일 목록 확정 |
| 리스크 노트 | Claude Code | 추정 금지 영역, 접근성·표현 위험, 과장 표현 |
| `packages/**` 소스 | Codex | API 설계서/계획 준수, 타입 안전, 빌드·테스트 통과 |
| 토큰/빌드 산출물 | Codex | 파이프라인 재현 가능, DESIGN.md 기준 준수 |
| 스토리·문서·스냅샷 | Codex | 실제 동작 반영, DESIGN.md 색상·톤 준수 |

상세 템플릿은 [`docs/templates.md`](templates.md)를 따른다.

## 이 구조를 쓰지 않는 경우

협업 오버헤드가 산출물 가치를 넘으면 쓰지 않는다.

- 한 줄짜리 설정/오타 수정 (한 도구가 빠르다)
- 짧은 질문 답변·요약 (협업 불필요)
- `PROJECT.md` 없이 두 도구가 같은 파일을 병렬로 만지는 일 (덮어쓰기 위험)

**적합한 경우**: 산출물이 여럿이고, 판단(설계·검토)과 실행(구현·빌드)으로 명확히 나뉘며, 반복되는 작업.
