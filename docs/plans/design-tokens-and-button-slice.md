# Plan: 디자인 토큰 뼈대 + Button 수직 슬라이스

> 작성: 2026-06-21 · 상태: 검토 대기 (아직 구현하지 않음)
> 근거 조사: `docs/research/design-tokens.md`(§5 확정 6건) · `docs/research/styling-engine.md`(vanilla-extract 선정)

## 1. 개요 & 목표

빈 `packages/`에 **첫 두 패키지(`@bds/tokens`, `@bds/react`)** 를 세우고, **Button 하나를 수직으로 관통**시켜 토큰 → 스타일 엔진 → 컴포넌트의 연결을 단 하나의 실증 사례로 검증한다. 이로써 ADR-0006이 "첫 컴포넌트 시점"으로 묶어둔 트리거 다발(번들러·exports·스타일 엔진·a11y 린트)이 근거를 갖고 발동된다.

**달성하려는 것:**

- `@bds/tokens`: DTCG 2025.10 소스 → Style Dictionary v4+ 빌드로 CSS 변수 + TS 출력. **3층(primitive → semantic → 도메인 semantic)** 레이어 뼈대. **단 Button이 쓰는 최소 토큰만** 값으로 채운다(전 팔레트 완성 아님).
- `@bds/react`: vanilla-extract 기반 Button 1개. `@bds/tokens`의 **semantic 토큰만** 참조.
- 두 패키지의 빌드·exports·publish 형태 확정(라이브러리는 정적 .css로 번들 배포).
- 위 결정들을 ADR로 박제(엔진·레이어·scale 방식·번들 포맷).

**달성하지 않는 것 (범위 경계):**

- 전 색상 팔레트(12-step × 전 hue) 완성 — Button이 쓰는 hue만.
- density(밀도) 축 — 미룸(조사 §5 결정 #4).
- locale 스왑 메커니즘 — 한국 시장만, 네이밍만 의미 기반 유지(결정 #6).
- Storybook·CI 원격 캐시·공유 tsconfig 패키지 — ADR-0006 트리거 미발동(후속).
- L2 도메인 컴포넌트(호가창 등) — Button 검증 후.

## 2. 접근 방식

### 2.1 레이어 아키텍처 (3층, 조사 §4 권장 = 결정 #2)

```
primitive (raw OKLCH scale, 역할 무관)
  └─ blue-1..12, gray-1..12, red-1..12 ...   ← Radix식 역할형 12-step (결정 #1)
semantic (역할 부여, DESIGN.md 표)
  └─ color-primary, color-danger, color-neutral ...  → primitive alias
domain semantic (증권 의미)
  └─ price-up, price-down ...  → primitive alias (한국: up=red 계열)
component (지연 — 만들지 않음)
  └─ Curtis "3개 컴포넌트 공유 시 승격" 원칙. Button은 semantic 직접 참조.
```

- **`@bds/tokens`는 semantic + 도메인 semantic만 export**(결정 #3). primitive는 internal — 빌드 입력일 뿐 공개 API 아님. 컴포넌트가 primitive를 import조차 못 하게 해 "semantic만 참조"를 타입/번들 경계로 자연 강제(oxlint 커스텀 룰 불필요).
- Radix식 역할형 12-step: step 11/12에 텍스트 대비 보증, 라이트/다크 같은 번호=같은 의미. 다크모드는 이번 범위 밖이나 scale 뼈대는 다크 대응 가능하게 잡는다.

### 2.2 토큰 파이프라인

- **소스**: DTCG 2025.10 stable JSON. `$type`/`$value`/`$description`. color는 oklch color space, dimension은 `{value, unit}` 객체(unit은 px/rem).
- **빌드**: Style Dictionary v4+. `outputReferences`로 semantic→primitive 참조를 `var()` 체인으로 보존 → 다크/테마 스왑 토대. 출력 = `css/variables`(`--bds-*`) + `typescript/es6`(+`.d.ts`).
- ⚠️ **버전 갭 검증(조사 §5 #6)**: SD v4의 DTCG 2025.10 `{value,unit}`·oklch 지원이 부분적일 수 있음. 구현 첫 작업에서 **사용할 SD 버전이 실제로 처리하는지 스파이크로 확인**하고, 안 되면 (a) SD 버전 올리기 (b) 소스를 문자열 dimension으로 다운그레이드 중 택일 — 계획에 단정하지 않는다.
  - A1 결과: `style-dictionary@5.4.4`에서 DTCG oklch color 객체는 `color/oklch` transform으로 `oklch(...)` 출력, dimension `{ value, unit }` 객체는 `size/rem` transform으로 `rem`/`px` 단위를 보존한다. CSS `outputReferences`는 semantic→primitive `var()` 체인을 보존한다. 폴백 불필요.

### 2.3 스타일 엔진 (vanilla-extract, 결정 #5)

- `@bds/react`가 vanilla-extract 사용. `createGlobalThemeContract`로 `@bds/tokens`가 뱉은 `--bds-*` CSS 변수에 **타입 안전 매핑**(새 변수 생성 안 함, SD 변수를 그대로 참조).
- **배포 형태(RSC 안정, 결정 #5)**: `.css.ts` 소스를 그대로 publish하지 않는다. 빌드 시점에 **정적 `.css`로 추출**해 컴포넌트 JS와 함께 dist에 담아 publish → 소비처는 번들러 플러그인 없이 `.css` import만. 이게 RSC 안정성과 publish 부담 0을 동시에 만족.
- 고빈도 리렌더(향후 호가창): 정적 클래스 + `assignInlineVars`로 CSS 변수만 inline 갱신하는 패턴을 규약으로 — 이번 Button엔 미적용(범위 밖)이나 엔진 선택 근거로 기록.

### 2.4 워크스페이스 통합

- `pnpm-workspace.yaml`은 이미 `packages/*` glob 포함 — 새 패키지 자동 인식. 변경 불필요(가정: glob만으로 충분).
- `@bds/react`는 `@bds/tokens`를 `workspace:*`로 의존. turbo `build`의 `dependsOn: ^build`가 tokens→react 빌드 순서를 보장(이미 turbo.json에 정의됨).
- 루트 `package.json`의 `lint`/`check`는 현재 `oxlint .`로 **루트에서 전체**를 돈다 — 패키지가 생겨도 동작하나, 패키지별 `build`/`test`는 turbo 위임이 필요. 루트 스크립트 조정 여부는 §5에서 검토.

## 3. 변경될 파일 경로

실제 확인한 현재 상태: `packages/`는 `.gitkeep`만, 루트에 `pnpm-workspace.yaml`·`turbo.json`·`.changeset/config.json`·`package.json` 존재.

**`@bds/tokens` (신규):**

- `packages/tokens/package.json` (신규) — name `@bds/tokens`, exports 맵(semantic CSS + TS만 노출), build script(SD), `publishConfig.access: public`.
- `packages/tokens/tsconfig.json` (신규) — 패키지 로컬(공유 tsconfig 패키지는 ADR-0006상 보류).
- `packages/tokens/style-dictionary.config.*` (신규) — DTCG 입력 → CSS+TS 출력, `outputReferences`.
- `packages/tokens/src/primitive/*.json` (신규) — Button이 쓰는 hue의 12-step만(예: brand 1색 + gray + danger).
- `packages/tokens/src/semantic/*.json` (신규) — color-primary 등 DESIGN.md 역할 → primitive alias.
- `packages/tokens/src/domain/*.json` (신규) — price-up/price-down (이번 Button엔 미사용일 수 있으나 레이어 뼈대 실증용 최소 정의).
- `packages/tokens/dist/**` (빌드 산출, gitignore 대상) — `bds-tokens.css`(`--bds-*`), `index.ts`/`.d.ts`.

**`@bds/react` (신규):**

- `packages/react/package.json` (신규) — name `@bds/react`, `@bds/tokens` workspace 의존, exports(컴포넌트 + 추출된 .css), build script(tsup/tsdown 등 번들러 — §5 미결), `publishConfig.access: public`.
- `packages/react/tsconfig.json` (신규).
- `packages/react/src/theme.css.ts` (신규) — `createGlobalThemeContract`로 `--bds-*` 매핑.
- `packages/react/src/Button/Button.tsx` (신규) — base-ui 인터페이스 철학(prop·composition·controlled/uncontrolled) 차용, 런타임 의존 없음.
- `packages/react/src/Button/Button.css.ts` (신규) — vanilla-extract, semantic 토큰 참조, variant.
- `packages/react/src/index.ts` (신규) — Button export.

**루트 (수정 가능성):**

- `.gitignore` — `dist/` 무시 추가(가정: 현재 무시 안 할 수 있음, 확인 필요).
- `pnpm-workspace.yaml` `catalog` — 공통 버전(react 등) 단일화 시 채움(선택).
- `package.json` 루트 `lint`/`check`/`build` — turbo 위임으로 조정 여부(§5).
- `packages/tokens/.gitkeep`, `packages/react/.gitkeep` 자리에 실제 패키지 — 기존 `packages/.gitkeep`은 유지/제거 판단.

**ADR (신규):**

- `docs/adr/0009-*.md` (신규) — 본 계획의 결정들(스타일 엔진 vanilla-extract / 토큰 3층·Radix scale / 번들 포맷·exports). ADR-0006의 "번들러·스타일·a11y 린트" 트리거 발동 기록. **supersede 아님**(0006은 "트리거 시 별도 ADR"이라 예고했으므로 보충).

## 4. 코드 스니펫

> 아래는 **방향성 예시**다. 실제 API(SD v4 DTCG 처리, vanilla-extract contract 시그니처)는 구현 첫 스파이크에서 확정한다. 발명한 값이 아니라 조사에서 확인한 메커니즘 기반이되, 버전별 정확한 문법은 구현 시 공식 문서로 재확인.

```jsonc
// packages/tokens/src/primitive/blue.json — DTCG 2025.10, Radix식 12-step (값은 예시)
{
  "blue": {
    "1": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.99, 0.01, 250] } },
    "9": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.62, 0.19, 250] } },
    "11": {
      "$type": "color",
      "$value": { "colorSpace": "oklch", "components": [0.45, 0.16, 250] },
    },
    // 1..12 — step 11/12는 텍스트 대비 보증 단계
  },
}
```

```jsonc
// packages/tokens/src/semantic/color.json — semantic은 primitive를 alias만 함
{
  "color": {
    "primary": { "$type": "color", "$value": "{blue.9}" },
    "danger": { "$type": "color", "$value": "{red.9}" },
    "neutral": { "$type": "color", "$value": "{gray.11}" },
  },
}
```

```ts
// packages/react/src/theme.css.ts — SD가 뱉은 --bds-* 에 타입 안전 매핑
import { createGlobalThemeContract } from "@vanilla-extract/css";

// 변수명을 SD 출력(--bds-color-primary)과 정확히 일치시킨다 (새 변수 생성 X)
export const vars = createGlobalThemeContract(
  { color: { primary: "", danger: "", neutral: "" } },
  (_value, path) => `bds-${path.join("-")}`,
);
```

```ts
// packages/react/src/Button/Button.css.ts
import { recipe } from "@vanilla-extract/recipes";
import { vars } from "../theme.css";

export const button = recipe({
  base: {
    /* spacing/radius 토큰 var() 참조 */
  },
  variants: {
    intent: {
      primary: { background: vars.color.primary },
      // raw 색상값 직접 사용 금지 — semantic 토큰만 (DESIGN.md)
    },
  },
});
```

```tsx
// packages/react/src/Button/Button.tsx — base-ui 철학 차용, 런타임 의존 없음
import { button } from "./Button.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: "primary";
}

export function Button({ intent = "primary", className, ...props }: ButtonProps) {
  return <button className={`${button({ intent })} ${className ?? ""}`} {...props} />;
}
```

## 5. 고려사항 & 트레이드오프

### 결정된 트레이드오프 (조사 §5 확정, 재론 불필요)

- 엔진 = vanilla-extract: 유지보수 정체(2025.4~) 리스크 수용, 타입 안전 토큰 연결·레시피 DX를 택함.
- color scale = Radix식 역할형 12-step: semantic 수동 매핑 부담↓, 학습 곡선↑ 수용.
- 3층 레이어, semantic만 export, density 미룸, locale 스왑 안 함(네이밍만 의미 기반).

### 구현 중 결정해야 할 미결 (할 일 목록에 스파이크로)

1. **`@bds/react` 번들러**: A2 실측 결과 Vite library mode를 선택. `tsup@8.5.1` + `@vanilla-extract/esbuild-plugin`은 정적 CSS·JS·root `.d.ts`를 만들었지만 ADR-0006의 유지보수 경계가 남는다. `tsdown@0.22.3`은 빌드는 통과해도 정적 CSS가 없고 `@vanilla-extract/css` 런타임 import가 남아 탈락. `vite@8.0.16` + `@vanilla-extract/vite-plugin@5.2.2`는 정적 CSS·JS를 만들고, 타입은 `tsc --emitDeclarationOnly`로 root `.d.ts`를 산출해 exports 기준을 충족한다.
2. **exports 서브패스**(ADR-0005 예고: `@bds/react/stock` 등): Button만 있는 지금은 단일 entry로 충분. 서브패스는 L2 생길 때. 단 exports 맵에 `.css` 노출 경로를 처음부터 포함.
3. **SD v4 ↔ DTCG 2025.10 버전 갭**(§2.2): A1에서 `style-dictionary@5.4.4`로 oklch·dimension 객체 처리 확인. CSS `var()` 참조 체인까지 통과.
4. **루트 lint/check/build 스크립트**: 현재 루트 `oxlint .`. 패키지 build/test는 turbo 위임 필요 → 루트 `build`를 `turbo run build`로, lint는 현행 유지(루트 일괄)가 단순. 구현 시 확정.
5. **CSS 변수 타입안전 보완**: vanilla-extract contract가 JS측 타입은 잡지만, 토큰 JSON과 contract 키 불일치는 런타임에만 드러남 — 빌드 검증 스텝 둘지 검토.

### 제품 맥락 (리스크)

- **접근성**: Button은 키보드 포커스 링·`:focus-visible`·적절한 대비(semantic 토큰이 step 11/12 대비 보증 단계를 참조)를 갖춘다. oxlint `jsx-a11y`가 1차 방어선. DESIGN.md "색만으로 의미 전달 금지"는 Button 단계엔 직접 해당 없으나 도메인 토큰 정의 시 주석으로 명시.
- **파급/신뢰**: `@bds/tokens`는 independent 버전(ADR-0005). semantic 토큰 이름·참조 구조 변경은 모든 소비 컴포넌트에 breaking → **Changeset 필수**. scale 뼈대 동결의 무게가 금융에선 큼(조사 §4).
- **base-ui 런타임 비의존**(ADR-0002): Button은 base-ui를 의존하지 않고 철학만 차용. 런타임 의존 도입은 별도 판단.

### 위험 & 완화

- **vanilla-extract 정체** → 정적 .css 추출 배포로 소비처를 엔진에서 분리(엔진이 죽어도 산출 .css는 동작). 마이그레이션 경로 확보.
- **SD/DTCG 버전 갭** → 스파이크 우선, 단정 금지, 폴백 2안 준비.
- **빈 패키지 박제 위험**(ADR-0006 경계) → Button이 실제 쓰는 토큰만 값 채움. 도메인 토큰은 레이어 실증을 위한 최소 정의로 한정.

## 6. 할 일 목록 (Todo List)

> 2026-06-21 승인됨. 구현 진행 추적기. 각 작업은 검증 가능 단위 — 작업마다 타입체크/빌드/동작으로 검증 후 `[x]`.

### A. 스파이크 (구현 전 불확실성 제거 — 단정 금지 항목)

- [x] A1. `@bds/tokens`에 Style Dictionary v4+ 설치 후, **DTCG 2025.10 oklch color + dimension `{value,unit}` 객체를 실제로 처리하는지** 최소 토큰 1~2개로 빌드 스파이크. 통과 시 진행, 실패 시 폴백((a) SD 버전 상향 (b) 문자열 dimension 다운그레이드) 중 택해 §2.2에 기록.
- [x] A2. `@bds/react` 번들러 후보(tsup / tsdown / vite library mode)에서 **vanilla-extract `.css.ts` → 정적 `.css` 추출이 검증되는** 것을 실측 선택. 선택 결과·근거를 §5 #1에 기록.

### B. `@bds/tokens` 패키지

- [x] B1. `packages/tokens/package.json` 생성 — name `@bds/tokens`, `publishConfig.access: public`, build script, exports 맵(**semantic CSS + TS만** 노출, primitive 비공개).
- [x] B2. `packages/tokens/tsconfig.json` 생성(패키지 로컬, 공유 tsconfig 패키지는 만들지 않음 — ADR-0006).
- [x] B3. `packages/tokens/style-dictionary.config.*` 생성 — DTCG 입력, `outputReferences: true`, 출력 `css/variables`(`--bds-*`) + `typescript/es6`(+`.d.ts`).
- [x] B4. `src/primitive/*.json` — Radix식 12-step으로 **Button이 쓰는 hue만**(brand 1색 + gray + danger). oklch. step 11/12 텍스트 대비 단계 포함.
- [x] B5. `src/semantic/color.json` — DESIGN.md 역할(primary/danger/neutral 등)을 primitive **alias**로. spacing/radius semantic도 Button 소요분만.
- [x] B6. `src/domain/*.json` — `price-up`/`price-down` **의미 네이밍**으로 최소 정의(레이어 실증용, 한국: up=red 계열). locale 스왑 메커니즘은 만들지 않음.
- [x] B7. `pnpm --filter @bds/tokens build` 성공 → `dist/bds-tokens.css`에 `--bds-*` 변수와 `var()` 참조 체인이, `dist/index.d.ts`에 토큰 타입이 나오는지 검증.
- [x] B8. `@bds/tokens`가 **primitive를 export하지 않음**을 확인(exports 맵·타입 표면 점검).

### C. `@bds/react` 패키지 + Button 슬라이스

- [x] C1. `packages/react/package.json` 생성 — `@bds/tokens` `workspace:*` 의존, exports(컴포넌트 + 추출 `.css`), build script(A2 선택 번들러), `publishConfig.access: public`. 단일 entry(서브패스는 추후).
- [x] C2. `packages/react/tsconfig.json` 생성.
- [x] C3. `src/theme.css.ts` — `createGlobalThemeContract`로 `@bds/tokens`의 `--bds-*`에 **타입 안전 매핑**(새 변수 생성 안 함, 변수명 일치).
- [x] C4. `src/Button/Button.css.ts` — vanilla-extract recipe, **semantic 토큰만** 참조(raw 색상 직접 사용 0), `:focus-visible` 포커스 링.
- [x] C5. `src/Button/Button.tsx` — base-ui 인터페이스 철학(prop·composition·controlled/uncontrolled) 차용, **base-ui 런타임 비의존**, intent variant.
- [x] C6. `src/index.ts` — Button + 타입 export.
- [x] C7. `pnpm --filter @bds/react build` 성공 → dist에 **정적 `.css` 추출**과 컴포넌트 JS·`.d.ts`가 함께 나오는지(`.css.ts` 미포함) 검증.
- [x] C8. 최소 렌더 검증 — Button이 semantic 토큰 색으로 렌더되고 `--bds-*` 변수를 소비하는지(임시 앱 또는 빌드 산출 점검).

### D. 워크스페이스 통합

- [x] D1. `turbo run build`가 tokens→react 순서(`dependsOn: ^build`)로 통과하는지 검증.
- [x] D2. 루트 `package.json` 스크립트 조정 — `build`를 `turbo run build`로 위임(lint/check는 현행 루트 일괄 유지). §5 #4 확정.
- [x] D3. `.gitignore`에 `dist/`·SD 산출 무시 추가(현재 무시 여부 확인 후).
- [x] D4. `@bds/react` 변경에 대한 **Changeset** 추가(초기 publish 전제, independent 버전).

### E. 의사결정 기록 (ADR)

- [ ] E1. `docs/adr/0009-*.md` 작성 — 스타일 엔진=vanilla-extract / 토큰 3층·Radix 12-step scale / 번들 포맷·exports(A2 결과). ADR-0006 "번들러·스타일·a11y 린트" 트리거 발동 기록(**supersede 아님**, 보충).
- [ ] E2. ADR-0006 표의 해당 항목에 "0009로 해소" 교차 참조 한 줄 추가(역사 보존, 표 자체 수정 최소).

### F. 협업 절차 (PROJECT.md)

- [ ] F1. `PROJECT.md` Work Board에 파일 락 등록(implement-phase가 수행) → 종료 시 Handoff Log 한 줄.
