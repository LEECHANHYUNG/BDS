# Research: zero-runtime 스타일링 엔진 선택

> 작성: 2026-06-21 · 상태: 검토 대기
> 조사 축: 코드베이스 ✅(제약은 기존 ADR/조사에서 도출) + 웹 ✅
> 선행: `docs/research/design-tokens.md` §5.5 — "스타일링 엔진을 지금 확정" 결정에 따른 후속 실측 조사

## 1. 조사 범위 & 질문

`design-tokens.md` §5.5에서 **스타일링 엔진을 토큰 뼈대 확정 전에 지금 정하기로** 결정했다. 근거: vanilla-extract `createGlobalThemeContract`의 변수명 규칙이 토큰 네이밍과 한 몸이라, 엔진을 가정하지 않으면 토큰 출력 포맷·변수명을 못 박는다. 그런데 기존 조사는 "zero-runtime 계열"까지만 좁혔지 후보를 실측 비교하지 않았다 — 이 조사가 그 공백을 채운다.

핵심 질문: **L2 고빈도 리렌더(호가창) + SD CSS 변수 소비 + RSC + publish 부담 + 타입안전**, 이 5개 제약 아래 어떤 zero-runtime 엔진이 합리적인가.

## 2. 코드베이스 분석 (제약 — 기존 결정에서 도출)

- **런타임 CSS-in-JS 탈락** — ADR-0002·0003: L2(실시간 시세·호가창)가 본체, 초당 수십 번 가격 깜빡임. styled-components/emotion 런타임은 성능상 제외. → 빌드타임 추출/zero-runtime만 후보.
- **SD CSS 변수 소비** — ADR-0005 + design-tokens.md §4.4: `@bds/tokens`가 DTCG → Style Dictionary v4+로 `--bds-*` CSS 변수 + TS를 출력. 엔진은 이 변수를 **소비**해야 하고 가능하면 타입 안전 연결.
- **primitive 직참조 금지 = semantic만 export** (design-tokens §5 결정 #3): 엔진은 `@bds/tokens`의 semantic/도메인 토큰만 본다.
- **publish 라이브러리** — ADR-0005 `@bds/react`: 소비처 빌드 설정 부담이 작을수록 좋다.
- **RSC/Next App Router 호환** 필수(2026 기준).

## 3. 외부 조사 — 후보 실측 비교 (검증일 2026-06-21)

### 비교 매트릭스 (행=제약, 열=후보)

| 제약                       | vanilla-extract               | Panda CSS                          | StyleX                         | **CSS Modules**                         | Tailwind v4           |
| -------------------------- | ----------------------------- | ---------------------------------- | ------------------------------ | --------------------------------------- | --------------------- |
| L2 고빈도 리렌더           | ◎ 정적+`assignInlineVars`     | ○                                  | ○                              | ◎ 정적+inline var, 최단순               | △                     |
| SD `--bds-*` 소비·타입연결 | ◎ `createGlobalThemeContract` | ○ `globalVars`(토큰 이중정의 우려) | ✕ 외부 변수 import 비지원      | ◎ `var(--bds-*)` 직접, 무어댑터         | △                     |
| RSC/Next App Router        | ○ (과거 experimental 이력)    | ◎ RSC-safe                         | ○ 시연 수준                    | ◎ 완전 호환                             | ◎                     |
| publish 소비처 부담        | ○ 정적 CSS 빌드 시 낮음       | △ include 스캔, 정적빌드 전략 필수 | ✕ babel-plugin 강제            | ◎ 사실상 0                              | ✕ `@source` 등록 필요 |
| 타입 안전                  | ◎ contract 객체               | ◎ 코드젠                           | ◎(외부변수 제외)               | △ 클래스명만(변수는 SD의 TS상수로 보완) | △                     |
| 유지보수 (2026.6)          | △ npm 릴리스 2025.4 정체      | ◎ 1.x 활발                         | ○ **여전히 0.18, 1.0 GA 아님** | ◎ 번들러 내장, 영속                     | ◎                     |

◎ 적합 / ○ 무난 / △ 제약 / ✕ 부적합

### 후보별 핵심 사실

- **vanilla-extract** `@vanilla-extract/css@1.20.1`, **마지막 npm 릴리스 2025.4(약 14개월 정체)**. 죽진 않음(2026 커밋 있음) 그러나 메인테이너가 "capacity 매우 부족, 진행 느림" 공식 언급 → **soft-maintenance**. `createGlobalThemeContract`로 SD `--bds-*`를 **타입 안전 1급 매핑**(최대 강점), `assignInlineVars`로 고빈도 변수 갱신. 정적 CSS 빌드 배포 시 소비처 부담 낮음. **리스크 = 릴리스 정체.**
  출처: <https://vanilla-extract.style/>, <https://github.com/vanilla-extract-css/vanilla-extract/releases>, <https://github.com/vanilla-extract-css/vanilla-extract/discussions/1144>, <https://vanilla-extract.style/documentation/packages/dynamic/>
- **Panda CSS** `@pandacss/dev@1.11.x`, **가장 활발**(Chakra 팀, CVE 패치). RSC-safe. 단 **토큰을 자기 config에 정의하는 모델 → SD를 SoT로 둔 구조와 이중정의**, DTCG 네이티브 입력 미확인. publish 시 include 스캔 모델이라 `panda ship/cssgen` 정적 빌드 전략 필수.
  출처: <https://panda-css.com/>, <https://panda-css.com/docs/guides/component-library>, <https://panda-css.com/docs/theming/tokens>
- **StyleX(Meta)** **여전히 0.18, 1.0 GA 아님.** 결정적 약점 2개: **외부 CSS 변수 import 비지원(SD SoT와 정면 충돌)** + 소비처에 babel-plugin 강제. → 부적합.
  출처: <https://stylexjs.com/blog/>, <https://github.com/facebook/stylex/discussions/227>, <https://github.com/facebook/stylex/discussions/397>
- **CSS Modules + CSS custom properties** — 번들러 내장이라 deprecation 개념 없음(영속). `var(--bds-*)` **무어댑터·무이중정의** 소비. publish 부담 사실상 0(소비처에 플러그인 강제 0). 고빈도는 정적 클래스 + `style={{'--bds-price-color': ...}}` inline 변수 갱신 → 클래스 churn 0. **약점 = variant를 cva/clsx로 수동 관리, 타입안전이 클래스명 수준**(CSS 변수는 SD가 뱉는 TS 상수로 JS측 보완).
  출처: <https://github.com/privatenumber/vite-css-modules>, <https://www.npmjs.com/package/vite-plugin-typed-css-modules>
- **Tailwind v4** 살아있으나 purge/`@source` 등록이 라이브러리 배포·시맨틱 토큰과 부조화. **Linaria** deprecated 아니나 모멘텀 약함. **styled-components** maintenance mode(런타임이라 전제대로 탈락).
  출처: <https://github.com/tailwindlabs/tailwindcss/discussions/18545>

## 4. 종합 발견 & 권장 방향

조사는 **두 후보로 압축**된다. 둘 다 SD를 진실 공급원(SoT)으로 두는 우리 구조와 충돌하지 않는다(Panda는 이중정의 충돌, StyleX는 비지원으로 탈락).

### 1순위 — CSS Modules + CSS custom properties

5개 제약 중 4개 최상. SD `--bds-*`를 무어댑터로 소비, publish 부담 0, 호가창 고빈도는 inline CSS 변수 갱신으로 런타임 0 수렴, RSC 완전 호환, 영속. **약점은 variant 수동 관리(cva) + 타입안전 클래스명 수준.** 금융 DS의 본질이 "안정성·이식성·예측 가능한 고빈도 성능"이면 이 트레이드오프는 합리적.

### 2순위 — vanilla-extract

"타입 안전한 토큰 연결 + 레시피"를 코드 레벨에서 원하면 최적. `createGlobalThemeContract`로 SD 출력 타입 안전 매핑, `assignInlineVars` 고빈도 경로 명확. **유일·결정적 리스크 = 릴리스 정체(2025.4~).** 이걸 수용하면 DX/타입안전은 CSS Modules보다 우위.

### 제품 맥락

- **고빈도 리렌더**: 두 후보 모두 "정적 클래스 + CSS 변수 inline 갱신"이 핵심 패턴 — 클래스 재계산 없이 시세 색/값만 갱신. 호가창 설계 시 이 패턴을 컴포넌트 규약으로 못 박을 것.
- **상승/하락 색**: design-tokens §5 결정대로 `price-up`/`price-down` 의미 토큰 → CSS 변수로 노출 → inline 갱신. 색 단독 금지(부호·아이콘 병기)는 컴포넌트 API 책임.
- **타입안전 격차 보완**: CSS Modules 선택 시 CSS 안에서 `var()` 오타를 못 잡는다 → SD가 뱉는 TS 상수를 JS측에서 강제하거나, stylelint 커스텀 룰로 보완 검토(미결).

## 5. 미해결 질문 / 개발자 검토 필요 지점

> ### ✅ 인라인 주석 사이클 결정 (2026-06-21 확정)
>
> - **엔진 = vanilla-extract 선정** (#1). publish 부담 0의 CSS Modules보다, `createGlobalThemeContract` 타입 안전 토큰 연결 + 레시피 DX를 택함. 릴리스 정체(2025.4~) 리스크는 수용.
> - **RSC 안정성**(#4): **정적 스타일을 빌드 시점에 미리 번들(.css 추출)해 컴포넌트에서 소비**하는 배포 형태로 가면 무리 없음 — `.css.ts` 소스를 그대로 publish하지 않는다.
>
> 미결로 남는 것: #2(고빈도 벤치마크 — Button/호가창 슬라이스에서 실측), #5(Panda 재고 — SD SoT 유지하므로 탈락 확정).

1. **CSS Modules vs vanilla-extract 최종 선택.** 트레이드오프 축은 명확하다: **"publish 부담 0 + 영속성 + 단순"(CSS Modules) vs "타입 안전 토큰 연결 + 레시피 DX"(vanilla-extract, 단 릴리스 정체 리스크)."** 인간 판단 필요 — 특히 vanilla-extract의 유지보수 정체를 장기 의존 리스크로 받아들일지.
<!-- vanilla-extract로 선정. -->
2. **고빈도 리렌더 정량 벤치마크 부재.** 두 후보 모두 구조적 근거(정적+inline var)로만 우위 판단, 실측 수치는 확보 못 함. Button 슬라이스 단계에서 호가창 프로토타입으로 실측할지.
3. **CSS Modules 선택 시 variant 관리 도구**(cva vs tailwind-variants vs 자체) 및 **CSS 변수 타입안전 보완 수단**(stylelint 등) 별도 결정.
4. **vanilla-extract 선택 시 RSC 안정성** — 과거 experimental 이력, 2026 최신 Next App Router 특정 버전 조합 검증 필요.
<!-- 정적 스타일을 미리 번들해서 컴포넌트에서 소비하면 RSC 안정성은 무리 없을 듯. -->
5. **Panda 재고 여지**: 토큰 SoT를 SD가 아니라 Panda로 옮길 의향이 있다면 Panda가 1순위급. 현 구조(ADR-0005 SD SoT)를 바꿀 의향이 없으면 탈락 유지.
