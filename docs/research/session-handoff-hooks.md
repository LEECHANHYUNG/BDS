# Research: 세션 핸드오프 자동화 훅 (Stop / SessionEnd / SessionStart)

> 작성: 2026-06-19 · 상태: 검토 완료 → 계획 단계로 이관

## 확정된 방향 (사용자 결정, 2026-06-19)

1. **요약 방식 = 하이브리드**: `Stop` 훅이 매 턴 raw 스냅샷(비용 0, 크래시 보험), `SessionEnd` 훅이 세션 끝 1회 `claude -p`로 4항목 지능형 요약 생성, `SessionStart` 훅이 시작 시 1회 주입.
2. **파일 위치 = 루트 `./handoff.md`** + `/handoff.md`를 `.gitignore`에 추가(원요청 유지, git 오염만 차단).

## 1. 조사 범위 & 질문

세션 종료 시 오늘 세션을 요약한 `handoff.md`를 자동 생성하고, 새 세션 시작 시 이를 컨텍스트에 자동 주입하는 훅 2개를 만들 수 있는지 검증한다. 핵심 질문:

1. Stop 훅은 **매 턴 끝마다** 도는가, **세션 종료 시** 한 번 도는가?
2. `transcript_path`(JSONL)를 어떻게 "요약"으로 변환하나? bash만으로? `claude -p` 호출?
3. `/clear`·세션 종료를 잡는 별도 훅(SessionEnd 등)이 있는가?

## 2. 코드베이스 분석

현재 BDS 레포 상태:

- `.claude/settings.json` — **없음**. 훅 설정이 들어갈 파일을 새로 만들어야 한다.
- `.claude/settings.local.json` — 존재. `permissions.allow`만 있고 `hooks` 키 없음. (개인 로컬 설정 — git 추적 대상이 아닐 가능성)
- `.gitignore` — `handoff` / `.claude` 항목 없음. → 루트에 `handoff.md`를 두면 **git 추적 대상**이 되어 매 턴 `git status`를 오염시킨다.
- 기존 `handoff.md` — 없음.
- **이미 `PROJECT.md`가 현황판(Work Board / Handoff Log)으로 운영 중** (CLAUDE.md·collab-protocol 기준). 새 `handoff.md`와 역할이 겹칠 소지가 있음 → §5 미해결.

## 3. 외부 조사 — 공식 문서 기준

출처: code.claude.com/docs (hooks-guide, hooks reference, headless mode)

### (1) Stop 훅 발화 시점 — **내 초기 단정이 일부 맞았음**

- Stop 훅은 **Claude가 매 응답(턴)을 끝낼 때마다** 발화한다. "세션 종료 시 한 번"이 **아니다**. → 세션 요약을 Stop에 거는 것은 **매 턴 재생성**이 되어 부적절.
- `stop_hook_active` 필드: Stop 훅이 `exit 2`로 Claude를 계속 작업하게 강제한 적이 있으면 다음 턴에 `true`로 전달됨. 무한루프 방지용. 8회 연속 차단 시 자동 무시(`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`).
- `SubagentStop`은 자식 에이전트 종료 시 발화(별개).

> 출처: https://code.claude.com/docs/en/hooks-guide , https://code.claude.com/docs/en/hooks.md

### (2) SessionEnd 훅 — **존재함. 내 초기 단정이 틀렸음**

세션 종료를 잡는 **공식 `SessionEnd` 훅이 존재한다.** "true 세션 종료 훅이 없다"는 내 초기 발언은 오류.

- **matcher(reason) 값**: `clear`, `logout`, `prompt_input_exit` 등. (`resume`, `bypass_permissions_disabled`, `other` 등 추가 값은 서브에이전트가 출처를 명확히 못 댐 → 신뢰도 중)
- **제약**: SessionEnd는 **정리(cleanup) 전용**. 도구 차단 불가, **Claude에 컨텍스트 추가 불가** (이미 세션 종료 중). → 로깅·파일 저장·외부 알림 용도.
- ✅ 즉 **세션이 실제로 끝날 때 한 번만** `handoff.md`를 쓰기에 **Stop보다 SessionEnd가 정확한 트리거**다.

> 출처: https://code.claude.com/docs/en/hooks-guide (Clean up on session end)

### (3) SessionStart 훅 — 컨텍스트 주입 가능 ✅

- **source 값**: `startup`, `resume`, `clear`, `compact`.
- **주입 메커니즘**: SessionStart 훅이 `exit 0`으로 **stdout에 출력한 텍스트가 그대로 Claude 컨텍스트에 추가된다.** → `cat handoff.md` 만으로 주입 가능. (구조화 출력 `hookSpecificOutput.additionalContext`도 가능)
- `/clear` 시 `source=clear`로 발화. (단, 일부 IDE 확장 버전에서 `startup`으로 오는 버그 이슈 보고됨 → 매처를 너무 좁히지 말 것)

> 출처: https://code.claude.com/docs/en/hooks-guide (Re-inject context)

### (4) 훅 공통 stdin JSON

```json
{ "session_id": "...", "hook_event_name": "...", "cwd": "...",
  "transcript_path": "/path/to/transcript.jsonl", "permission_mode": "..." }
```

- `transcript_path` → **JSONL 파일**. 각 줄이 user/assistant 메시지·도구 호출 결과를 담은 JSON 객체. 즉 세션 전체 대화가 들어있다.

> 출처: https://code.claude.com/docs/en/hooks-guide (Read input and return output)

### (5) 요약 생성 방법 — **핵심**

- **(a) bash/jq만**: JSONL에서 메시지 텍스트 raw 추출은 가능하나, "오늘 한 일 3줄 / 다음 할 일 / 하지 말 것" 같은 **지능적 4섹션 요약은 불가능**. 그냥 잘라붙이기일 뿐.
- **(b) 훅 안에서 `claude -p`(headless) 호출**: 기술적으로 가능. `claude -p "..." --output-format ...`로 transcript를 읽혀 요약 생성. 단:
  - 공식 문서가 "훅에서 요약하라"고 명시 권장하진 **않음** (신뢰도 중).
  - **재귀/중첩 위험**: SessionEnd에서 `claude -p`를 띄우면 그 자식 세션이 또 SessionStart/End 훅을 발화시킬 수 있음 → 훅을 우회하거나 가드 필요.
  - 비용·지연: SessionEnd는 세션당 1회뿐이라 **매 턴 도는 Stop보다 훨씬 안전**. 1회 호출이면 비용 감당 가능.

> 출처: https://code.claude.com/docs/en/headless.md , https://code.claude.com/docs/en/hooks.md

### (6) /clear가 발화시키는 훅

`/clear` → **SessionEnd(reason=clear)** → 이어서 **SessionStart(source=clear)**. (Stop은 그 직전 마지막 턴에서 이미 돌았을 수 있음)

## 4. 종합 발견 & 권장 방향

**내 초기 진단 정정:**

| 내 초기 주장 | 검증 결과 |
|---|---|
| "Stop은 세션 종료가 아니라 매 턴 돈다" | ✅ **맞음** — Stop에 요약 걸면 매 턴 재생성됨 |
| "true 세션 종료 훅이 없다" | ❌ **틀림** — `SessionEnd`(reason=clear/logout/...)가 존재 |
| "bash만으로는 지능형 요약 불가" | ✅ **맞음** — 지능형 요약엔 `claude -p` 필요 |

**따라서 기술적으로 가능하다. 단, 사용자가 말한 "Stop 훅"이 아니라 `SessionEnd` 훅이 정답이다.**

권장 아키텍처:

1. **요약 작성 = `SessionEnd` 훅** (Stop ❌). reason=clear/logout/prompt_input_exit에서 발화. 세션당 1회 → 비용·중복 문제 없음.
2. 요약 본문 = 훅 bash가 `claude -p`(headless)로 `transcript_path` JSONL을 읽혀 **4섹션 형식**으로 생성 → `handoff.md` 덮어쓰기.
   - 재귀 방지: headless 호출에 훅을 안 타게 하는 가드(별도 설정/플래그)가 필요. 또는 마커 파일·환경변수로 재진입 차단.
3. **주입 = `SessionStart` 훅**. source=resume/clear/startup에서 `handoff.md`를 stdout으로 출력 → 컨텍스트 주입.
4. **파일 위치**: 루트 `./handoff.md`는 git 오염 → `.claude/handoff.md` + `.gitignore` 권장. (단 사용자가 루트 고집 시 .gitignore에 `/handoff.md` 추가)

**금융 도메인/협업 고려**: BDS는 이미 `PROJECT.md`를 현황판으로 운영. 자동 `handoff.md`가 PROJECT.md의 Handoff Log와 **두 개의 진실 공급원(SSOT)** 으로 충돌할 위험. → §5.

## 5. 미해결 질문 / 개발자 검토 필요

1. **`claude -p` 호출을 받아들일 것인가?** "요약"을 진짜 원하면 SessionEnd 훅이 headless Claude를 1회 호출해야 한다(소액 비용·약간 지연·재귀 가드 필요). bash 덤프로 타협하면 비용 0이나 4섹션 지능형 요약은 포기. → **이게 가장 큰 갈림길.**
2. **PROJECT.md와의 관계**: 자동 `handoff.md`는 개인용 단기 메모로 분리할지, 아니면 PROJECT.md Handoff Log를 갱신하게 할지. 두 핸드오프 표면이 충돌하지 않게 경계를 정해야 함.
3. **파일 위치**: 루트 `./handoff.md`(요청대로, git 오염 감수) vs `.claude/handoff.md`(gitignore).
4. **재귀 가드 구체안**: headless 자식 세션이 SessionEnd/Start 훅을 다시 안 타게 할 정확한 방법(마커 파일 vs 환경변수 vs `--bare` 등)은 문서 미확인 — 계획 단계에서 실제 동작 확인 필요.
5. **`settings.json` vs `settings.local.json`**: 훅을 팀 공유(`settings.json`, git 추적)할지 개인용(`settings.local.json`)으로 둘지.
