# Research: 금융 디자인 시스템 모노레포 기반 환경 구성

> 작성: 2026-06-07 · 상태: 검토 대기
> 조사 축: **웹 조사 중심** (코드베이스는 백지 상태이므로 가볍게 확인)

## 1. 조사 범위 & 질문

금융 도메인 React 디자인 시스템을 **모노레포로 구성**하려 한다. 아직 어떤 툴도 정하지 않았고,
**지금은 컴포넌트를 추가하는 단계가 아니라 환경(골격)만 구성하는 단계**다. 따라서
"컴포넌트가 0개여도 먼저 깔아야 하는 최소 필수 요소"가 무엇인지를 핵심으로 조사했다.

답하려는 핵심 질문:
1. **패키지 매니저** — pnpm / npm / yarn workspaces 중 2026년 디자인 시스템 모노레포의 사실상 표준은?
2. **빌드 오케스트레이션** — Turborepo vs Nx, 디자인 시스템에 적합한 쪽은?
3. **컴포넌트 라이브러리 번들러** — tsup / tsdown / Vite / rollup 중 publishable React 라이브러리에 권장되는 것은? (지금 당장 쓰진 않지만 패키지 골격에 영향)
4. **디자인 토큰 파이프라인 & 스타일링 전략** — DTCG 표준 현황, Style Dictionary, zero-runtime CSS 전략은?
5. **품질/문서/배포 도구** — 린트·포맷, 버저닝(Changesets), 문서화(Storybook), 테스트의 2026년 표준과, 그중 "환경 구성 단계"에서 먼저 세팅할 것은?

> 참고: 각 도구 버전·deprecation은 1차 출처(공식 릴리스 노트/GitHub)로 확인했으며, 일부 블로그가 인용하는 구버전과 충돌하는 경우 1차 출처를 신뢰했다.

## 2. 코드베이스 분석

현재 작업 디렉터리 `/Users/chanhyung/BDS`는 **사실상 백지 상태**다.
- 존재하는 것: `.claude/`(스킬·설정)뿐. `package.json`, 워크스페이스 설정, 소스 코드 없음.
- 즉, 기존 토큰/컴포넌트/네이밍 컨벤션/상태 관리 레이어가 **아직 없으므로** 신규 결정에 제약이 없다.
- `docs/research/` 디렉터리를 이번 조사를 위해 새로 생성했다.

→ 코드베이스 측 맞물림 이슈는 없으며, 결정은 전적으로 외부 모범 사례 + 금융 도메인 요구에 따라 정한다.

## 3. 외부 조사 — 최신 동향 & 모범 사례 (2026-06 기준)

### 3-1. 패키지 매니저
- **pnpm workspaces — 사실상 표준.** 최신 **pnpm 10.29 (2026-02-07)**. deprecated 아님, 가장 빠르게 성장.
  - `workspace:` 프로토콜로 내부 패키지 참조, publish 시 실제 버전 자동 치환.
  - **catalog** 기능(`pnpm-workspace.yaml`에 의존성 버전 단일 정의 → 각 패키지가 `catalog:`로 참조): 패키지가 많은 디자인 시스템의 **버전 드리프트 방지에 핵심**. (pnpm 9.5 도입, 10.29에서 확장)
  - 출처: [pnpm 10.29 릴리스](https://pnpm.io/blog/releases/10.29), [pnpm Catalogs](https://pnpm.io/catalogs), [pnpm Workspaces](https://pnpm.io/workspaces)
- **Yarn Berry(v4)** — 유효하나 비주류(PnP 호환성 이슈). **Yarn Classic(v1)** — 사실상 EOL/동결(마지막 1.22.22, 2024-03), **신규 사용 금지 권장**. ([endoflife.date/yarn](https://endoflife.date/yarn))
- **npm workspaces** — 동작하나 catalog/constraints 같은 고급 기능 없어 1순위 아님.

### 3-2. 빌드 오케스트레이션
- **Turborepo — 디자인 시스템 모노레포에 적합.** 최신 **2.9.x (2026-03-30)**. Go→Rust 재작성으로 콜드스타트 개선.
  - **Vercel Remote Cache가 전 플랜 무료**(`turbo login && turbo link`). 단순·저학습곡선, 5~50 패키지 규모 JS/TS 팀에 권장.
  - Vercel 공식 `turborepo-design-system` 템플릿이 정확히 이 스택(pnpm + Turborepo + tsup + Changesets) 제공.
  - 출처: [Turborepo 2.9 블로그](https://turborepo.dev/blog/2-9), [Remote Caching 문서](https://turborepo.dev/docs/core-concepts/remote-caching), [Vercel Design System 템플릿](https://vercel.com/templates/react/turborepo-design-system)
- **Nx** — 최신 **22.7.5 (2026-05-27)**. 풀 플랫폼(코드 생성기·모듈 경계 강제·프레임워크 플러그인). **대규모 엔터프라이즈/멀티프레임워크**에 적합하나, 순수 React 디자인 시스템 단일 목적에는 과함. self-hosted 캐시 정책 변동 이력 주의.
  - 출처: [Turborepo vs Nx 2026 — PkgPulse](https://www.pkgpulse.com/guides/turborepo-vs-nx-monorepo-2026)

### 3-3. 디렉터리 컨벤션
- `apps/`(문서 사이트·Storybook·소비 앱), `packages/`(발행 가능 라이브러리·컴포넌트·토큰), `packages/config` 또는 `tooling/`(공유 tsconfig·ESLint·번들러 설정 중앙화).
- **공유 tsconfig 패키지**(`@repo/tsconfig`: `base.json` / `react-library.json`)를 만들어 각 패키지가 `extends`로 상속하는 것이 Turborepo 공식 패턴.
- **internal 패키지(빌드 안 함, 소스 직접 export)** vs **publishable 패키지(빌드+`exports`+dts)** 를 명확히 구분.
  - 출처: [Structuring a repository — Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository), [Internal Packages](https://turborepo.dev/docs/core-concepts/internal-packages)

### 3-4. 컴포넌트 라이브러리 번들러 (지금은 안 쓰지만 골격 결정에 영향)
- **tsup — 사실상 유지보수 중단.** GitHub README에 *"not actively maintained anymore. Please consider using tsdown instead."* 명시. 동작은 문제없고 다운로드는 여전히 크지만 **신규 권장에서 빠짐**. ([tsup GitHub](https://github.com/egoist/tsup))
- **tsdown — tsup의 공식 후계자, 강하게 부상.** egoist 본인 제작, 현재 `rolldown/tsdown`에서 관리. **Rust 기반 Rolldown** 위에서 동작(빌드 3~10배 빠름). 단 아직 **0.x 버전대**라 마이너 릴리스 breaking 잦음(주의). 내장 Rolldown은 v1.0.1 stable(2026-05-13).
  - 출처: [tsdown 공식](https://tsdown.dev/guide/migrate-from-tsup), [rolldown/tsdown](https://github.com/rolldown/tsdown)
- **Vite library mode** — 소규모엔 무난하나 멀티 엔트리/`use client` 보존이 까다로움. **rollup 직접** — 가장 유연하나 보일러플레이트 최다.
- **package.json `exports` 모범 사례:** `types` 조건을 각 블록에서 가장 먼저, dual이면 `.d.mts`/`.d.cts` 분리, 마지막에 `default` fallback, 와일드카드 전체 노출 금지, `sideEffects: false`(CSS 있으면 화이트리스트). **퍼블리시 전 `publint` + `attw`(Are The Types Wrong) 검증 필수.**
- **React 19 / RSC:** React·ReactDOM은 `peerDependencies`로(번들 제외), peer 범위는 넓게(`^18 || ^19`). `"use client"` 디렉티브 보존이 핵심 난제(청크 분리 또는 banner 주입). **2026 트렌드: 레거시 불필요한 신규 패키지는 ESM-only가 점점 권장.**
  - 출처: ['use client' — React 공식](https://react.dev/reference/rsc/use-client), [package.json exports 가이드](https://hirok.io/posts/package-json-exports), [TypeScript — Turborepo](https://turborepo.dev/docs/guides/tools/typescript)

### 3-5. 디자인 토큰 & 스타일링
- **W3C DTCG — 첫 안정 버전 `2025.10` (2025-10-28).** 테마(라이트/다크/접근성/멀티브랜드), 모던 색공간(OKLCH/Display P3), 토큰 alias/inheritance, 멀티파일 지원. 단 여전히 **Community Group Report 단계**(정식 W3C Recommendation 아님).
  - 출처: [DTCG 안정 버전 발표](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- **Style Dictionary v4** — DTCG를 소스 포맷으로 1급 지원, 멀티 플랫폼 출력의 사실상 표준. 대안 **Terrazzo(구 Cobalt)**(DTCG 풀 서포트), 소스 작성은 **Tokens Studio(Figma)** → `sd-transforms`로 SD 파이프라인 연결.
  - 출처: [Style Dictionary DTCG](https://styledictionary.com/info/dtcg/), [Style Dictionary v4](https://styledictionary.com/versions/v4/statement/)
- **스타일링 전략 — 런타임 CSS-in-JS는 신규 프로젝트에선 사실상 종료(RSC 비호환·성능).**
  - **styled-components — 2025-03 유지보수 모드 진입(신규 기능 중단).** **Emotion** — 동일 한계. **신규 채택 비권장.**
  - zero-runtime + RSC 호환 권장군: **Panda CSS**(Chakra 팀, TS-first, 시맨틱 토큰·자동 라이트/다크 — 헤비 테마/디자인 시스템에 강력), **vanilla-extract**(타입 안전, 단 성장 정체), **Tailwind v4**(Oxide 엔진, 최대 생태계·속도), **StyleX**(Meta, 최대 스케일), **CSS Modules**(조용한 표준, 오버헤드 0).
  - 출처: [State of CSS-in-JS 2026 — PkgPulse](https://www.pkgpulse.com/blog/state-of-css-in-js-2026), [styled-components 유지보수 모드 — Sanity](https://www.sanity.io/blog/cut-styled-components-into-pieces-this-is-our-last-resort), [Panda vs Tailwind 2026](https://www.pkgpulse.com/guides/panda-css-vs-tailwind-2026)

### 3-6. 품질 / 문서 / 배포
- **린트/포맷:**
  - **ESLint v9**(flat config 기본, `.eslintrc` deprecated) — 플러그인 생태계(react/jsx-a11y/storybook) 필요 시 우위.
  - **Biome v2**("Biotype", 2025-06 stable / 2026-05 v2.4.15) — 린터+포매터 통합, type-aware 룰, ESLint 대비 10~20배. 신규 올인원 대안.
  - **oxlint(oxc) v1.65** — 최고속, CI 가속기로 병행 권장. **oxfmt** — 2026-06 현재 **beta(1.0 미도달)**, Prettier 100% 적합성 통과하나 **즉시 채택은 시기상조**.
  - 출처: [Biome vs ESLint vs Oxlint 2026](https://www.pkgpulse.com/guides/biome-vs-eslint-vs-oxlint-2026), [Oxfmt Beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta)
- **버저닝/배포: Changesets — 2026년에도 모노레포 사실상 표준.** 변경 영향을 파일로 선언 → version PR → npm publish(GitHub Action) 정석 흐름. pnpm 공식 문서가 Changesets 전제. (semantic-release-monorepo는 미유지보수.)
  - 출처: [changesets/changesets](https://github.com/changesets/changesets)
- **문서화: Storybook — 최신 v10.4.x** (질문의 v8/v9가 아니라 **v10이 현행**). v9 대비 번들 절반, Vitest 4 풀 지원, `@storybook/addon-vitest`로 인터랙션/a11y(WCAG)/시각 테스트 통합. 대안 Ladle(React 전용·경량)·Histoire(Vue 중심)는 폐기는 아니나 생태계 열위. **표준은 Storybook.**
  - 출처: [Storybook versions](https://storybook.js.org/versions), [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
- **테스트: Vitest(v4) 권장 기본값**(Jest 대비 cold start 2배·watch 8.5배). Testing Library + Vitest browser mode 또는 Playwright CT. **시각 회귀는 Chromatic 표준**(Storybook 연동).
  - 출처: [Jest vs Vitest 2026](https://getautonoma.com/blog/jest-vs-vitest-2026)

## 4. 종합 발견 & 권장 방향

### 4-1. "환경 구성 단계" 최소 필수 4종 (컴포넌트 0개여도 즉시 필요)
컴포넌트가 없어도 가치가 있고, 나중에 추가할수록 비용이 커지는 **골격**부터 세팅한다.

| 우선순위 | 요소 | 권장 도구 | 이유 |
|---|---|---|---|
| 1 (필수) | 모노레포 골격 | **pnpm workspace + Turborepo** | 패키지 경계·태스크 그래프·캐싱 토대. 컴포넌트 유무 무관하게 먼저 정해야 함 |
| 2 (필수) | 린트 + 포맷 | **Biome v2**(올인원) 또는 **ESLint v9 flat + Prettier** | 코드 한 줄부터 일관성 강제. oxfmt는 beta라 보류 |
| 3 (필수) | 버저닝/릴리스 | **Changesets** | 첫 패키지 publish 전에 깔아두는 것이 정석 |
| 4 (권장) | 테스트 러너 골격 | **Vitest** (설정만) | CI 파이프라인에 자리 확보 |
| 5 (나중) | 문서/개발 환경 | **Storybook 10** (방향만) | 컴포넌트 생기는 시점에 본격화 |
| 6 (마지막) | 시각 회귀 | **Chromatic** | 스토리 생긴 뒤 연결 |

→ **즉시 깔 4종: pnpm workspace + Turborepo + (Biome | ESLint+Prettier) + Changesets.**
Vitest는 골격만, Storybook/Chromatic은 컴포넌트가 생긴 뒤 채운다.

### 4-2. 권장 스택 종합
- **패키지 매니저:** pnpm 10.x (catalog로 React/TS 등 공통 버전 단일화)
- **빌드 오케스트레이터:** Turborepo 2.9.x (무료 원격 캐시)
- **디렉터리:** `apps/` + `packages/` + `packages/config`(공유 tsconfig/lint 설정)
- **번들러(나중 컴포넌트 패키지용):** tsdown 우선 검토(단 0.x 안정성 트레이드오프) 또는 tsup 잔류 인지 후 선택 — **이 단계에선 결정만 보류해도 무방**
- **토큰 파이프라인(나중):** DTCG 2025.10 JSON(SSOT) → Style Dictionary v4 → CSS 변수 + TS 토큰
- **스타일링(나중):** zero-runtime + RSC 호환군에서 선택. 금융 헤비 테마엔 Panda CSS / vanilla-extract 유력, 생태계·속도 우선이면 Tailwind v4

### 4-3. 금융 도메인 고려사항
- **접근성: WCAG 2.2 AA가 실무 기준.** WCAG 3.0/APCA는 2026년에도 미완성(정식 Recommendation 2028~2030+ 예상) — **모니터링만**.
  - 색 대비: 본문 4.5:1, 큰 텍스트/UI 3:1, **라이트·다크 모두 충족 필요**(다크모드 제공만으로는 미충족).
  - **토큰 레벨에서 대비 강제**: 시맨틱 색 토큰에 승인된 페어링만 허용, 테마별 토큰 분리, AA 미달 시 CI hard-fail(axe-core + Lighthouse).
- **숫자/통화 표시(금융 핵심):** `font-variant-numeric: lining-nums tabular-nums`(표에서 소수점 흔들림 방지)를 **타이포 토큰에 별도 변형으로**. 값 포맷은 `Intl.NumberFormat`(currency)로 로케일별 처리.
  - 출처: [WCAG3 as of April 2026 — Adrian Roselli](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html), [fintech typography — readable money](https://medium.com/design-bootcamp/the-elements-of-fintech-typography-part-1-readable-money-b6c1226acbde), [Intl.NumberFormat — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
- **신뢰성:** 토큰/컴포넌트의 변경을 Changesets로 추적하고 Chromatic 시각 회귀로 의도치 않은 변화 차단 — 금융 UI의 시각적 신뢰성 유지에 직결.

### 4-4. 트레이드오프
- **Biome 올인원 vs ESLint+Prettier:** Biome는 설정 최소·고속이나 jsx-a11y 등 일부 전문 룰/플러그인 커버리지가 ESLint 생태계보다 좁을 수 있음. 금융 접근성 룰(jsx-a11y) 의존이 크면 ESLint v9 + Prettier가 안전.
- **Turborepo vs Nx:** 단일 목적 디자인 시스템엔 Turborepo가 단순·충분. 다만 향후 멀티 앱/멀티 프레임워크로 확장 계획이 크면 Nx의 구조 강제가 이득일 수 있음.
- **tsdown(빠름·미래지향, 0.x 불안정) vs tsup(안정·큰 커뮤니티, 유지보수 중단):** 둘 다 트레이드오프가 있어 컴포넌트 빌드를 실제로 시작하는 시점에 재평가가 합리적.
- **ESM-only vs dual(ESM+CJS):** 신규·웹 중심이면 ESM-only가 단순하나, CJS 소비자(레거시 Next/도구) 지원이 필요하면 dual. 소비자 범위 정의가 선행돼야 함.

## 5. 미해결 질문 / 개발자 검토 필요 지점

1. **린트/포맷 노선** — Biome 올인원(속도·단순) vs ESLint v9 + Prettier(접근성 플러그인 생태계). 금융 접근성(jsx-a11y) 비중에 따라 결정 필요. → 의사결정 필요.
2. **스타일링 전략** — 환경 구성 단계에선 보류 가능하나, 디렉터리/토큰 출력 형태에 영향. Panda CSS / vanilla-extract / Tailwind v4 중 방향성은 일찍 정해두는 게 유리. → 검토 필요.
3. **번들 포맷(ESM-only vs dual)** — 라이브러리 소비자 환경(Next.js 버전, RSC 사용 여부, 사내 레거시 번들러)을 알아야 결정 가능. → 소비처 정보 필요.
4. **RSC 대응 범위** — 컴포넌트를 RSC(서버 컴포넌트) 환경에서도 쓸 계획인지에 따라 `"use client"` 처리·번들 전략이 달라짐. → 확인 필요.
5. **원격 캐시/CI** — Turborepo Remote Cache(Vercel 무료) 사용 여부, CI 플랫폼(GitHub Actions 가정). 사내 정책상 외부 캐시 사용 가능한지(금융권 보안 정책). → 보안/인프라 검토 필요.
6. **tsdown 0.x 채택 리스크** — 미래지향적이나 안정 버전 미도달. 안정성 우선 조직이면 컴포넌트 추가 시점에 재평가. → 판단 필요.
