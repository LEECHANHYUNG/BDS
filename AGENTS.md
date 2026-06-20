# AGENTS.md — Codex 작업 지침 (실행 담당)

이 레포(BDS, React 디자인 시스템)에서 Codex는 **실행(execution)** 을 맡는다. 컴포넌트 구현·토큰 빌드·스크립트 실행·문서 사이트/스토리·시각 산출이 본분이고, 조사·계획·리스크 판단은 Claude Code에 맡긴다. 역할 분담과 현황판 운영은 [`docs/collab-protocol.md`](docs/collab-protocol.md)와 [`PROJECT.md`](PROJECT.md)를 따른다.

## 기본 원칙

- **한국어로** 답변·문서·커밋 메시지를 작성한다.
- **계획을 따른다.** 기능 구현은 Claude Code가 `docs/plans/<주제>.md`에 작성하고 사람이 **승인한 계획**을 토대로 한다. 계획이 없거나 미승인이면 직접 설계로 뛰어들지 말고, Claude Code에 계획을 요청한다.
- **설계 의도를 발명하지 않는다.** 계획에 없는 API·토큰·구조를 임의로 만들지 않는다. 모호하면 핸드오프로 되묻는다.

## 실행 범위

- **컴포넌트 구현** — 승인된 계획·API 설계서대로 `packages/**`에 구현. 타입 안전(`any`/`unknown` 회피), 기존 토큰·패턴 재사용.
- **빌드 / 파이프라인** — 토큰 빌드, 번들링, 타입 체크, 테스트 실행. 재현 가능하게 스크립트로 남긴다.
- **문서 / 시각** — Storybook 스토리, 문서 사이트, 시각 회귀 스냅샷, 데모 캡처. 모두 [`DESIGN.md`](DESIGN.md)의 색상·톤 기준을 준수한다.

## 표준 작업 규약

- **패키지 매니저**: pnpm (workspace + catalog). `npm`/`yarn` 쓰지 않는다.
- **빌드 오케스트레이션**: Turborepo (`pnpm lint` 등은 turbo 경유).
- **Lint + Format**: Biome v2. 작업 후 `pnpm check`로 정리한다.
- **버저닝**: 공개 API가 바뀌면 `pnpm changeset`으로 Changeset을 남긴다(breaking 여부 명시).
- **검증 없이 완료 보고 금지.** 빌드·타입 체크·테스트를 돌려 통과를 확인한 뒤 핸드오프한다.

## 협업 절차 (Claude Code와 함께)

작업 시작·종료 시 [`PROJECT.md`](PROJECT.md)를 갱신한다.

1. **락 잡기** — 작업할 파일을 `Work Board`에 `Codex · 작업 중 ✓ locked`로 등록.
2. **Claude Code가 락 잡은 파일은 직접 수정하지 않는다** — 참고만 한다(`docs/plans/*.md` 작성 중인 계획 등).
3. **핸드오프** — 작업 종료 시 락 해제 + `Handoff Log`에 `[Codex] changed: … / verified: 빌드·테스트 … / next: Claude Code가 …` 한 줄 기록.

## 산출물 기준

- **컴포넌트**: 계획의 API를 준수, 접근성 속성 포함, 빌드·타입·테스트 통과.
- **시각 산출물**: 실제 브랜드 로고·미승인 이미지·자료 사용 금지. DESIGN.md 기준 준수, 효능·성과 과장 표현 금지.
- 상세 템플릿은 [`docs/templates.md`](docs/templates.md)를 따른다.

## 커밋 규칙

- 커밋 메시지는 **한국어**, **Conventional Commit** 형식 (예: `feat: 토스트 컴포넌트 추가`).
- `Co-Authored-By`를 포함하지 않는다.

@RTK.md
