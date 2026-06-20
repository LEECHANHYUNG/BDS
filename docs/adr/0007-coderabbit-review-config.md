# CodeRabbit 리뷰 설정 = 한국어·chill·머지 비차단·도구 선택, 경로 관점은 보류

PR에 AI 코드 리뷰(CodeRabbit)를 붙인다. 설정(`.coderabbit.yaml`)의 각 선택을 이 레포 고유 제약(ADR-0001 C>A>B·공개 publish, 한국어 컨벤션, Claude·Codex 분업, ADR-0006 "필요 시점에 도입")에 비춰 하나씩 확정한 기록이다. 핵심은 **CodeRabbit을 게이트키퍼가 아니라 조언자로** 두고, 로컬 정적 도구와 신호가 겹치지 않게 역할을 나누는 것.

- **언어 = `ko-KR`.** 레포 전체 문서·커밋·PR 템플릿이 한국어이고 `CLAUDE.md`가 한국어를 못박았다. 리뷰를 사람이 읽을 표면으로 삼으므로(PROJECT.md 철학), 영어 출력의 미세한 기술 정확도 이점보다 **이해 가능성**을 우선한다.
- **프로파일 = `chill`.** oxlint/oxfmt가 포맷·기본 정적 검사를 잡는다(ADR-0008). `assertive`로 두면 스타일·기본 린트 신호를 중복 지적해 신호가 겹친다. `chill`은 사람·도구가 못 잡는 **설계·로직·접근성·도메인 위험**에 집중하게 해 역할이 깔끔히 나뉜다. 1인+Codex 흐름에서 nit 폭격은 노이즈다.
- **`request_changes_workflow = false`.** 현재 CI/required check가 없다(ADR-0006 보류). CodeRabbit만 머지를 막게 하면 AI 오탐 하나가 머지를 봉쇄한다. 머지 판단은 사람이 쥔다. → **CI 도입 시 `true`로 전환**(재평가 트리거).
- **도구 = oxc on / Biome off / gitleaks on / markdownlint off.** CodeRabbit의 oxlint 키는 `oxc`다. `tools.biome.enabled`가 true면 oxlint가 돌지 않으므로 ADR-0008 전환에 맞춰 `biome:false`와 `oxc:true`를 함께 둔다. 공개 npm 레포라 gitleaks(시크릿 스캔)는 켜둔다. 한국어 문서가 많아 markdownlint는 줄길이·스타일 노이즈를 내므로 끈다. 나머지(eslint·ruff 등)는 해당 파일이 없어 기본 자동 감지에 맡긴다.
- **`auto_review.drafts = false`.** Codex가 구현 중인 WIP을 Draft로 올리는 핸드오프 흐름(PROJECT.md)에서, Draft마다 리뷰가 돌면 미완성 코드에 노이즈가 쌓인다. **"Ready for review" 전환 시점**에 리뷰가 돈다.
- **`knowledge_base.opt_out = false`(학습 유지).** 공개 레포라 민감 데이터가 없고, ADR·도메인 용어 학습이 리뷰 품질을 높인다.
- **`path_instructions`는 실재 경로(`docs/**`, `.changeset/**`)에만.** 글로벌 `instructions`에 레포 공통 관점(한국어 응대, 근거 없는 단정 지양, 금융 도메인·접근성·파급 영향)을 넣는다. `packages/**`는 현재 비어 있어(`.gitkeep`) 지금 관점을 박으면 죽은 설정 = ADR-0006이 경계한 "근거 없는 박제"다. → **첫 컴포넌트 패키지 시점**에 추가(yaml에 예시 주석으로 예고).

## Considered Options

- **언어 `en-US`**: 공개 레포 외부(영어권) 기여자 대응에 유리하나, 본팀이 한국어로 읽고 판단하므로 이해 가능성 손해가 더 크다. 기각.
- **프로파일 `assertive`**: "꼼꼼한 리뷰가 굴러간다"를 포폴로 보여줄 수 있으나 oxlint/oxfmt와 스타일·기본 정적 검사 신호가 겹쳐 노이즈. 도메인 관점은 `path_instructions`로 명시하는 쪽이 더 효과적이라 기각.
- **`request_changes_workflow: true` 즉시 도입**: 머지 게이트가 명확해지나 required check·CI 부재 상태에선 오탐 봉쇄 위험. CI 시점으로 보류.
- `packages/**` instruction 선박제: 첫 컴포넌트 시 즉시 작동하나, 경로·API가 미확정이라 추정 기반 설정. ADR-0006 보류 철학과 충돌해 기각(주석 예고로 대체).

## Consequences

- **재평가 트리거 2건.** (1) **CI 파이프라인 도입 시** `request_changes_workflow: true` 전환 검토(ADR-0006의 CI 보류 트리거에 연동). (2) **첫 L1 컴포넌트 패키지 추가 시** `packages/**` `path_instructions`(의미 토큰만 사용·색 단독 전달 금지·키보드/ARIA)를 추가 — ADR-0008 oxlint a11y 보강·ADR-0006 Storybook 트리거와 같은 시점이다.
- ADR-0008 이후 로컬 도구는 oxlint/oxfmt다. CodeRabbit 설정도 같은 결정을 따라 `tools.oxc.enabled: true`, `tools.biome.enabled: false`로 유지한다.
- CodeRabbit은 SaaS 외부 서비스다. publish·CI 단계에서 시크릿·민감 정보가 PR diff에 노출되지 않도록 주의한다(gitleaks가 1차 방어선).
- 설정은 현재 최소 상태다. `path_filters`·`tools`는 패키지·CI가 늘면 점진 보강한다(ADR-0001 C>A>B 일관 — 인프라 무지성 선투자 지양).
