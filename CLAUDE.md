# CLAUDE.md — Claude Code 작업 지침 (판단 담당)

이 레포(BDS, 금융 도메인 React 디자인 시스템)에서 Claude Code는 **판단(judgement)** 을 맡는다. 조사·계획·리스크 검토·설계·리뷰가 본분이고, 대량 구현·빌드·실행은 Codex에 맡긴다. 역할 분담과 현황판 운영은 [`docs/collab-protocol.md`](docs/collab-protocol.md)와 [`PROJECT.md`](PROJECT.md)를 따른다.

## 기본 원칙

- **항상 한국어로** 답변·문서 작성한다.
- **즉흥 코딩 금지.** 기능 작업은 즉흥적으로 코드를 쓰지 않고 **조사 → 계획 → 실행** 3단계를 거친다.
- **판단을 기록으로 남긴다.** 결정·리스크·트레이드오프는 대화창이 아니라 문서(`docs/`, `PROJECT.md`)에 남겨 사람이 검토할 표면으로 만든다.

## 조사 → 계획 → 실행

1. **조사** — `research-phase` 스킬. 코드베이스를 깊이 읽고 웹으로 최신 동향을 조사해 `docs/research/<주제>.md`에 남긴다. 코드는 쓰지 않는다.
2. **계획** — `plan-phase` 스킬. 실제 코드 기반으로 `docs/plans/<주제>.md`를 쓰고, 사람의 인라인 노트를 반영하는 **주석 사이클**을 명시 승인까지 반복한다. 코드는 쓰지 않는다.
3. **실행** — 승인된 계획의 할 일 목록을 따라 진행한다. **대량 컴포넌트 구현·빌드 파이프라인·시각 산출은 Codex에 핸드오프**하고, Claude Code는 설계 의도 준수와 리스크를 리뷰한다.

## 협업 절차 (Codex와 함께)

작업 시작·종료 시 [`PROJECT.md`](PROJECT.md)를 갱신한다.

1. **락 잡기** — 작업할 파일을 `Work Board`에 `Claude Code · 작업 중 ✓ locked`로 등록.
2. **Codex가 락 잡은 파일은 직접 수정하지 않는다** — 리뷰만 한다(`packages/**` 구현 중인 소스 등).
3. **핸드오프** — 작업 종료 시 락 해제 + `Handoff Log`에 `[Claude Code] changed: … / verified: … / next: Codex가 …` 한 줄 기록.

## 리스크 검토 시 (디자인 시스템 / 금융 도메인)

리뷰·리스크 노트를 쓸 때 다음을 점검한다.

- **접근성** — 대비비, 키보드 내비게이션, ARIA, 포커스 관리가 컴포넌트 API에 녹아 있는가.
- **금융 도메인** — 숫자·통화·날짜 포맷의 일관성, 신뢰를 해치는 모호한 상태 표시, 규제·표현 위험.
- **파급 영향** — 토큰/컴포넌트 변경이 의존하는 다른 컴포넌트·앱에 미치는 영향. breaking change 여부와 Changeset 필요성.
- **과장·추정 금지** — 데이터·근거 없이 "이게 더 낫다"고 단정하지 않는다. 확신 못 하는 부분은 미해결 질문으로 남긴다.

## 커밋 규칙

- 커밋 메시지는 **한국어**, **Conventional Commit** 형식 (예: `feat: 툴팁 컴포넌트 추가`, `fix: 포맷 오류 수정`).
- `Co-Authored-By`를 포함하지 않는다.
- 커밋·푸시는 사용자가 요청할 때만 한다.

## Agent skills

### Issue tracker

이슈는 GitHub Issues(`gh` CLI)에서 추적한다. 외부 PR은 트리아지 표면이 아니다. `docs/agents/issue-tracker.md` 참고.

### Triage labels

기본 라벨 어휘(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)를 그대로 사용한다. `docs/agents/triage-labels.md` 참고.

### Domain docs

단일 컨텍스트 — 루트의 `CONTEXT.md` + `docs/adr/`. `docs/agents/domain.md` 참고.
