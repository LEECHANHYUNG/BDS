# 디자인 토큰 3층 + vanilla-extract 정적 CSS Button 슬라이스

> Completes the first-component triggers from [ADR-0006](0006-deferred-scaffolding-decisions-and-triggers.md). Supersede는 아니다.

첫 컴포넌트 시점에 미뤄둔 토큰 파이프라인, 번들러, exports, 스타일 엔진, 접근성 보강 판단을 Button 하나로 실측했다. 범위는 전 팔레트가 아니라 Button이 실제로 쓰는 최소 토큰과 빌드 경로다.

## Decision

- `@bds/tokens`는 DTCG JSON을 Style Dictionary로 빌드한다. `style-dictionary@5.4.4`는 DTCG oklch color 객체를 `color/oklch`로 `oklch(...)` 출력하고, dimension `{ value, unit }` 객체는 `size/rem`으로 `rem`/`px` 단위를 보존한다.
- 토큰 레이어는 `primitive → semantic → domain semantic` 3층으로 둔다. primitive는 CSS alias 해소용 내부 입력이며, 패키지 TS public surface는 semantic/domain 토큰만 `var(--bds-...)` 문자열로 export한다.
- 색상 primitive는 Button 검증에 필요한 `blue`/`gray`/`red` 12-step만 둔다. 전 hue 팔레트와 density 축은 만들지 않는다.
- `@bds/react` 스타일 엔진은 vanilla-extract다. 컴포넌트는 semantic CSS 변수만 참조하고 raw 색상값을 직접 쓰지 않는다.
- `@bds/react` 빌드는 Vite library mode + `@vanilla-extract/vite-plugin`으로 JS와 정적 `styles.css`를 만들고, 타입은 `tsc --emitDeclarationOnly`로 만든다. 소비자는 vanilla-extract 플러그인 없이 `@bds/react/styles.css`를 import한다.
- 패키지 exports는 root entry와 `./styles.css`만 둔다. L2 서브패스는 L2 컴포넌트가 생길 때 다시 판단한다.
- Button은 native `<button>` 기반, ref forwarding, `intent: primary | danger | neutral`, `:focus-visible` 포커스 링을 제공한다. base-ui는 런타임 의존하지 않고 인터페이스 철학만 따른다.

## Considered Options

- **tsup**: `tsup@8.5.1`과 `@vanilla-extract/esbuild-plugin` 조합은 정적 CSS, JS, root `.d.ts`를 모두 만들었다. 그러나 ADR-0006에서 기록한 유지보수 정체 리스크가 남아 선택하지 않았다.
- **tsdown**: `tsdown@0.22.3`은 빌드는 통과했지만 정적 CSS를 만들지 않고 `@vanilla-extract/css` 런타임 import가 남았다. 이번 기준에 맞지 않아 기각한다.
- **Vite + dts plugin**: CSS/JS 추출은 성공했지만 `vite-plugin-dts@5.0.2` 출력 경로가 exports 기준과 맞지 않았다. Vite는 CSS/JS 번들러로만 쓰고 타입은 `tsc`로 분리한다.
- **component token 선도입**: Button 하나만 있는 지금은 조기 전역화다. spacing/radius/focus도 semantic 토큰으로만 만들고 Button 전용 component token은 만들지 않는다.

## Consequences

- `@bds/tokens`의 CSS에는 primitive 변수도 포함된다. 다만 primitive는 TS exports에 없고 `@bds/react`는 semantic contract만 참조한다.
- `@bds/react` 소비자는 토큰 CSS와 React CSS를 명시적으로 import해야 한다. 자동 CSS 주입은 하지 않는다.
- 다크모드, locale 색상 스왑, 전 팔레트, Storybook, axe-core/Chromatic은 아직 도입하지 않는다. 이 결정은 Button 수직 슬라이스를 위한 최소 결정이다.
- 첫 Button은 native element라 별도 ARIA가 필요하지 않다. 정적 접근성은 현재 oxlint `jsx-a11y` 체계로 시작하고, 실제 키보드/대비 검증은 Storybook 도입 시 axe 계열로 보강한다.

## 재평가 트리거

- vanilla-extract 릴리스 정체가 실제 유지보수 문제로 이어지거나 Vite 플러그인 호환이 깨지면 CSS Modules 또는 다른 zero-runtime 엔진으로 이관한다.
- React 패키지에 CJS 소비자가 생기면 dual package 또는 별도 조건부 exports를 검토한다.
- 3개 이상 컴포넌트가 같은 컴포넌트 수준 결정을 공유하면 component token 승격을 검토한다.
