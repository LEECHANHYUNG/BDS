# Research: 디자인 토큰 뼈대 (color scale · spacing scale · 레이어링)

> 작성: 2026-06-21 · 상태: 검토 대기
> 조사 축: 코드베이스 ✅ + 웹 ✅ (둘 다)

## 1. 조사 범위 & 질문

그릴링(컴포넌트 먼저냐 설정 먼저냐)을 거쳐, 진짜 질문은 **"토큰 뼈대를 어디까지 선(先)확정하고 어디서 컴포넌트로 내려갈 것인가"** 로 정리됐다. 방향은 **B(Button 수직 슬라이스)** 로 합의 — 전 팔레트를 완성하는 top-down이 아니라, Button 하나가 실제로 요구하는 최소 토큰만 나중에 생성한다.

이 조사는 그 전제 위에서 **"값"이 아니라 "바꾸기 비싼 뼈대"** 만 본다. 그릴링에서 도출된 안전/위험 경계:

- **싸게 바꿀 수 있음(나중에 해도 됨)**: 토큰 값(구체 hex/oklch), hue 추가(cyan 등), step 값 채우기.
- **비쌈(선확정 필수)**: ① color scale의 step 수·네이밍·역할 매핑, ② spacing/size scale 생성 규칙·네이밍, ③ primitive→semantic→도메인 **레이어 구조와 참조 방식**.

답하려는 핵심 질문:

1. color palette scale을 **어떻게** 생성·검증할 것인가 (step 수·네이밍·OKLCH·대비 방법론). 값이 아니라 방법.
2. spacing/size scale을 어떤 규칙·네이밍으로 깔 것인가.
3. 토큰 레이어를 몇 층으로, 어떤 참조 규칙으로 둘 것인가. 특히 금융 도메인의 상승/하락(증감 색상)을 어느 레이어에 둘 것인가.

## 2. 코드베이스 분석

이 레포는 토큰에 관한 **결정의 절반이 이미 문서에 박혀 있다.** 조사는 "백지에서 정하기"가 아니라 "이미 박힌 제약을 방법론으로 채우기"다.

### 이미 확정된 제약 (ADR / 기준 문서)

- **`@bds/tokens` 별도 패키지 확정** — `docs/adr/0005-workspace-package-structure-tokens-and-react.md`. 토큰은 컴포넌트(`@bds/react`)와 **독립 publish 단위**이고 **independent 버전**. "DTCG로 토큰을 다룬다"가 명시돼 있어, 조사·설계는 **DTCG 표준 위에서** 이뤄져야 한다. → 토큰 scale 재설계는 `@bds/react`와 독립적으로 major bump 가능하지만, 그 토큰을 참조하는 컴포넌트는 깨진다(= "scale 뼈대 재설계 비용"의 실체).
- **2층(primitive/semantic)이 이미 암묵 전제됨** — `DESIGN.md` 색상 표가 semantic 역할만 규정하고 값은 `_(미정)_`: `primary / success(positive) / danger(negative) / warning / neutral`. "의미 토큰만 사용하고 컴포넌트에서 raw 색상값 직접 쓰지 않는다"가 명문화 → **컴포넌트는 semantic만 참조**가 이미 규칙.
- **대비 기준 확정** — `DESIGN.md` 접근성: 텍스트 대비 **WCAG AA 이상**(본문 4.5:1, 큰 텍스트 3:1), 핵심 정보는 **AAA 지향**. "색만으로 의미 전달 금지 — 색 + 아이콘/부호/라벨"(색각 이상 고려).
- **간격/라운드/elevation은 토큰 스케일** — `DESIGN.md`: "임의 픽셀 하드코딩 금지, 토큰에 없으면 토큰을 먼저 추가". (값 미정)
- **tabular 숫자** — `DESIGN.md`: 수량·지표는 고정폭(tabular) 숫자로 정렬.

### 도메인 semantic의 실증 근거

- **증감 색상(상승/하락)** — `CONTEXT.md` "신뢰 상태": **한국 시장 상승=빨강 / 하락=파랑, 지역마다 반대.** "색만으로 전달하지 않고 항상 부호·아이콘·라벨을 함께 쓴다(색각 이상)." → 이게 **도메인 semantic 레이어**가 필요한 구체적·실증적 근거다.
- **L2가 본체** — `docs/adr/0002-...md`: L1(범용)은 토대일 뿐, L2(증권 도메인)가 본체. 토큰 레이어링도 이 원칙과 정합해야 한다 — 즉 범용 semantic과 도메인 semantic을 어떻게 가를지가 핵심 설계 질문.
- **주식주문 플로우가 L2 역산 기준** — `docs/adr/0003-...md`: 실시간 시세·호가창·가격 입력 등. 실시간 리렌더 요구 → 스타일링 엔진은 zero-runtime 계열로 좁혀짐(별도 조사 주제, 본 문서 범위 밖이나 토큰 출력 포맷과 묶임 — §5 참조).

### 보류 트리거 (ADR-0006)와의 관계

`docs/adr/0006-deferred-scaffolding-decisions-and-triggers.md`의 **토큰 파이프라인** 항목: "DTCG → Style Dictionary → CSS/TS"는 "토큰 값 자체가 DESIGN.md에서 미정"이라 보류, 재평가 트리거 = **"`@bds/tokens` 토큰 값을 채우는 작업 단계"**. 본 조사가 그 트리거의 진입에 해당한다 — 단 "값"이 아니라 "뼈대"만 정한다는 점에서 ADR-0006의 "박제 회피" 원칙과 정합한다.

> ⚠️ **레퍼런스 검증 주의**: 위 ADR 인용은 2026-06-21 시점 문서 기준이다. 계획/구현 단계에서 ADR이 supersede되었는지 재확인할 것.

## 3. 외부 조사 — 최신 동향 & 모범 사례

(검증일 2026-06-21. 학습 기억이 아니라 실제 웹 검색으로 확인. 각 항목 출처 URL 명시.)

### A. color scale — step 수·네이밍·OKLCH·대비

**step 수·네이밍은 "scale을 무엇으로 정의하느냐"에서 나온다** (색이 몇 개 필요한가가 아님):

| 방식             | step                | 정의 기준                                                               | 비고                                                                                                                                 |
| ---------------- | ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Radix Colors** | **12-step**         | **UI 역할**(1–2 배경, 3–5 컴포넌트, 6–8 보더, 9–10 solid, 11–12 텍스트) | 라이트/다크 같은 번호 = 같은 의미 → 다크모드 전환이 매핑 교체로 끝남. **step 11=APCA Lc 60, 12=Lc 90 대비 보증이 scale 정의에 박힘** |
| **Tailwind**     | 50~950, **11-step** | **명도 등분**                                                           | 클래스명 짧고 정렬됨, 50 간격으로 후속 추가 여지. 사실상 업계 표준 네이밍                                                            |
| **Material 3**   | **13-tone**(0~100)  | 동적 테마 생성 입력                                                     | 계조 해상도 확보용                                                                                                                   |
| **IBM Carbon**   | 10-step             | 엔터프라이즈 테마 조합 최소치                                           |                                                                                                                                      |

- 출처: <https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale>, <https://tailwindcss.com/docs/colors>, <https://m3.material.io/styles/color/the-color-system/key-colors-tones>, <https://carbondesignsystem.com/elements/color/overview/>

**OKLCH 기반 생성** (2026 사실상 기본 색공간):

- L만 바꾸면 hue/채도 드리프트 없이 명도 scale을 뽑을 수 있는 게 결정적 장점.
- **Radix**: hue 고정, L·chroma 독립 조정, 대비 타깃은 **APCA Lc**. **Adobe Leonardo**: 거꾸로 **목표 대비비를 입력으로 색을 생성**(WCAG 2.1 + APCA 둘 다 충족). **Huetone**: APCA 표시 에디터.
- **브라우저 지원**: `oklch()` Chrome/Edge 111+, Safari 15.4+, Firefox 113+ → 전세계 ~93–95%. 구형은 `@supports`/cascade로 HEX fallback.
- **트레이드오프(gamut clipping)**: 고채도 값이 sRGB 밖으로 나가면 브라우저가 clamp → scale 양 끝에서 인접 step이 시각적으로 붙을 수 있음. Radix가 끝단 chroma를 muted하는 이유. gamut checker 검증 권장.
- 출처: <https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl>, <https://caniuse.com/mdn-css_types_color_oklch>, <https://github.com/adobe/leonardo>, <https://www.radix-ui.com/colors/docs/palette-composition/scales>

**대비 검증: WCAG2 vs APCA(WCAG3)** — ⚠️ 중요한 미해결 지점:

- **APCA/WCAG 3은 2026년에도 production 규범으로 쓸 수 없다.** WCAG 3.0은 여전히 Working Draft, 시각 대비는 2023.7 초안에서 제외, 2026.4 기준 "대비 알고리즘 미정(TBD)". APCA는 working group 지지를 못 받아 빠졌고 현재 ARC라는 독립 표준으로 별도 개발 중. 최종 권고는 2028 전 난망.
- **WCAG2 4.5:1의 한계**: 어두운 배경에서 부정확, 폰트 굵기/크기 분리 모델링 못 함.
- **권장(2026)**: **WCAG 2 AA = 컴플라이언스 바닥(법적 준거), APCA = 가독성 천장(설계 품질)** 의 2층 검증. APCA를 WCAG2 대체물로 쓰면 법적 리스크.
- 출처: <https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html>, <https://www.w3.org/TR/wcag-3.0/>, <https://www.accessibility.chat/articles/the-apca-mirage-why-premature-wcag-3-adoption-creates-legal-risk>

**무엇을 고정하면 후회가 적은가** (값이 아니라 뼈대): ① step 수·네이밍 규칙, ② step의 역할 매핑(라이트/다크 같은 인덱스=같은 역할), ③ semantic 층을 반드시 끼우고 컴포넌트는 semantic만 참조, ④ 대비 검증 방법(텍스트 단계 정의가 검증 기준에 묶임).

- 출처: <https://www.contentful.com/blog/design-token-system/>, <https://thedesignsystem.guide/design-tokens>

### B. spacing / size scale

- **spacing 생성 규칙**: **4px(또는 8px) base grid + 부분 모듈러 혼합**이 메인스트림. 순수 기하급수는 작은 간격에서 정수 px가 안 떨어져 드묾. Tailwind=4px 선형(`--spacing` 단일 토큰), Radix Themes=9-step hybrid(앞은 4px 등차, 뒤로 벌어짐, `--scaling`으로 밀도 일괄 조정), Material 3=8dp 그리드(미세 요소 4dp).
- **네이밍**: 연속 스케일은 **숫자형**(`space-4`) 권장, 의미 고정 소수 집합(container/breakpoint)만 t-shirt형. t-shirt는 중간 삽입(sm↔md 사이)에서 깨진다. 숫자형도 조밀 삽입엔 재번호 위험 → z-index류는 **100 단위 점프**로 완화.
- **축 분리**: spacing/font-size(모듈러 1.2~1.25)/radius/border-width/z-index/sizing을 **별도 스케일**로 두되 base unit(4px)은 공유. 작은 치수는 spacing 공유, 큰 레이아웃 치수는 t-shirt 분리가 흔한 절충.
- **rem vs px**: 사용자 폰트 확대를 존중해야 하는 값(font-size·연동 spacing)은 **rem**(WCAG 1.4.4 200% 확대). **border hairline은 px**(디바이스 픽셀 또렷함). DTCG도 px/rem 둘 다 허용.
- **DTCG dimension**: **Format Module 2025.10이 첫 stable**(2025-10-28). dimension은 정식 타입, 값이 문자열이 아니라 **`{ value, unit }` 객체**, 허용 단위는 **`px`/`rem` 둘뿐**, value=0이어도 unit 필수. spacing·border-width는 별도 타입이 아니라 모두 dimension. Style Dictionary v4 빌트인 transform(`size/rem`, `size/px`, `size/pxToRem`)이 처리, 단 **2025.10 객체값 완전 지원은 SD 버전별로 차이 → 사용 버전 릴리스 노트 재확인 필요**.
- 출처: <https://tailwindcss.com/docs/padding>, <https://www.radix-ui.com/themes/docs/theme/spacing>, <https://m3.material.io/foundations/layout/understanding-layout/spacing>, <https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676>, <https://www.joshwcomeau.com/css/surprising-truth-about-pixels-and-accessibility/>, <https://www.designtokens.org/tr/drafts/format/>, <https://styledictionary.com/info/dtcg/>

**금융 맥락**: 고밀도 데이터 그리드 → Radix `--scaling`식 **density 축**(compact/comfortable)을 토큰으로 두면 행 높이/패딩을 토큰만으로 전환. 작은 spacing step(2/4px) 충분히 필요. 숫자 정렬은 spacing이 아니라 `font-variant-numeric: tabular-nums` 타이포 기능으로 — DESIGN.md의 tabular 요구와 일치. 테이블 hairline border는 px 권장.

### C. 토큰 레이어링 & DTCG/Style Dictionary 파이프라인

**3-tier(primitive → semantic → component)** 가 사실상 합의(Brad Frost / Nathan Curtis / M3 `ref·sys·comp` / Adobe Spectrum). 참조는 **단방향 하류**(컴포넌트→semantic→primitive).

- **2층으로 충분한 경우 vs 3층**: Curtis의 **"Start Within, Then Promote Across"** — component 토큰은 처음엔 컴포넌트 로컬에 두고 **3개 이상 컴포넌트가 같은 결정을 공유할 때만** 전역 승격. 처음부터 component 토큰을 다 만드는 건 **조기 전역화**. 단일 브랜드면 **2층(primitive→semantic)으로 충분.** → **방향 B(Button 슬라이스)와 정확히 일치**: Button 토큰을 미리 전역화하지 말 것.
- **alias 문법(DTCG)**: `"$value": "{color.blue.500}"`(완성 토큰 전체만 타깃). 세분 참조는 `$ref`+JSON Pointer(2025.10 신기능).
- **다크모드/locale 전환은 semantic 층에서**: semantic 이름은 고정, resolve되는 primitive만 테마별 스왑, 컴포넌트는 불변.
- **primitive 직접 참조 금지 강제**: 스펙엔 강제 없음 → **CI 린트로 강제**("컴포넌트가 primitive 직접 참조 시 빌드 실패") + 코드리뷰. "1일차부터 규칙+린트".
- 출처: <https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/>, <https://m3.material.io/foundations/design-tokens>, <https://spectrum.adobe.com/page/design-tokens/>, <https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676>

**도메인 semantic(상승/하락) 배치** — 본 조사의 핵심:

- Curtis는 명시적 **domain(business unit) 레벨**을 정의: 그룹이 core 너머 자체 토큰 세트를 isolate·배포하는 네임스페이스. **도메인 토큰은 core 테마 층과 직교하는 자체 light/dark를 가질 수 있다** → 범용 semantic과 **섞지 말고 분리.**
- **표현이 아니라 의미로 네이밍**: `price-up`/`price-down` (O), `price-red`/`price-green` (X — 지역 전환 시 의미가 뒤집혀 코드 전체 수정).
- **지역 반전(한국 상승=빨강 / 미국 상승=초록)**: 의미 토큰(`price-up`/`down`)을 **불변**으로 두고 가리키는 primitive를 **locale/테마별 스왑** — 다크모드와 동일 메커니즘. 캔들차트 일본 기원 사실 확인됨.
- ⚠️ 공개된 "금융 전용 DTCG DS 레퍼런스 구현"은 검색으로 확인 안 됨 — 원칙은 일반 도메인 토큰 패턴의 적용.
- 출처: <https://medium.com/@danvim/deep-dive-into-the-opposing-color-schemes-in-asian-vs-western-stock-market-prices-part-1-origin-4e3ccdb27c99>, <https://www.designsystemscollective.com/color-token-naming-what-works-what-fails-the-best-approach-for-your-design-system-50f844d25f01>

**DTCG 현황(2026)** — ⚠️ deprecation 주의:

- **2025.10 = 첫 stable**(production-ready). `designtokens.org/tr/2025.10/` 가 안정 기준. 반면 `tr/drafts/format/`는 **"do not implement" 경고 붙은 진행 중 초안** — 구현 기준 삼지 말 것.
- `$value`/`$type`(필수, 타입 추론 금지)/`$description`. 그룹·`$extends`·`$extensions`. **color는 CSS Color 4 전 공간 — Oklch/P3/sRGB 지원**(`{colorSpace, components, hex}`).
- 출처: <https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/>, <https://www.designtokens.org/>

**Style Dictionary v4+**:

- DTCG 1급 지원(`$type`로 판정, CTI 의존 제거). 한 소스 → `css/variables` + `typescript/es6`(+`.d.ts`) 동시 출력.
- **`outputReferences`(v4: boolean 또는 함수)**: semantic→primitive 참조를 CSS에서 `var(--color-primary)`로 **보존** → 다크모드·locale 테마를 **CSS 변수 단 런타임 스왑**으로 처리(값 평탄화 안 함). 이게 테마 전환의 핵심.
- **zero-runtime(vanilla-extract) 연결**: `createGlobalThemeContract`로 전역 CSS 변수 이름 contract를 만들고 SD `css/variables` 출력과 **동일 변수명 매핑**. SD=값+변수명 단일 소스, vanilla-extract=타입 안전 소비 계층. 공식 1:1 플러그인은 부재(수동 연결이 실무 패턴). contract로 고정 변수명 강제 필요(vanilla-extract가 해시 붙이는 경향).
- ⚠️ DTCG **2025.10 완전 지원은 일부 v5 WIP** — v4는 드래프트 기반이라 신문법 갭 가능 → 채택 전 버전 확인.
- 출처: <https://styledictionary.com/versions/v4/migration/>, <https://styledictionary.com/info/dtcg/>, <https://vanilla-extract.style/documentation/global-api/create-global-theme-contract/>

## 4. 종합 발견 & 권장 방향

조사 결과, **이 레포의 결정 대부분은 "발명"이 아니라 "업계 합의 + 이미 박힌 ADR/DESIGN 제약의 결합"으로 거의 자동 도출된다.** 진짜 인간 판단이 필요한 갈림길은 §5에 모았다.

### 권장 뼈대 (바꾸기 비싼 것들)

1. **레이어 = 3층, 단 component는 지연**:
   - **primitive**(L·역할 무관, raw scale) → **semantic**(역할: primary/danger/neutral 등, DESIGN.md 표) → **domain semantic**(`price-up`/`price-down` 등 증권 의미) → (component는 ADR Curtis 원칙대로 "3개 컴포넌트 공유 시 승격", **지금은 만들지 않음**).
   - 도메인 semantic을 **범용 semantic과 분리된 네임스페이스**로 둔다(ADR-0002 "L2 본체" + Curtis domain 레벨 정합). 이게 본 조사의 가장 중요한 결론.
   - 컴포넌트는 semantic/domain semantic만 참조. **primitive 직접 참조 금지를 CI 린트로 강제**(oxlint는 이 커스텀 룰을 못 함 → 별도 수단 필요, §5).

2. **color scale**: OKLCH로 생성. step 수·네이밍은 §5 미결(Radix 역할형 12-step vs Tailwind 명도형 50~950). 대비 검증은 **WCAG2 AA = 바닥(필수), APCA Lc = 천장(품질 지향)** 2층. DESIGN.md의 "AA 이상, 핵심 AAA 지향"과 직접 매핑.

3. **spacing/size scale**: **4px base grid + 숫자형 네이밍.** font-size/radius/border-width/z-index/sizing은 축 분리, base unit 공유. font-size·spacing은 **rem**, border hairline은 **px**. 금융 고밀도 대비 **density 축** 도입 검토(§5).

4. **포맷·파이프라인**: 소스 = **DTCG 2025.10 stable**(oklch 사용 가능). 빌드 = **Style Dictionary v4+**, `outputReferences`로 참조 보존 → CSS 변수 + TS 동시 출력. 이게 테마/locale 스왑의 토대.

### 방향 B(Button 슬라이스)와의 정합

- 조사(지금): **scale 생성·검증 방법론 + 레이어 구조**만 확정. 값·전 팔레트 생성 안 함.
- 구현(다음): Button이 쓰는 hue scale + 그 semantic/domain 매핑만 실제 생성. 이 시점에 zero-runtime 스타일 엔진 + 토큰 출력 포맷(=vanilla-extract contract ↔ SD 변수명) 동시 결정(ADR-0006 트리거 발동 → 새 ADR).
- Curtis "조기 전역화 회피" = 방향 B의 학술적 뒷받침. component 토큰을 미리 만들지 않는 게 **모범 사례와 일치**.

### 제품 맥락 (접근성·신뢰·데이터 표시)

- **접근성**: 대비는 WCAG2 AA 법적 바닥 + APCA 가독성 천장 2층 검증. 상승/하락은 **색 단독 금지**(DESIGN.md·CONTEXT.md) → 토큰만으로 색을 주되, 부호·아이콘 병기를 컴포넌트 API가 강제하도록 설계(토큰 조사 범위 밖이나 연동).
- **데이터 표시**: tabular-nums는 spacing이 아니라 타이포 토큰/유틸로. 고밀도 그리드 density 축.
- **신뢰**: 토큰 scale은 `@bds/tokens` independent 버전이라 재설계 시 major bump + Changeset 필수(모든 소비 컴포넌트 파급). "scale 뼈대 동결"의 무게가 금융에선 특히 큼.

## 5. 미해결 질문 / 개발자 검토 필요 지점

> ### ✅ 인라인 주석 사이클 결정 (2026-06-21 확정)
>
> 아래 갈림길에 대해 사람이 인라인 노트로 결정함. 계획 단계는 이 결정을 전제로 작성한다.
>
> 1. **color scale = Radix식 역할형 12-step.** 명도형(Tailwind) 거부 — semantic 수동 매핑을 줄이고 대비 보증을 scale에 박기 위함.
> 2. **레이어 = 3층 명문화** (primitive → semantic → 도메인 semantic). "범용 semantic 내 네임스페이스"가 아니라 도메인 semantic을 별도 층으로.
> 3. **primitive 직참조 금지 = (a) `@bds/tokens`가 semantic만 export.** primitive는 internal로 감춰 타입/번들 경계로 자연 강제. (oxlint 커스텀 룰 불필요.)
> 4. **density(밀도) 축 = 미룬다.** Button 슬라이스 단계엔 과투자. 트리거는 계획/후속에서 정의.
> 5. **스타일링 엔진 = 지금 확정한다** (조사 결론 "Button 슬라이스 시점"을 뒤집음). 근거: §5.5대로 vanilla-extract `createGlobalThemeContract` 변수명 규칙이 토큰 네이밍과 한 몸 → 토큰 뼈대 확정의 선행조건. **단 엔진 후보 실측 비교 조사가 없어, 별도 조사(`docs/research/styling-engine.md`)를 먼저 한 뒤 그 결론을 본 토큰 설계에 물린다.**
> 6. **상승/하락 locale 스왑 = 구현 안 함 (한국 시장만).** 단 **네이밍은 의미 기반(`price-up`/`price-down`) 유지** — 비용 0, 나중에 스왑 붙일 여지 보존. (#2 3층 분리의 정당성은 locale이 빠져도 다크모드 흡수 + ADR-0002 "L2 본체" 의미 분리로 충분.)
>
> 미결로 남는 것: #6(DTCG/SD 버전 갭 — 도입 시점 재확인), 그리고 #5가 의존하는 **스타일링 엔진 실측 조사**.

AI가 확신 못 하거나 인간 판단이 필요한 갈림길. **계획(plan) 단계에서 결정해야 한다.**

1. **color scale 정의 방식: Radix식 역할형 12-step vs Tailwind식 명도형 50~950.** 가장 바꾸기 비싼 단일 결정. 역할형은 다크모드 매핑이 자동화되고 대비 보증을 scale에 박을 수 있으나(금융 고대비에 유리) 학습 곡선·생성 복잡도↑. 명도형은 친숙·단순하나 semantic 매핑을 수동으로 더 짜야 함. **L2 도메인 컴포넌트(호가창 등)의 다크모드 요구가 얼마나 강한지**가 판단 입력 — 아직 미정.
<!-- semantic 매핑을 직접 고려하는 것 보다는 radix식 역할형으로 하고 싶다. -->

2. **레이어를 2층 vs 3층(도메인 semantic 분리)으로 명문화할지.** 본 조사는 도메인 semantic 분리(3층 성격)를 권장하나, "범용 semantic 안의 네임스페이스"로도 같은 효과를 낼 수 있다(`color.semantic.finance.price-up`). 어느 형태로 ADR에 박을지는 인간 결정.
<!-- 3층으로 명문화 하자 -->

3. **primitive 직접 참조 금지를 무엇으로 강제할지.** 모범 사례는 CI 린트지만 **oxlint(현재 린터)는 이런 토큰 도메인 커스텀 룰을 지원하지 않을 가능성이 높다.** 대안: (a) `@bds/tokens`가 primitive를 export 안 하고 semantic만 공개(타입/번들 경계로 자연 강제), (b) 별도 스크립트 검사. (a)가 유력하나 패키지 export 설계와 묶임 → 검증 필요.
<!-- a 방안으로 가자 그럼 -->
4. **density(밀도) 축을 1일차부터 토큰에 넣을지.** 금융 고밀도 그리드엔 유용하나, Button 슬라이스 단계엔 과투자일 수 있음(ADR-0006 "박제 회피"). 미루는 게 맞을 수도 — 트리거 정의 필요.
<!-- ㅇㅇ 미루자 -->
5. **스타일링 엔진(vanilla-extract 등) 확정 시점.** 토큰 출력 포맷(특히 vanilla-extract `createGlobalThemeContract` ↔ SD 변수명 일치)이 엔진에 종속. 본 조사는 "Button 슬라이스 시점에 동시 결정"으로 봤으나, contract 변수명 규칙은 토큰 네이밍과 한 몸이라 **토큰 네이밍을 정할 때 엔진을 어느 정도 가정해야** 할 수 있음. 순수 분리가 가능한지 계획 단계 확인 필요.
<!-- 지금 확정하고 가야 할 듯. -->
6. **DTCG/Style Dictionary 버전 갭.** 2025.10 stable의 dimension `{value,unit}` 객체값·oklch color를 사용하려는데 **SD v4의 지원이 부분적이고 완전 지원은 v5 WIP.** 실제 도입 시점에 사용 버전 릴리스 노트로 재확인 필수 — 지금 단정 불가.

7. **상승/하락 locale 스왑을 실제로 지원할지(YAGNI 검토).** 모범 사례는 의미 토큰+테마 스왑이지만, 이 포폴이 **한국 시장만** 다룬다면 locale 스왑은 과설계일 수 있다. 단 **네이밍만은 의미 기반(`price-up`)** 으로 가야 — 그건 비용 0이고 나중에 스왑을 붙일 여지를 남긴다. "지금 스왑 메커니즘까지 구현하느냐"는 별개 판단.
<!-- ㅇㅇ 지금은 한국 시장만 고려. -->
