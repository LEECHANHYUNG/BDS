# Research: 린트/포맷 노선 — oxlint+oxfmt vs Biome 재결정

> 작성: 2026-06-20 · 상태: **그릴링 완료 — oxc 채택 결정** (조사 잠정 결론과 의식적으로 다름, 아래 결정 블록 참조)
> 트리거: ADR-0004에서 "Biome 조건부 확정"으로 내려둔 결정을, oxc(oxlint+oxfmt)로 갈아탈지 재개봉할 새 근거가 있는지 확인.

## 🔒 그릴링 결정 (2026-06-20) — oxc 채택

> **중요:** 아래 §4의 *조사 잠정 결론*은 "Biome 유지가 합리적"이었다. 그러나 그릴링에서 **조사가 다루지 않은 축(학습 동기 + 전환 타이밍)**을 끌어내, 그 결론을 **의식적으로 뒤집어 oxc를 채택**했다. 조사는 "제품 합리성만" 본 것이고, 실제 결정은 거기에 학습 가치를 더해 내렸다. 이 모순은 의도된 것이며, ADR-0008에 그대로 박제한다.

| #   | 결정                                                                                                             | 근거                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 0   | **oxlint + oxfmt 채택, Biome 완전 제거**                                                                         | 조사 결론(Biome 유지)을 **학습 동기로 의식적으로 뒤집음**                                                  |
| 1   | 진짜 동기 = **현업 oxc 전환 대비 운영·유지보수 감각 습득** (속도 아님, airbnb 아님, 마이그레이션 행위 연습 아님) | —                                                                                                          |
| 2   | **지금 당장 전환** (첫 컴포넌트/1.0 대기 안 함)                                                                  | 코드 0줄인 지금이 전환 비용 최저점(재포맷 diff·CodeRabbit 재조정 최소)                                     |
| 3   | oxfmt beta 리스크 = **낮게 평가**                                                                                | "포매터는 코드 의미를 안 바꾼다 → 기능 영향 없음, diff로 즉시 가시·되돌리기 쉬움"                          |
| 4   | **type-aware 린트 지금 안 함**                                                                                   | 컴포넌트 0개라 잡을 코드 없음. 필요해지면 ESLint 보조(트리거 B)                                            |
| 5   | **airbnb 룰셋 도입 안 함**                                                                                       | oxlint가 ESLint 프리셋을 통째로 못 읽음 + DS 라이브러리엔 앱용 의견 과함. oxlint recommended + a11y로 시작 |
| 6   | **Biome 완전 제거** (공존 안 함)                                                                                 | 공존 시 전환 이점·학습 순수성·운영 면적 모두 악화                                                          |
| 7   | **새 ADR-0008로 supersede** (ADR-0004 수정 안 함)                                                                | 역사 보존 — "왜 조사와 다르게 갔는지" 판단 박제                                                            |
| 8   | 재평가 트리거 **A+B+C**                                                                                          | A: oxfmt 1.0 정체/포맷 깨짐 반복 시 / B: type-aware 필요 시 / C: a11y 룰 부족 실측 시                      |

### 파급 영향 (실행 체크리스트 — plan 단계로 이관)

1. `package.json` — `@biomejs/biome` 제거, `oxlint`+`oxfmt` 추가, `format`/`check` 스크립트 교체
2. `biome.json` 삭제 → `.oxlintrc.json`(+ oxfmt 설정) 신설
3. `.coderabbit.yaml`/ADR-0007 — `tools.biome` 처리 (**CodeRabbit의 oxlint 네이티브 지원 여부 확인 필요**)
4. ADR-0004 — 상단에 "Superseded by 0008" 표기
5. `docs/research/monorepo-foundation.md:77` — "oxfmt beta 시기상조" 기술과 모순 → 주석/갱신
6. `pnpm-lock.yaml` — 의존성 교체
7. `turbo.json` `lint`/`check` 태스크 — oxc 명령에 맞춰 점검

### 실행 전 확인할 미해결 질문

- **CodeRabbit이 oxlint를 네이티브 지원하나?** 안 하면 `tools.biome` off만 하고 oxc는 CodeRabbit 밖에서 도는 구조 — ADR-0007 의도(린트 신호 중복 회피)와 어긋나는지 점검.
- **oxfmt 0.x 설정 형식** — Codex가 실제 0.55.0 문서로 확인.

## 1. 조사 범위 & 질문

이미 이 레포는 **Biome v2(`@biomejs/biome ^2.4.16`)가 설치·동작 중**이며, `biome.json`·`pnpm format`/`pnpm check` 스크립트가 존재한다(`package.json`). ADR-0004는 Biome를 "조건부 확정"(a11y 부족 시 ESLint 보조)으로 이미 결정했다. 따라서 이 조사의 목적은 "신규 선택"이 아니라 **이미 내린 결정을 뒤집을 만한 새 사실이 있는가**를 확인하는 것이다.

핵심 질문:

1. **oxfmt 성숙도** — 2026-06 시점 정식 1.0(stable) 도달했나? Prettier 호환·안정성은?
2. **oxlint 성숙도** — 1.x stable인가? 프로덕션 채택·ESLint 대체 가능성·type-aware 한계는?
3. **a11y 정적 룰 커버리지** — Biome vs oxlint vs ESLint(jsx-a11y), 디자인 시스템 관점에서 차이가 결정적인가? 색 대비는 누가 잡나?
4. **이미 Biome 사용 중인 프로젝트의 전환 실익** — 속도·생태계·안정성 트레이드오프.

웹 축 집중 조사(서브에이전트 3개 병렬). 코드베이스 축은 위 현황 파악으로 충분.

## 2. 코드베이스 분석

- `package.json` — `@biomejs/biome ^2.4.16` devDependency. `format: "biome format --write ."`, `check: "biome check --write ."`. 루트에서 단일 Biome로 포맷·린트.
- `biome.json` — formatter(space indent, double quote) + linter(recommended) + git VCS 연동. **최소 설정** 상태, a11y 룰 커스터마이즈 없음(recommended에 a11y 포함).
- `turbo.json` — `lint`·`check` 태스크 정의(빈 설정). 현재 패키지가 0개라 실제 태스크는 루트 스크립트가 수행.
- `docs/adr/0004-...md` — Biome "조건부 확정". **첫 컴포넌트 패키지 추가 시 a11y 부족분을 실측**하고 부족하면 ESLint를 *보조*로 얹는다(Biome는 포맷·기본 린트 유지)는 후속 트리거가 명시돼 있음. 색 대비는 axe-core + Storybook a11y로 검증한다고 이미 결론.
- `docs/research/monorepo-foundation.md:77` — 기존 조사에서 이미 "oxfmt는 2026-06 현재 beta(1.0 미도달), 즉시 채택 시기상조"라고 기록. **이번 조사는 그 판단이 6/20 시점에도 유효한지 재확인하는 성격.**

→ 코드베이스 결론: Biome 전제로 모든 설정·ADR이 짜여 있다. oxc로 전환하면 `biome.json` 폐기 + oxlint/oxfmt 설정 신설 + `package.json` 스크립트 교체 + (포맷 통합이던 것을) 린트·포맷 2도구 운영으로 분리해야 한다.

## 3. 외부 조사 — 최신 동향 & 모범 사례 (2026-06-20 기준)

### 3-1. oxfmt — **여전히 beta, 1.0 미도달** ← 이 조합의 약한 고리

- 최신 버전 **0.55.0** (2026-06-15 발행). npm dist-tag는 `latest` 하나뿐 — **stable 라인 자체가 없고 0.x를 latest로 발행**. 주 1회 빠른 릴리스.
- beta 발표(2026-02-24). Prettier JS/TS conformance 테스트 **100% 통과**하나, 공식 문서가 _"Prettier 플러그인의 정확한 동작에 의존한다면 Prettier에 남으라"_ 고 명시 경고. 기본 printWidth 100(Prettier 80과 다름), 일부 config 옵션 미지원, 별도 "Unsupported features" 문서 존재.
- **공식 1.0 stable 출시일 미공표** (로드맵상 "stable을 향해"만).
- 성능: Prettier 대비 30배+, Biome 대비 3배.
- 출처: https://oxc.rs/blog/2026-02-24-oxfmt-beta , https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html , npm `oxfmt` 0.55.0(2026-06-15)

### 3-2. oxlint — **1.x stable, 프로덕션 성숙**

- **1.0 stable 2025-06-10 출시**, 최신 **1.70.0**(2026-06-15). SemVer 적용.
- 속도 ESLint 대비 50~100배. 채택: Shopify, Airbnb, Mercedes-Benz, Zalando, Bun, Preact.
- 네이티브 650+ 룰. **JS 플러그인 alpha(2026-03-11)** — "ESLint 사용자 80%가 그냥 전환 가능". 단 **type-aware/type-checked 룰은 미지원** → 이 영역은 typescript-eslint(ESLint) 병행 필요.
- 출처: https://voidzero.dev/posts/announcing-oxlint-1-stable , https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha

### 3-3. a11y 정적 룰 커버리지 — **세 도구 사실상 동률**

| 도구                           | a11y(JSX) 룰 수 | color contrast | 비고                                                                       |
| ------------------------------ | --------------- | -------------- | -------------------------------------------------------------------------- |
| eslint-plugin-jsx-a11y v6.10.2 | ~35 현역        | **없음**       | de-facto 기준, JSX 전용                                                    |
| Biome v2                       | ~37             | **없음**       | jsx-a11y 거의 전체 포팅 + 고유 룰(useSemanticElements 등) + HTML a11y 별도 |
| oxlint                         | ~35             | **없음**       | jsx-a11y 원본 이름 미러링, 일부 기본 off                                   |

- 셋 다 jsx-a11y 룰셋을 공유 → 커버리지 차이 미미(모두 30대 중후반). **Biome가 고유 룰·HTML a11y까지 더해 근소하게 가장 넓다.**
- **색 대비는 세 도구 모두 정적으로 못 잡는다.** 렌더된 DOM의 computed color·배경·폰트크기를 알아야 WCAG 대비비 계산이 가능하기 때문. → axe-core(런타임) / Storybook a11y addon이 어느 도구를 고르든 **필수 별도 레이어**. (ADR-0004의 기존 결론과 일치.)
- 출처: https://biomejs.dev/linter/javascript/rules/ , https://oxc.rs/docs/guide/usage/linter/rules.html , https://github.com/jsx-eslint/eslint-plugin-jsx-a11y

### 3-4. 2026년 실무 동향 — "이미 Biome면 갈아탈 실익 없음"

- 신규 프로젝트 다수 권장값 = **Biome 단독**(속도가 아니라 통합성: 단일 바이너리·단일 설정·`biome ci` 원자 검증·Prettier 충돌 없음). (jsmanifest 2026-06-15, pkgpulse 2026-03-17)
- **핵심 — 실제 마이그레이션 회고**(charpeni 2026-05-13): ESLint/Biome/Prettier 혼합 → oxlint+oxfmt 전환 시 81초→2.5초(97%↓). 단 그 극적 수치는 _ESLint가 섞여 있던_ 덕분. **"이미 Biome 단독인 프로젝트의 이득은 negligible — 한 프로젝트는 두 설정 모두 ~500ms 유지"**. 전환 동기는 속도가 아니라 ESLint 플러그인 호환·넓은 룰셋.
- oxlint 포지션 = "ESLint 완전 대체보다 **병행(CI 가속)** 신중론"(pkgpulse). Biome 포지션 = "**단독 사용**이 일반적". 성격 자체가 다름.
- 출처: https://charpeni.com/blog/migrating-from-eslint-biome-prettier-to-oxlint-oxfmt , https://jsmanifest.com/biome-oxlint-comparison-2026 , https://www.pkgpulse.com/guides/biome-vs-eslint-vs-oxlint-2026

## 4. 종합 발견 & 권장 방향

> ⚠️ **아래는 "제품 합리성만" 본 조사 잠정 결론이다.** 그릴링에서 학습 동기·전환 타이밍 축을 더해 **이 결론을 의식적으로 뒤집어 oxc를 채택**했다(문서 상단 결정 블록). 이 §4는 "왜 제품 합리성만으로는 Biome 유지가 맞았는지"의 근거로 보존한다 — oxc 채택이 그 비용을 _알고도_ 학습 가치로 상쇄한 결정임을 보이기 위함.

**(조사 잠정 결론) ADR-0004의 Biome 결정을 뒤집을 _제품 합리성 측면의_ 새 근거는 없다. 그 관점만 보면 Biome 유지가 합리적.** 근거:

1. **oxfmt가 아직 beta(0.55.0, 1.0 미공표).** 포매터를 beta로 운영하는 것은 공개 npm publish가 산출물(ADR-0001)인 라이브러리에 불필요한 운영 리스크. Biome 포매터는 stable. → 조합의 약한 고리가 그대로 남아 있음.
2. **속도 실익이 이 규모에선 0에 수렴.** 패키지 2개+데모 앱 규모는 Biome 단독으로 이미 ~500ms대. 실측 회고가 "이미 Biome면 negligible"이라 못박음. ADR-0001 "B(인프라)에 시간 쏟지 마라"와 정확히 충돌하는 게 전환 비용 쪽.
3. **a11y 커버리지에서 oxc 우위 없음.** 디자인 시스템 선택 기준이던 a11y는 세 도구가 동률이고 오히려 Biome가 근소 우위. 색 대비는 어느 쪽도 못 잡아 axe-core/Storybook이 어차피 필수 — 도구 선택과 무관.
4. **전환은 통합→분리로 후퇴.** 현재 "포맷+린트 단일 Biome"를 "oxlint+oxfmt 2도구 + (type-aware 룰은) ESLint"로 쪼개는 셈. 작은 팀의 운영 단순성을 깎는 방향.

### 디자인 시스템 제품 맥락

- 접근성: 정적 룰은 Biome로 충분(근소 우위). **색 대비·포커스·실제 키보드 동작은 axe-core + Storybook a11y addon에서 검증** — 이건 도구 결정과 독립적으로 반드시 별도 도입해야 함(ADR-0004 기존 결론 유지).
- 신뢰성: 공개 publish 라이브러리에서 포매터가 beta라는 점은 회피할 운영 위험.

### 트레이드오프 (Biome 유지 시 포기하는 것)

- oxlint의 50~100배 CI 속도 — 단 현 규모에서 체감 이득 없음, CI 도입 시점에 재평가 가능.
- oxlint의 넓은 ESLint 플러그인 호환 — 단 현재 의존하는 ESLint 플러그인이 0개라 실익 없음.
- → 둘 다 **"미래에 필요해지면"** 트리거이지 지금 전환 사유가 아님.

### type-aware 린트는 어느 쪽도 ESLint를 못 이긴다

Biome·oxlint 모두 typescript-eslint 수준의 type-aware 룰엔 못 미침. 즉 "타입 인지 린트가 꼭 필요"해지면 **어느 도구든 ESLint 병행**이 답 — 이 축은 oxc vs Biome 선택을 가르지 않는다.

## 5. 미해결 질문 / 개발자 검토 필요 지점

1. **oxlint를 "린터로만" 병행할 의향이 있는가?** 포매터는 Biome 유지(stable)하되, oxlint를 추가 린터로 얹는 하이브리드도 가능하다. 단 현 규모에선 룰 중복·운영 복잡도만 늘 뿐 실익이 불분명 — 권장하지 않으나 사용자가 "넓은 룰셋"을 원하면 선택지.
2. **재평가 트리거를 언제로 잡을 것인가?** (a) oxfmt 1.0 stable 정식 출시 시, (b) CI 파이프라인 도입으로 린트 속도가 실제 병목이 될 때, (c) ESLint 플러그인 의존이 생길 때 — 이 중 어느 것을 ADR에 박을지.
3. **ADR-0004를 갱신만 할지, 별도 ADR로 남길지.** 이번 재검토 결과(= 기각, Biome 유지)를 ADR-0004의 "Considered Options"에 oxc 항목을 추가하는 방식 vs 새 ADR로 기록하는 방식 — 그릴링에서 결정.
