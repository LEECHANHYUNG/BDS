# 린트/포맷 = oxlint + oxfmt (Biome supersede)

> Supersedes [ADR-0004](0004-monorepo-skeleton-stack-pnpm-turbo-biome-changesets.md)의 린트/포맷 결정. pnpm, Turborepo, Changesets 결정은 그대로 유지한다.

ADR-0004는 Biome v2를 조건부 확정했다. 제품 합리성만 보면 그 판단은 여전히 강하다. 이번 재조사(`docs/research/lint-format-toolchain.md`)도 "Biome 유지가 합리적"이라는 잠정 결론을 냈다. 그럼에도 **조사는 Biome 유지였으나 학습 동기로 의식적으로 뒤집었다.** 실제 결정 축은 속도나 룰 우위가 아니라 **현업 oxc 전환 대비 운영·유지보수 감각 습득**이다.

지금은 컴포넌트 코드가 0줄이라 전환 비용이 가장 낮다. 재포맷 diff, CodeRabbit 재조정, 린트 룰 충돌을 실제 제품 코드가 생기기 전에 처리할 수 있다.

## Decision

- Biome을 완전히 제거하고, 린트는 **oxlint**, 포맷은 **oxfmt**로 분리한다.
- oxlint 설정은 공식 자동 탐색과 CodeRabbit 정합을 위해 `.oxlintrc.json`을 쓴다. 파일 안에는 JSONC 주석을 유지한다. 플러그인은 `react`, `jsx-a11y`, `typescript`, `import`를 켜고, 카테고리는 `correctness`만 `error`로 둔다.
- oxfmt 설정은 `.oxfmtrc.jsonc`를 쓴다. 기존 Biome 스타일과 맞는 double quote, space indent를 유지하고, oxc 기본 운영 감각을 익히기 위해 `printWidth: 100`을 명시한다.
- `oxfmt`는 0.x 포맷 변동 잡음을 줄이기 위해 exact 버전으로 고정한다. `oxlint`는 stable/SemVer 라인이므로 캐럿을 허용한다.
- `pnpm check`는 비파괴 검증 전용으로 둔다. 코드 0줄 상태에서 oxlint가 "No files found"로 실패하지 않도록 `--no-error-on-unmatched-pattern`을 붙인다.
- CodeRabbit은 `tools.oxc.enabled: true`, `tools.biome.enabled: false`로 맞춘다. CodeRabbit의 oxlint 키는 `oxc`이며, Biome이 켜져 있으면 oxlint가 돌지 않는다.

## Considered Options

- **Biome 유지**: 조사 잠정 결론이자 제품 합리성 기준의 최선안이었다. 단일 도구, 안정된 포매터, 낮은 운영비가 장점이다. 하지만 이번 결정의 핵심 목적이 oxc 운영 학습이고, 코드 0줄인 지금이 전환 비용 최저점이라 기각한다.
- **Biome + oxlint 병행**: 포매터 안정성과 oxlint 학습을 일부 얻을 수 있다. 그러나 운영 면적이 늘고 신호가 중복된다. "Biome 완전 제거"라는 학습 목적도 흐려져 기각한다.
- **ESLint + Prettier 복귀**: 플러그인 생태계는 넓지만 설정과 실행 비용이 커진다. 색 대비 같은 핵심 접근성 검증은 정적 린트가 아니라 axe-core/Storybook 영역이라 이번 전환 이유가 되지 않는다.

## Consequences

- 공개 컴포넌트 API나 토큰 구조에는 영향이 없다. 변경 표면은 루트 스크립트, 설정 파일, CodeRabbit, 문서다.
- oxfmt는 아직 1.0이 아니다. 포매터는 의미를 바꾸지 않고 diff로 즉시 드러난다는 점을 근거로 리스크를 낮게 평가하되, 변경이 반복적으로 흔들리면 되돌릴 수 있어야 한다.
- type-aware 린트는 지금 도입하지 않는다. 실제 비동기·제네릭 API가 생겨 필요가 확인되면 ESLint 타입 룰 보조를 별도로 검토한다.
- 접근성 정적 룰은 oxlint `jsx-a11y`로 시작한다. 색 대비와 실제 키보드 동작은 정적 린트가 아니라 axe-core/Storybook a11y 검증에서 다룬다.

## 재평가 트리거

- **A. oxfmt 안정성**: oxfmt 1.0 stable이 장기간 나오지 않거나 0.x 포맷 깨짐·대량 diff가 반복되면 Biome 복귀 또는 oxfmt만 Prettier 교체를 검토한다.
- **B. type-aware 필요**: 비동기 흐름, 복잡한 제네릭 API, 타입 기반 안전 규칙이 실제로 필요해지면 ESLint 타입 룰 보조를 추가한다.
- **C. a11y 부족 실측**: 첫 컴포넌트 구현 후 oxlint `jsx-a11y`가 필요한 정적 접근성 문제를 놓친다는 증거가 나오면 개별 룰 추가 또는 ESLint `jsx-a11y` 보조를 검토한다.
