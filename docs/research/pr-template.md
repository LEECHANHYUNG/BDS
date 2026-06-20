# Research: 디자인 시스템 PR 템플릿

> 작성: 2026-06-14 · 상태: 완료
> 조사 축: 코드베이스 ✅ / 웹 ✅ (둘 다)

## 1. 조사 범위 & 질문

현재 BDS 레포에는 GitHub PR 템플릿이 **전혀 없다**(`.github/` 디렉터리 자체가 부재). 일관된 PR 템플릿을 도입하기 위해, 우리 레포의 기여·릴리스 흐름과 업계 디자인 시스템의 PR 템플릿 모범 사례를 조사했다.

답하려는 핵심 질문:

1. GitHub PR 템플릿의 메커니즘 — 단일 vs 다중 템플릿, YAML 폼 지원 여부, 어디에 둬야 하는가.
2. 유명 디자인 시스템(Polaris, React Spectrum, Primer, Chakra, MUI, Ant Design, Carbon 등)은 실제로 어떤 PR 템플릿 구조를 쓰는가.
3. 디자인 시스템 PR 템플릿에 특히 들어가는 항목은 무엇인가(변경 유형, breaking/semver 영향, 시각 스크린샷, 접근성, Storybook/문서, 테스트).
4. Changesets 모노레포에서 changeset 안내를 PR 흐름에 어떻게 녹이는가.
5. 안티패턴 — 길어서 안 채워지는 문제를 피하는 짧고 효과적인 템플릿은.
6. (레포 특화) BDS의 협업 프로토콜·금융 도메인·기존 템플릿 문화와 PR 템플릿을 어떻게 정합시킬 것인가.

## 2. 코드베이스 분석

### 2.1 현황 — PR 템플릿 부재

- `.github/` 디렉터리 없음 → `PULL_REQUEST_TEMPLATE.md`, 이슈 템플릿, 워크플로 전무. (루트 `ls` 확인)

### 2.2 릴리스·버저닝 흐름 (Changesets)

- `.changeset/config.json` — `changelog: @changesets/cli/changelog`, `commit: false`, `baseBranch: main`, `access: public`, `updateInternalDependencies: patch`, `fixed`/`linked`/`ignore` 비어있음.
- `package.json:scripts` — `changeset` / `version-packages` (`changeset version`) / `release` (`turbo run build && changeset publish`). 즉 **PR마다 changeset 파일을 추가**하는 게 정상 흐름이며, 누락 시 버전 bump·changelog가 빠진다.
- `commit: false`이므로 changeset 생성/버전 커밋을 사람이 직접 한다 → PR 단계에서 changeset 누락을 잡지 못하면 릴리스에서 누락된다. **changeset 점검 항목이 PR 템플릿에 필요한 직접적 근거.**

### 2.3 모노레포 구조

- pnpm workspace: `packages/*`, `apps/*` (`pnpm-workspace.yaml`). 현재 둘 다 `.gitkeep`만 있고 패키지 없음 → 토큰/컴포넌트 패키지가 앞으로 들어온다. 다운스트림 의존이 생기면 **breaking change 영향·changeset semver 등급**이 PR에서 중요해진다.
- `package.json:engines` node>=22, pnpm@10.10.0. lint=`turbo run lint`, format/check=Biome.

### 2.4 기존 협업·템플릿 문화 (PR 템플릿이 정합해야 할 대상)

- `docs/templates.md` — 이미 **산출물 템플릿 문화**가 정착돼 있다: 컴포넌트 설계서·리스크 노트·핸드오프 한 줄. 공통 철학은 _"검토 표면(Review Surface)을 일정하게 유지"_. PR 템플릿도 같은 톤/철학으로 맞추는 게 자연스럽다.
- `docs/templates.md`의 **리스크 노트** 섹션이 곧 PR 체크리스트의 원천: `접근성 위험 / 금융 도메인 위험 / 파급 영향(breaking·Changeset) / 과장·추정`. → PR 템플릿 체크리스트를 이 4축과 정렬시키면 레포 고유의 일관성이 생긴다.
- `DESIGN.md` — 금융 디자인 원칙: 신뢰 우선, 명료함(tabular 숫자), 의미 토큰만 사용(raw 색상값 금지), 접근성 기본 탑재. → PR 체크리스트의 금융/접근성 항목 근거.
- `CLAUDE.md` / `AGENTS.md` / `docs/collab-protocol.md` — Claude=판단, Codex=실행 역할 분담. PROJECT.md Work Board 락 + Handoff Log 운영. → PR 템플릿에 "어느 도구가 무엇을 했는지 / Handoff Log 갱신했는지" 한 줄을 넣을지 검토 가치 있음(레포 특화 차별점).
- 커밋 규칙(`CLAUDE.md`, 글로벌): 한국어, Conventional Commit, **Co-Authored-By 금지**. → PR 템플릿/문서는 한국어로 작성한다.

## 3. 외부 조사 — 최신 동향 & 모범 사례

(조사 기준일 2026-06-14. 템플릿 본문은 각 레포 기본 브랜치의 실제 현재 내용.)

### 3.1 메커니즘 (현재 권장 방식)

- 저장 위치는 루트 `pull_request_template.md`, `docs/`, 또는 `.github/pull_request_template.md` 중 어디든 가능. 단일 템플릿이면 PR 생성 시 자동 채워짐. 출처: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
- **다중 템플릿**은 `.github/PULL_REQUEST_TEMPLATE/` 하위 여러 `.md` + URL `?template=파일명.md`로 선택. 자동 로드 안 되고 기여자가 URL로 명시 선택해야 함 → 운영 부담. 대부분의 디자인 시스템은 **단일 템플릿 + 본문 체크박스로 변경 유형 구분**. 출처: https://github.blog/news-insights/product-news/multiple-issue-and-pull-request-templates/
- 템플릿은 **기본 브랜치에 머지돼야** 노출됨(PR 안에 든 상태로는 미적용). 출처: 위 GitHub Docs.
- **YAML 폼 기반 PR 템플릿은 2026년 현재도 미지원.** 이슈는 YAML issue forms 가능하나, 공식 문서가 "Issue forms are not supported for pull requests" 명시. PR은 Markdown 전용. 출처: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms , https://github.com/orgs/community/discussions/175758

### 3.2 유명 디자인 시스템의 실제 PR 템플릿 구조

- **Shopify Polaris** — WHY(목적/이슈) → WHAT(요약, UI 변경 시 before/after 스크린샷 권장, GIF는 접근성 위해 `<details>`로 감싸기) → 테스트/문서 체크리스트(스냅샷·모바일/크로스브라우저·접근성·문서·changelog). 출처: https://github.com/Shopify/polaris/blob/main/.github/PULL_REQUEST_TEMPLATE.md
- **Adobe React Spectrum** — `Closes #` + 체크리스트(이슈 링크 / 유닛 테스트·Storybook / 테스트 지침 / 문서 / **ARIA Practices 접근성 검토**) + Test Instructions. 접근성을 명시 체크 항목으로. 출처: https://github.com/adobe/react-spectrum/blob/main/.github/PULL_REQUEST_TEMPLATE.md
- **GitHub Primer (primer/react)** — Closes → Changelog(New/Changed/Removed) → **Rollout strategy 체크박스(Patch/Minor/Major/None; Major면 마이그레이션 플랜 필수)** → Testing → Merge checklist(테스트·문서·Storybook 프리뷰·SSR·브라우저별). semver 영향을 PR에서 강제. 출처: https://github.com/primer/react/blob/main/.github/pull_request_template.md
- **Chakra UI** — Closes → Description → Current/New behavior → **`💣 breaking change Yes/No`(Yes면 영향·마이그레이션)** → Additional Info. "PR은 한 유형으로 작게" 안내. 출처: https://github.com/chakra-ui/chakra-ui/blob/main/.github/pull_request_template.md
- **MUI** — 의도적 극단적 미니멀: 체크박스 1개("기여 가이드를 따랐다")만. 짧은 템플릿 전략 대표. 출처: https://github.com/mui/material-ui/blob/HEAD/.github/PULL_REQUEST_TEMPLATE.md
- **Ant Design** — 변경 유형을 20여 체크박스로 세분화(기능/버그/문서/스타일/TS/번들/성능/i18n/리팩터/**접근성 개선** 등) → Related Issues → Background/Solution(UI 변경 시 스크린샷) → Change Log(영/중 2열 표). 출처: https://github.com/ant-design/ant-design/blob/master/.github/PULL_REQUEST_TEMPLATE.md
- **Carbon Design System** — Closes + 설명 → Changelog(New/Changed/Removed) → Testing → **PR Checklist(줄 단위 셀프리뷰 / 문서·Storybook / 통과 테스트 / 접근성 영향 / 크로스브라우저)**. "체크리스트 삭제 금지, 해당 없으면 취소선" 운영 규칙. 출처: https://github.com/carbon-design-system/carbon/blob/main/.github/PULL_REQUEST_TEMPLATE.md
- **AWS Cloudscape** — Description → How tested → `<details>`로 접은 Review checklist(문서·하위호환·**수동 접근성 테스트**·보안 URL 검증·테스트). 긴 체크리스트를 접어 본문 가독성 유지(모범적). 출처: https://github.com/cloudscape-design/components/blob/main/.github/PULL_REQUEST_TEMPLATE.md
- **Radix UI** — 안내(의미있는 제목+패키지명, 테스트·Storybook, 셀프리뷰) + Description 1섹션. 매우 가벼움. 출처: https://github.com/radix-ui/primitives/blob/main/.github/PULL_REQUEST_TEMPLATE.md

### 3.3 디자인 시스템 템플릿의 공통 항목

- 변경 유형 분류(feat/fix/breaking) — 단일 템플릿 내 체크박스가 다수파.
- **breaking change / semver 영향** — Chakra의 breaking Yes/No, Primer의 Rollout strategy. 토큰/컴포넌트 변경이 다운스트림을 깨뜨릴 수 있어 디자인 시스템 특유로 강조됨.
- 시각 변경 before/after 스크린샷(Polaris·Ant·Primer). GIF는 `<details>`로(스크린리더 배려).
- **접근성 체크리스트** — 거의 모든 디자인 시스템에 존재(일반 앱 레포 대비 두드러지는 차별 항목).
- Storybook/문서 업데이트 — 컴포넌트 라이브러리라 사실상 필수.
- 테스트(유닛/스냅샷 + 크로스브라우저).

### 3.4 Changesets 모노레포에서 changeset 안내 녹이기

- 권장 1차 수단은 템플릿 체크박스가 아니라 **`changeset-bot`(GitHub App)** — PR마다 자동 코멘트로 changeset 유무 알림, 없으면 파일명 미리 채운 추가 링크 제공. 비차단(blocking 아님). 출처: https://github.com/changesets/bot , https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md
- 템플릿에 넣을 땐 체크박스 한 줄: "changeset 추가(`pnpm changeset`) — 또는 불필요한 변경". 출처: https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md , https://infinum.com/handbook/frontend/changesets
- **봇(비차단) + 템플릿 체크박스(자가 점검)** 조합이 마찰 적음. CI hard block은 핫픽스/문서 PR에 마찰이라 선택 사항. 출처: https://blog.logrocket.com/version-management-changesets/

### 3.5 안티패턴 & 짧은 템플릿 가이드

- **가장 흔한 안티패턴: 너무 길어서 통째로 무시됨.** 시작은 짧게. 출처: https://luminousmen.com/post/github-pull-request-templates/ , https://graphite.com/guides/effective-pull-request-template
- 체크박스 남용 회피 → 조건부 섹션("해당 없으면 삭제/취소선", Carbon 채택), 긴 체크리스트는 `<details>`로 접기(Cloudscape).
- 코어 섹션 5~7개 + 나머지 조건부. 출처: https://www.minware.com/blog/effective-pr-template
- 스펙트럼: MUI/Radix(극단적 미니멀) ↔ Carbon/Cloudscape(체크리스트를 접거나 운영 규칙으로 관리). 합의에 가까운 방향: **"강제 입력은 적게, 자가 점검 체크리스트는 접어서."**

## 4. 종합 발견 & 권장 방향

### 4.1 결론

- **단일 템플릿**(`.github/PULL_REQUEST_TEMPLATE.md`)으로 시작한다. 다중 템플릿(`?template=`)은 운영 부담 대비 이득이 적고, 변경 유형은 본문 체크박스로 충분(업계 다수파).
- **한국어**로 작성한다(레포 규칙). 기존 `docs/templates.md`의 톤·"검토 표면 일정화" 철학을 그대로 잇는다.
- 길이는 **중간(예시 A 수준)** — 핵심 5~6섹션 + 긴 체크리스트는 `<details>`로 접어 가독성 확보.

### 4.2 권장 템플릿 골격 (BDS 특화)

기존 `docs/templates.md`의 리스크 노트 4축(접근성/금융 도메인/파급 영향/과장·추정)과 정렬한 형태:

```markdown
<!-- PR은 한 가지 유형으로 작게 유지해 주세요. UI 변경엔 before/after를 첨부하세요. -->

Closes #

## 변경 유형

- [ ] feat (신규 기능/컴포넌트/토큰)
- [ ] fix (버그 수정)
- [ ] docs / chore
- [ ] breaking change

## 무엇을, 왜

> 2~3문장 요약. breaking이면 영향과 마이그레이션 경로를 적어 주세요.

## 시각적 변경 (UI 변경 시)

| Before | After |
| ------ | ----- |
|        |       |

<!-- GIF는 접근성을 위해 <details>로 감싸 주세요. -->

## 체크리스트

- [ ] 테스트/타입체크 통과
- [ ] Storybook / 문서 갱신 (해당 시)
- [ ] 접근성: 대비비·키보드·ARIA·포커스 (DESIGN.md 기준)
- [ ] 금융 도메인: 숫자/통화/날짜 포맷·상태 표시 회귀 없음
- [ ] 의미 토큰만 사용(raw 색상값·임의 픽셀 하드코딩 없음)
- [ ] changeset 추가(`pnpm changeset`) — 또는 불필요한 변경
- [ ] (AI 협업 시) PROJECT.md Handoff Log 갱신
```

### 4.3 금융 도메인 / 레포 특화 고려

- 일반 디자인 시스템 템플릿엔 없는 **금융 회귀 항목**(숫자/통화/날짜 포맷, 모호한 상태 표시)을 체크리스트에 명시 → DESIGN.md 신뢰·명료 원칙과 직결.
- **의미 토큰 강제**(raw 색상/픽셀 금지) 항목 → DESIGN.md 일관성 원칙의 PR 게이트.
- **AI 협업 흔적**(Handoff Log 갱신) 한 줄 → Claude/Codex 분업 레포의 차별 항목. 단, 외부 기여자가 없을 땐 과할 수 있어 조건부로 둘지 검토 필요(§5).

### 4.4 함께 검토할 보완 수단 (PR 템플릿 자체와 별개, 선택)

- **changeset-bot 설치**(비차단 알림) — `commit:false`·packages 비어있는 현 시점엔 우선순위 낮지만, 컴포넌트 패키지가 들어오면 권장.
- (선택) `CONTRIBUTING.md` — 현재 없음. PR 템플릿이 가벼우려면 상세 규칙은 CONTRIBUTING으로 빼는 게 정석이나, 이미 README·collab-protocol·templates.md가 그 역할을 일부 한다.

### 4.5 트레이드오프

- 짧게 가면(예: MUI식) 채워지긴 쉽지만 디자인 시스템 고유 리스크(접근성·breaking·금융 포맷)를 놓치기 쉽다. ↔ 길게 가면 무시된다.
- 절충: 핵심 입력(변경 유형·요약·스크린샷)은 펼쳐두고, **체크리스트는 `<details>`로 접어** 양쪽을 모두 취한다.

## 5. 미해결 질문 / 개발자 검토 필요 지점

1. **길이/톤** — 위 §4.2(중간) vs 더 미니멀(MUI/Radix식) vs 더 두꺼운 접근성·semver 강조형(Primer/Carbon식) 중 어느 쪽을 기본으로 할지. (권장: §4.2 중간)
2. **AI 협업 항목** — "PROJECT.md Handoff Log 갱신" 체크박스를 PR 템플릿에 넣을지. 이 레포는 사람+2 AI 분업이 특수해 유용할 수 있으나, 일반적 PR 템플릿 관례에선 벗어남. (조건부/주석으로 둘지 사람 판단 필요)
3. **저장 위치** — `.github/PULL_REQUEST_TEMPLATE.md` 권장(숨김 디렉터리, 표준). 루트 노출을 원하면 루트 `pull_request_template.md`도 가능.
4. **changeset 강제 수준** — 템플릿 체크박스만(자가 점검) vs changeset-bot 설치 vs CI hard block. 현 시점(packages 비어있음)엔 체크박스만으로 충분해 보이나, 패키지 도입 시점에 봇 도입을 재검토.
5. **다국어 changelog** — Ant Design식 2열 changelog는 BDS엔 불필요해 보임(국내 단일 언어 가정). 확인 필요.
6. **이슈 템플릿** — 이번 범위는 PR 템플릿이나, `.github/`를 만드는 김에 이슈 템플릿(YAML forms 가능)도 함께 둘지는 별도 결정.
