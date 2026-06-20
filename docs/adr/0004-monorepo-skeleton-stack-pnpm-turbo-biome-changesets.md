# 모노레포 골격 스택 = pnpm + Turborepo + Biome + Changesets (의사결정 기반 재확인)

기존 골격은 조사(`docs/research/monorepo-foundation.md`)는 거쳤으나 **사용자의 명시적 의사결정 없이 Codex가 일단 깔아둔** 상태였다. 이 ADR은 각 도구 선택을 이 프로젝트 고유 제약(ADR-0001 C>A>B·공개 publish, ADR-0002 L1/L2, ADR-0003 dogfooding)에 비춰 하나씩 재검토하고 **의식적으로 확정**한 기록이다. 결론적으로 4종 모두 유지하되, 그 근거를 박제한다.

- **패키지 매니저 = pnpm 10.** `catalog`로 다패키지 간 공통 의존성(React/TS) 버전 드리프트를 차단하고, `workspace:` 프로토콜이 publish 시 실버전으로 자동 치환된다. 공개 npm publish가 산출물(ADR-0001)이라 이 두 가지가 "버전 일관성 있는 라이브러리"라는 신뢰로 직결된다. npm은 catalog가 없어 미충족, yarn berry는 가능하나 PnP 호환성 리스크와 생태계 열위.
- **빌드 오케스트레이터 = Turborepo.** `build: dependsOn:["^build"]`가 dogfooding 구조(데모 앱이 라이브러리를 빌드 후 소비)를 태스크 그래프로 그대로 표현한다. 우리 규모는 패키지 2개 + 데모 앱 — Nx의 코드 생성기·모듈 경계 강제는 이 규모에선 순전히 비용이며 ADR-0001 "B(인프라)에 시간 쏟지 마라"에 위배된다.
- **린트/포맷 = Biome v2 (조건부 — 아래 Consequences).** 올인원·고속·설정 최소가 ADR-0001 B 비용 최소화와 부합. a11y 정적 룰은 ESLint `jsx-a11y` 세트보다 좁다는 트레이드오프가 있으나, 컴포넌트 0개인 현 시점에 그 부족분은 추정일 뿐이다.
- **버저닝/배포 = Changesets.** 공개 npm publish의 사실상 표준(변경 선언 → version PR → publish). `updateInternalDependencies: patch`가 ADR-0002의 L1→L2 의존을 배포 수준에서 반영. semantic-release는 모노레포 멀티패키지에 약하고 미유지보수.

## Considered Options

- **Nx (빌드)**: 풀 플랫폼이나 단일 목적 DS엔 과함 — B 과투자로 기각.
- **ESLint v9 + Prettier (린트)**: `jsx-a11y` 전체 세트가 매력적이나 설정 복잡·속도 저하·두 도구 관리. 조사 에이전트가 "ESLint면 색 대비가 잡힌다"고 주장했으나 **부정확** — `color-contrast`는 jsx-a11y에도 없고, 대비 검증은 정적 린트가 아니라 axe-core/Storybook a11y의 몫이다. 양쪽 다 못 잡는 항목이므로 ESLint 전환의 실익이 약해 기각.
- **npm / yarn (패키지 매니저)**: catalog·workspace 치환 요구를 충족 못 하거나 호환성 리스크로 기각.

## Consequences

- **Biome 결정은 조건부다.** 첫 컴포넌트 패키지를 추가하는 시점에 a11y 정적 룰 부족분을 **실측**하고, 부족하면 ESLint를 *보조 린터로* 얹는다(Biome는 포맷·기본 린트 유지). 색 대비 등 렌더 기반 접근성은 axe-core + Storybook a11y addon으로 검증한다. 이 후속 트리거는 ADR-0006에도 기록한다.
- 4종 모두 현재 "설정만" 최소 상태다. 고급 기능(원격 캐시, 복잡한 changeset 그룹 등)은 필요 시점에 점진 추가한다.
