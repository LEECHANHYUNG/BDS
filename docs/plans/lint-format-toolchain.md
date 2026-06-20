# Plan: 린트/포맷 노선 전환 — Biome 제거 → oxlint + oxfmt

> 작성: 2026-06-20 · 상태: **구현 완료 — Codex 실행 완료**
> 조사: [`docs/research/lint-format-toolchain.md`](../research/lint-format-toolchain.md) (그릴링 결정 블록 포함)
> 결정 근거: 학습 동기(현업 oxc 운영 대비) + 코드 0줄 타이밍. 제품 합리성만 보면 Biome 유지였으나 의식적으로 oxc 채택.

## 1. 개요 / 목표

현재 Biome v2 단일 도구로 잡던 린트·포맷을 **oxlint(린트) + oxfmt(포맷) 2도구**로 전면 교체한다. Biome 흔적(의존성·설정·스크립트·CodeRabbit 설정·ADR)을 모두 정리하고, 이번 결정을 **ADR-0008로 supersede** 기록한다.

**완료 기준(Definition of Done):**

- `pnpm lint`·`pnpm format`·`pnpm format:check`가 oxlint/oxfmt로 동작하고, 레포 전체에서 통과(현재 코드 0줄이라 사실상 빈 통과여도 명령 자체는 성공해야 함).
- Biome 관련 파일·의존성·CodeRabbit 키가 전부 제거/교체됨.
- ADR-0004에 supersede 표기, ADR-0008 신설, ADR-0007/CodeRabbit 정합.
- `pnpm-lock.yaml`이 oxlint/oxfmt로 갱신되고 깨진 참조 없음.

## 2. 접근 방식

### 2-1. 도구 구성 (조사로 확정한 사실)

- **oxlint** — `pnpm add -Dw oxlint`. CLI `oxlint`. 기본 켜지는 카테고리는 `correctness`. 플러그인은 `plugins` 배열에 native 이름(`react`, `jsx-a11y`, `typescript`, `import`)으로 추가.
- **oxfmt** — `pnpm add -Dw oxfmt`. CLI `oxfmt`. **write가 기본 동작**(`oxfmt .`), CI 검증은 `oxfmt --check`. zero-config로도 동작. 옵션명은 Prettier 호환(`printWidth`/`tabWidth`/`semi`/`singleQuote`/`trailingComma` 등).
- **설정 파일 형식 — 둘 다 JSONC로 통일.** (← 노트 응답)
  - oxlint가 인식하는 설정 파일: `.oxlintrc.json` / `oxlintrc.json` / `.oxlintrc` / `oxlint.json` (모두 JSON이며 **JSONC 주석 허용**) 또는 `oxlint.config.ts`.
  - oxfmt가 인식하는 설정 파일: `.oxfmtrc.json` / **`.oxfmtrc.jsonc`** / `oxfmt.config.ts`.
  - → JSON이 유일한 형식이 아니다. 둘 다 JSON/JSONC/TS를 지원한다. **이 레포는 "왜 이 룰을 켰는지" 근거를 설정 파일 주석으로 남기는 문서화 철학**(판단을 기록)을 따르므로 주석 가능한 형식으로 둔다. oxlint는 공식 자동 탐색·CodeRabbit 정합을 위해 `.oxlintrc.json`을 쓰고 JSONC 주석을 유지한다. oxfmt는 `.oxfmtrc.jsonc`를 쓴다. TS 설정은 지금 불필요(타입 안전 설정이 필요할 만큼 룰이 복잡하지 않음).
- **루트 단일 설정.** 패키지 0개이므로 루트 설정 하나로 시작. (모노레포 nested config는 자동 병합 안 됨 → 패키지 생기면 그때 `extends`로 확장. 지금은 보류.)
- 출처: oxc.rs 공식 docs (조사 문서 §3 + 추가 조사 참조).

### 2-2. 기존 Biome 설정과의 매핑 (스타일 연속성)

현 `biome.json`: indent=space, quoteStyle=double. **oxfmt 기본값과 비교:**
| 항목 | Biome 현재 | oxfmt 기본 | 결정 |
|---|---|---|---|
| 들여쓰기 | space | space(useTabs:false) | 일치 — 그대로 |
| 인용부호 | double | double(singleQuote:false) | 일치 — 그대로 |
| printWidth | (Biome 기본 80) | **100** | ⚠️ 차이. 아래 §5 트레이드오프 참조 |

→ printWidth만 의식적 결정이 필요(80 유지 vs oxfmt 기본 100 수용). **(가정)** 코드 0줄이라 어느 쪽이든 재포맷 충격 없음.

### 2-3. CodeRabbit 전환 (조사로 확정한 함정)

- CodeRabbit은 oxlint를 **`reviews.tools.oxc` 키**로 네이티브 지원 (키 이름이 `oxlint` 아님).
- **결정적 제약:** CodeRabbit은 _"Biome가 enabled면 oxlint를 안 돌린다."_ 또한 oxlint config 파일(`.oxlintrc.json`)이 레포에 있어야 돈다.
- → `.coderabbit.yaml`에서 `tools.biome.enabled: false` + `tools.oxc.enabled: true`로 교체하고, ADR-0007 본문(Biome 전제 서술)을 oxc 기준으로 갱신.
- 출처: docs.coderabbit.ai/tools/oxlint, coderabbit.ai/integrations/schema.v2.json.

### 2-4. ADR 기록 (역사 보존)

- **ADR-0004 수정 안 함.** 상단에 `> **Superseded by [ADR-0008]**` 한 줄만 추가(역사 보존).
- **ADR-0008 신설** — "린트/포맷 = oxlint + oxfmt (Biome supersede)". 조사 잠정 결론(Biome 유지)을 _알고도_ 학습 동기로 뒤집은 트레이드오프, 재평가 트리거 A·B·C를 박제.
- **ADR-0007** — Biome 전제 서술(profile chill 근거의 "Biome이 스타일을 잡으므로" 등)을 oxlint 기준으로 갱신. CodeRabbit `tools` 변경 사유를 Consequences에 추가.

## 3. 변경 파일 경로

| 파일                                   | 변경                                                                                                               | 비고                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `package.json`                         | `@biomejs/biome` 제거, `oxlint`+`oxfmt` 추가; `format`/`check` 스크립트 교체, `lint`는 turbo→oxlint 직접 호출 검토 | 아래 §4 스니펫                                                          |
| `biome.json`                           | **삭제**                                                                                                           |                                                                         |
| `.oxlintrc.json`                       | **신설**                                                                                                           | plugins(react·jsx-a11y·typescript·import)+correctness, 주석으로 룰 근거 |
| `.oxfmtrc.jsonc`                       | **신설**                                                                                                           | double quote·space·printWidth(결정 필요)                                |
| `.coderabbit.yaml`                     | `tools.biome:false`+`tools.oxc:true`, profile 근거 주석 갱신                                                       |                                                                         |
| `turbo.json`                           | `lint`/`check` 태스크가 oxc 명령과 맞는지 점검 (현재 빈 태스크라 영향 적음)                                        |                                                                         |
| `docs/adr/0004-...md`                  | 상단 supersede 표기                                                                                                |                                                                         |
| `docs/adr/0007-...md`                  | Biome→oxlint 서술 갱신 + CodeRabbit tools 변경 근거                                                                |                                                                         |
| `docs/adr/0008-...md`                  | **신설**                                                                                                           | 본 결정 박제                                                            |
| `docs/research/monorepo-foundation.md` | line 77 "oxfmt beta 시기상조" → ADR-0008로 결정 변경됐다는 주석                                                    | 모순 해소                                                               |
| `pnpm-lock.yaml`                       | 의존성 교체 자동 갱신                                                                                              | `pnpm install`로                                                        |
| `PROJECT.md`                           | Decisions/Handoff Log 갱신                                                                                         | implement-phase에서                                                     |

## 4. 코드 스니펫 (실제 확인 기반)

### `package.json` scripts (현재 → 변경안)

현재:

```json
"lint": "turbo run lint",
"format": "biome format --write .",
"check": "biome check --write .",
```

변경안 (확정):

```json
"lint": "oxlint --no-error-on-unmatched-pattern",
"lint:fix": "oxlint --fix --no-error-on-unmatched-pattern",
"format": "oxfmt .",
"format:check": "oxfmt --check .",
"check": "oxlint --no-error-on-unmatched-pattern && oxfmt --check ."
```

> `check` = **검증 전용(비파괴)** 으로 확정(§5). 수정은 `lint:fix`(oxlint 자동수정) + `format`(oxfmt in-place)으로 분리. 코드 0줄 레포에서 `oxlint`가 "No files found"로 실패하지 않도록 `--no-error-on-unmatched-pattern`만 붙인다. 검증이 비파괴여야 향후 CI에 그대로 올릴 수 있다.

### `.oxlintrc.json` (신설안)

```jsonc
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  // react/jsx-a11y는 DS 접근성의 정적 1차 방어선. typescript/import는 라이브러리 안전성.
  "plugins": ["react", "jsx-a11y", "typescript", "import"],
  // 지금은 correctness만. suspicious/pedantic은 컴포넌트 실측 후 트리거 C에서 판단(§5).
  "categories": { "correctness": "error" },
}
```

> jsx-a11y 플러그인을 명시적으로 켜는 게 이 DS의 핵심(접근성). 컴포넌트 0개라 지금은 잡을 게 없지만 첫 컴포넌트 때 바로 작동하도록 미리 켠다.

### `.oxfmtrc.jsonc` (신설안)

```jsonc
{
  // Biome 스타일 연속성: double quote + space indent
  "singleQuote": false,
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 100, // ⚠️ Biome 기본 80과 다름 — §5 결정
}
```

### `.coderabbit.yaml` tools (변경)

```yaml
tools:
  oxc:
    enabled: true # oxlint. .oxlintrc.json 존재 + biome disabled 시 동작
  biome:
    enabled: false # Biome 제거 (ADR-0008)
  gitleaks:
    enabled: true
  markdownlint:
    enabled: false
```

## 5. 고려사항 / 트레이드오프 (결정 확정)

- **printWidth → `100` 확정.** oxfmt 기본값(100)을 수용한다. Biome는 80이었으나 코드 0줄이라 재포맷 충격 없고, oxc 생태계 기본을 따르는 게 "oxc 운영 감각" 학습 동기에 부합하고 설정도 최소화된다. → `.oxfmtrc.jsonc`에서 `printWidth`를 **명시하지 않거나(zero-config로 100) 100을 명시**. (명시 쪽 채택 — 의도를 박제.)
- **`check` 스크립트 → 검증 전용(비파괴) 확정.** `check`는 `oxlint --no-error-on-unmatched-pattern && oxfmt --check`로 **수정하지 않고 검증만** 한다. 수정은 `lint:fix`+`format`으로 분리. 근거: 검증이 비파괴여야 향후 CI 단계에 그대로 올릴 수 있다(파괴적 check는 CI에서 못 씀).
- **oxlint 엄격도 → 지금은 `correctness`만 확정.** `suspicious`/`pedantic`은 컴포넌트가 생겨 실측한 뒤 트리거 C(a11y/룰 부족 실측)에 묶어 판단. 지금 박으면 잡을 코드 없는 죽은 설정.
- **turbo `lint` 태스크 → 지금은 변경 최소 확정.** 루트 `pnpm lint`=oxlint 직접 호출로 두고, **실질 코드(패키지)가 추가되면** turbo 파이프라인 편입을 검토. (`turbo.json`은 빈 `lint`/`check` 태스크 유지.)
- **oxfmt 버전 → 정확 버전 고정 확정.** `oxfmt`를 캐럿(`^`)이 아니라 **정확 버전(예: `0.55.0`)으로 핀 고정**해 0.x 마이너 업데이트의 포맷 스타일 변동 잡음을 차단. (oxlint는 stable이므로 캐럿 허용 — 단 일관성 위해 oxlint도 고정할지는 §6 참고.)
- **파급 영향(접근성/데이터 표시).** 이번 변경은 도구 교체라 컴포넌트 API·토큰엔 직접 영향 없음. 단 a11y 정적 룰 책임이 Biome→oxlint jsx-a11y로 이동 — 커버리지는 조사상 동률이라 후퇴 없음. 색 대비는 어차피 axe-core/Storybook 몫(변동 없음).

## 6. 할 일 목록 (확정)

> 위→아래 순서로 진행. 각 작업은 검증 게이트가 통과해야 다음으로 넘어간다.

### A. 의존성 교체

- [x] A1. `pnpm remove @biomejs/biome` (루트 devDep에서 제거) — 검증: `package.json`에 `@biomejs/biome` 없음
- [x] A2. `pnpm add -Dw oxlint` (캐럿 허용 — oxlint는 stable/SemVer라 마이너 업데이트가 린트를 안 깨고 룰 개선을 받음)
- [x] A3. `pnpm add -DwE oxfmt`(또는 정확 버전 명시) — **정확 버전 고정**(`-E`/exact)으로 0.x 포맷 변동 잡음 차단. 검증: `package.json`의 oxfmt가 `^` 없이 정확 버전(예: `0.55.0`)
- [x] A4. `pnpm install` 후 `pnpm-lock.yaml` 갱신 — 검증: lock에 biome 흔적 없음, oxlint/oxfmt 존재

### B. 설정 파일

- [x] B1. `biome.json` 삭제 — 검증: 파일 없음
- [x] B2. `.oxlintrc.json` 신설 (plugins: react·jsx-a11y·typescript·import / categories.correctness:error / 룰 근거 주석) — 검증: 로컬 `oxlint --config .oxlintrc.json` 또는 `oxlint`가 설정을 에러 없이 파싱
- [x] B3. `.oxfmtrc.jsonc` 신설 (singleQuote:false / useTabs:false / tabWidth:2 / printWidth:100 + 주석) — 검증: `oxfmt --check .`가 설정을 에러 없이 읽음

### C. 스크립트 & 동작 검증

- [x] C1. `package.json` scripts 교체 (lint/lint:fix/format/format:check/check — §4 확정안) — 검증: 아래 C2~C4
- [x] C2. `pnpm lint` 성공 (코드 0줄이라 빈 통과여도 명령 exit 0)
- [x] C3. `pnpm format` 성공 (in-place, oxfmt 기준 포맷 diff 발생해 커밋 포함)
- [x] C4. `pnpm check` 성공 (oxlint + oxfmt --check, 비파괴)

### D. CodeRabbit 정합

- [x] D1. `.coderabbit.yaml` `tools.biome.enabled:false` + `tools.oxc.enabled:true` 교체 — 검증: yaml 스키마 유효, oxc 키 사용(oxlint 아님)
- [x] D2. `.coderabbit.yaml` profile 근거 주석(line 10~11 "Biome이 ... 잡으므로")을 oxlint 기준으로 갱신

### E. ADR / 문서 정합 (역사 보존)

- [x] E1. `docs/adr/0004-...md` 상단에 `> **Superseded by [ADR-0008](0008-...md)**` 표기 (본문은 보존)
- [x] E2. `docs/adr/0008-lint-format-oxc.md` 신설 — 결정/근거(학습 동기 + 코드 0줄 타이밍, 조사는 Biome 유지였으나 의식적으로 뒤집음)/Considered Options(Biome 유지)/재평가 트리거 A·B·C
- [x] E3. `docs/adr/0007-...md` Biome 전제 서술(profile chill 근거·tools.biome) → oxlint 기준으로 갱신 + Consequences에 tools 변경 사유
- [x] E4. `docs/research/monorepo-foundation.md:77` "oxfmt beta 시기상조" 줄에 "→ ADR-0008에서 학습 동기로 oxc 채택 결정" 주석

### F. 현황판

- [x] F1. `PROJECT.md` Decisions에 oxc 전환 결정 1줄, Handoff Log에 변경/검증/next 1줄, Goal 갱신

### 재평가 트리거 (ADR-0008에 박제 — 작업 아님, 미래 조건)

- **A**: oxfmt 1.0 stable 안 되고 0.x 정체/포맷 깨짐 반복 → Biome 복귀 또는 oxfmt만 Prettier 교체 검토
- **B**: type-aware 린트가 실제 필요해짐(비동기·복잡 제네릭 API) → ESLint 타입 룰 보조 추가
- **C**: a11y 정적 룰이 oxlint에서 부족하다 실측 → 개별 룰 추가 또는 ESLint jsx-a11y 보조
