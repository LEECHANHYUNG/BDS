# 워크스페이스 패키지 구조 = `@bds/tokens` + `@bds/react` 2패키지, L1/L2는 `@bds/react` 내부

`packages/` 아래 publish 단위를 어떻게 쪼갤지 결정한다. ADR-0002의 2층 구조(L1 범용 / L2 증권 도메인=본체)를 **몇 개의 npm 패키지로** 표현할 것인가가 핵심이다. 결론: **2패키지** — `@bds/tokens`(디자인 토큰)와 `@bds/react`(L1·L2 컴포넌트). L1/L2는 별도 패키지로 쪼개지 않고 `@bds/react` **내부 폴더**로 구분한다.

- **토큰은 분리한다.** 토큰은 컴포넌트와 독립된 가치를 가진다 — 디자이너·다른 프레임워크·문서가 토큰만 소비할 수 있고, "DTCG로 토큰을 다룬다"(A·C)를 별도 publish 단위로 증명할 수 있다. 변경 빈도도 컴포넌트와 달라(토큰만 조정되는 경우가 잦다) independent 버저닝과 맞는다.
- **L1/L2는 한 패키지 안에 둔다.** 소비자가 0개인 포폴 단계에서 L1·L2를 별도 publish 패키지로 쪼개면 publish·버전·`exports` 설정이 패키지 수만큼 늘어 ADR-0001이 경계한 B(인프라) 과투자가 된다. 2층 구분은 `@bds/react` 내부 폴더와 (컴포넌트 단계에서 정할) exports 서브패스로 충분히 드러낼 수 있다.
- **스코프 = `@bds/*`.** 프로젝트명(BDS)과 일치해 포폴 산출물로 가장 깔끔하다. publish 시점에 npm `@bds` org 점유를 확인해야 하며, 선점됐으면 `@bds-ds` 또는 유저 스코프로 폴백한다.
- **버전 전략 = independent.** `@bds/tokens`와 `@bds/react`는 각자 버전을 갖는다(Changesets `fixed`/`linked` 미사용). 변경 빈도가 달라 독립 버전이 더 정확한 신호다.

## Considered Options

- **3패키지+ (`tokens`/`primitives`/`stock`)**: L1·L2를 별도 publish로 분리해 의존 방향이 명시적이나, 설정 비용이 패키지 수만큼 늘어 B 과투자로 기각.
- **1패키지 (`@bds/react` 단일, 토큰 포함)**: 설정 최단순이나 2층 구조를 publish 단위로 못 보여주고, 토큰만 쓰려는 소비자를 대응 못 해 기각.
- **fixed/linked 버전**: 패키지가 많고 항상 함께 릴리스되는 대형 DS의 이점 — 2패키지 규모엔 불필요.

## Consequences

- 스코프 `@bds/*`는 publish 후 변경 비용이 매우 크다(소비자 import 경로 전체가 바뀜). 첫 publish 전 org 점유 확인이 선행 작업으로 남는다.
- `@bds/react` 내부 L1/L2의 **exports 서브패스 노출 방식**(예: `@bds/react/stock`)은 번들러·번들 포맷과 묶이므로 컴포넌트 단계로 보류한다(ADR-0006).
- 현재 `.changeset/config.json`의 `fixed:[]`·`linked:[]`, `pnpm-workspace.yaml`의 빈 `catalog`는 이 결정과 이미 일치한다 — 파일 변경 없음.
