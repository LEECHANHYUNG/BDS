# Plan: 세션 핸드오프 자동화 훅 (Stop / SessionEnd / SessionStart)

> 작성: 2026-06-20 · 상태: 승인됨 (2026-06-20) — 구현 핸드오프 대기
> 근거 조사: docs/research/session-handoff-hooks.md

## 1. 개요 & 목표

세션이 끝날 때 그 세션을 4항목으로 요약한 `./handoff.md`를 자동 생성하고, 새 세션이 시작될 때 그 내용을 컨텍스트에 자동 주입한다. 세션 간 맥락 유실("어제 뭐 하다 말았더라")을 없애는 게 목적.

**4항목 형식** (사용자 지정):

1. 오늘 한 일 (3줄 요약)
2. 다음 세션에서 가장 먼저 할 일
3. 절대 하지 말 것 (이미 시도했는데 안 된 것 / 지금 건드리면 안 되는 것)
4. 참고할 파일 경로 / 외부 링크

**달성하는 것**: 3개 훅(Stop·SessionEnd·SessionStart)과 2개 bash 스크립트, `.claude/settings.json` 신규 작성, `.gitignore` 한 줄 추가.

**달성하지 않는 것 (범위 경계)**:

- PROJECT.md(팀 현황판)를 대체하거나 자동 갱신하지 않는다. handoff.md는 **개인용 단기 메모**로 분리한다 (조사 §5-2 결론).
- handoff 히스토리 보관(날짜별 누적)은 하지 않는다. 단일 파일 덮어쓰기.

## 2. 접근 방식

조사에서 확정된 **하이브리드 3-훅 구조**. 핵심은 "매 턴 도는 Stop"과 "세션당 1회 도는 SessionEnd"의 역할을 분리하는 것이다.

```
[세션 진행 중]
  매 턴 끝 ──> Stop 훅 ──> snapshot.jsonl 경로만 기록 (비용 0, 크래시 보험)
[세션 종료: /clear, logout, exit]
  ──> SessionEnd 훅 ──> claude -p 로 transcript 요약 ──> ./handoff.md 덮어쓰기
[새 세션 시작]
  ──> SessionStart 훅 ──> ./handoff.md 를 stdout 출력 ──> 컨텍스트 주입
```

### 2-1. Stop 훅 — 매 턴 "스냅샷 포인터" 저장 (비용 0)

매 턴 도는 Stop에서 `claude -p`를 부르면 비용이 수십 배가 되므로(조사 §5), Stop은 **LLM을 부르지 않는다.** 대신 stdin으로 받은 `transcript_path`를 `.claude/.handoff-snapshot`에 한 줄로 기록만 한다. 세션이 크래시로 죽어 SessionEnd가 못 돌더라도, 이 포인터 파일을 보고 나중에 수동 복구할 수 있다(보험).

> **핸드오프 (미해결 b 해결)**: Stop과 SessionEnd 모두 stdin에서 동일한 `transcript_path`를 받는다. 따라서 SessionEnd가 굳이 Stop의 스냅샷에 의존할 필요가 없다 — SessionEnd도 자기 stdin의 `transcript_path`를 직접 읽으면 된다. Stop이 남기는 `.handoff-snapshot`은 **순수 크래시 보험**(SessionEnd가 영영 안 돌 때 마지막 transcript 위치를 아는 용도)이며, 정상 경로에서는 SessionEnd가 이를 읽지 않는다. → 두 훅 사이에 데이터 의존이 없어 결합도 최소.

### 2-2. SessionEnd 훅 — `claude -p`로 4항목 요약 생성

stdin JSON에서 `transcript_path`를 꺼내 그 JSONL을 `claude -p`에 물려 4항목 요약을 받아 `./handoff.md`에 덮어쓴다.

**(미해결 c) claude -p 정확한 호출 형식**:

- transcript JSONL은 통째로는 너무 크고 토큰 낭비라, `jq`로 user/assistant 텍스트만 추출해 프롬프트에 동봉한다.
- 프롬프트는 stdin이 아니라 인자로 주되, transcript 본문은 heredoc/파이프로 stdin에 흘려넣어 프롬프트가 그것을 요약하게 한다.
- `--output-format text`(기본) 사용. JSON 파싱 불필요 — 출력이 곧 handoff.md 본문.

**(미해결 a) 재귀/무한루프 가드 — 가장 중요**:
SessionEnd 훅이 `claude -p`를 부르면, 그 headless 자식 세션이 끝날 때 **또 SessionEnd 훅이 발화**해 무한 재귀에 빠질 수 있다. 3중 가드를 건다:

1. **환경변수 가드**: 훅 스크립트 진입 시 `HANDOFF_HOOK_RUNNING`이 이미 set이면 즉시 `exit 0`. `claude -p` 호출 직전 이 변수를 export → 자식이 발화시킨 훅은 이 변수를 보고 스스로 빠진다.
2. **`--settings` 우회 (검증 필요)**: `claude -p` 호출 시 빈 훅 설정을 주입하는 플래그가 있는지 구현 단계에서 실측한다. 환경변수 가드가 1차 방어선이므로 이건 보조.
3. **타임아웃**: 훅에 `timeout`(예: 120s)을 걸어 `claude -p`가 행 걸려도 세션 종료가 멈추지 않게 한다. settings.json의 훅 `timeout` 필드로도 상한을 건다.

> **claude 바이너리 경로 주의 (구현 단계 실측 항목)**: `which claude` → `/Applications/cmux.app/Contents/Resources/bin/claude`. 이게 cmux 래퍼일 수 있어, 훅 안에서 `claude -p`가 순수 headless로 도는지 구현 단계에서 반드시 실측한다. 안 되면 절대경로 지정 또는 대체 경로 탐색.

### 2-3. SessionStart 훅 — handoff.md 주입

`./handoff.md`가 있으면 그 내용을 stdout으로 출력(→ 컨텍스트 자동 주입). 없으면 조용히 `exit 0`. source 매처는 걸지 않는다(IDE 버그로 source가 startup으로 오는 이슈 — 조사 §3). 즉 startup/resume/clear/compact 모두에서 주입.

### 2-4. 파일 위치 & git

- `./handoff.md` — 루트(사용자 지정). `.gitignore`에 `/handoff.md` 추가해 git 오염 차단.
- `.claude/.handoff-snapshot` — Stop이 남기는 포인터. `*.local`엔 안 걸리므로 `.gitignore`에 `.claude/.handoff-snapshot`도 추가.
- 훅 스크립트는 `.claude/hooks/`에 둔다.

### 2-5. settings.json vs settings.local.json (미해결 d 해결)

`.gitignore`에 **이미 `*.local` 규칙이 있다**(확인함) → `settings.local.json`은 자동으로 git 무시됨. 훅을 **팀 공유**할 것이므로 `.claude/settings.json`(신규, git 추적)에 등록한다. handoff.md 자체는 개인 산출물이라 gitignore로 빠지지만, "이 레포는 세션 핸드오프 훅을 쓴다"는 설정은 공유 가치가 있음.

## 3. 변경될 파일 경로

- `.claude/settings.json` (신규) — 3개 훅 등록. 현재 없음(확인함).
- `.claude/hooks/handoff-snapshot.sh` (신규) — Stop 훅. transcript_path 포인터 기록.
- `.claude/hooks/handoff-write.sh` (신규) — SessionEnd 훅. claude -p로 요약 생성 후 handoff.md 작성.
- `.claude/hooks/handoff-inject.sh` (신규) — SessionStart 훅. handoff.md를 stdout 출력.
- `.gitignore` — `/handoff.md`, `.claude/.handoff-snapshot` 두 줄 추가.

> `.claude/settings.local.json`은 건드리지 않는다(현 permissions.allow 보존).

## 4. 코드 스니펫

실제 검증 전 초안이며, claude -p 호출 형식과 바이너리 경로는 구현 단계에서 실측 후 확정한다.

### `.claude/settings.json` (신규)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/handoff-snapshot.sh" }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/handoff-write.sh",
            "timeout": 120
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/handoff-inject.sh" }
        ]
      }
    ]
  }
}
```

### `.claude/hooks/handoff-snapshot.sh` (Stop, 비용 0)

```bash
#!/usr/bin/env bash
# Stop 훅: 매 턴 transcript 위치만 기록 (크래시 보험). LLM 호출 없음.
set -euo pipefail
input=$(cat)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty')
[ -n "$transcript" ] && printf '%s\n' "$transcript" > "$CLAUDE_PROJECT_DIR/.claude/.handoff-snapshot"
exit 0
```

### `.claude/hooks/handoff-write.sh` (SessionEnd, claude -p 요약)

```bash
#!/usr/bin/env bash
# SessionEnd 훅: transcript를 claude -p로 4항목 요약 → handoff.md 덮어쓰기.
set -euo pipefail

# (가드 1) 재귀 차단: headless 자식이 띄운 훅이면 즉시 탈출
if [ -n "${HANDOFF_HOOK_RUNNING:-}" ]; then exit 0; fi

input=$(cat)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty')
[ -z "$transcript" ] || [ ! -f "$transcript" ] && exit 0

# transcript에서 user/assistant 텍스트만 추출 (토큰 절약)
convo=$(jq -r '
  select(.message.role=="user" or .message.role=="assistant")
  | .message.role + ": " +
    (if (.message.content|type)=="string" then .message.content
     else ([.message.content[]? | select(.type=="text") | .text] | join("\n")) end)
' "$transcript" 2>/dev/null | tail -c 60000)   # 마지막 60KB만 (상한)

[ -z "$convo" ] && exit 0

prompt='아래는 한 Claude Code 세션의 대화 기록이다. 이걸 다음 4개 항목으로 한국어로 압축 요약해라. 군더더기 없이 핵심만.

## 1. 오늘 한 일
(3줄 이내)

## 2. 다음 세션에서 가장 먼저 할 일
(한 줄)

## 3. 절대 하지 말 것
(이미 시도했는데 안 된 것 / 지금 건드리면 안 되는 것. 없으면 "없음")

## 4. 참고할 파일 경로 / 외부 링크
(대화에 등장한 핵심 파일 경로와 URL)

대화 기록:
'

# (가드 1 set) + (가드 3 timeout). claude -p는 비대화형 headless.
summary=$(HANDOFF_HOOK_RUNNING=1 timeout 110 \
  claude -p "$prompt
$convo" 2>/dev/null) || exit 0

[ -z "$summary" ] && exit 0

{
  printf '# Handoff — 세션 종료 시점 자동 생성\n\n'
  printf '%s\n' "$summary"
} > "$CLAUDE_PROJECT_DIR/handoff.md"
exit 0
```

### `.claude/hooks/handoff-inject.sh` (SessionStart, 주입)

```bash
#!/usr/bin/env bash
# SessionStart 훅: handoff.md를 stdout으로 출력 → 컨텍스트 주입.
set -euo pipefail
f="$CLAUDE_PROJECT_DIR/handoff.md"
if [ -f "$f" ]; then
  printf '지난 세션 핸드오프 메모 (./handoff.md):\n\n'
  cat "$f"
fi
exit 0
```

### `.gitignore` 추가

```
# 세션 핸드오프 (개인용 단기 메모)
/handoff.md
.claude/.handoff-snapshot
```

## 5. 고려사항 & 트레이드오프

- **`$CLAUDE_PROJECT_DIR`**: 훅 command에서 프로젝트 루트를 가리키는 공식 환경변수. `./`(launch dir)보다 안정적이라 이걸 쓴다. 구현 단계에서 실제 set 되는지 실측.
- **claude -p 호출 비용/지연**: SessionEnd 1회뿐이라 감당 가능. 단 세션 종료가 최대 110초(timeout) 지연될 수 있음 → 사용자가 체감하면 timeout 하향 조정.
- **재귀 가드 신뢰도**: 환경변수 가드(가드1)가 핵심. `claude -p`가 부모 환경변수를 자식 훅까지 전파하는지가 전제 — **구현 단계 최우선 실측 항목**. 전파 안 되면 마커 파일(`.claude/.handoff-lock` 생성/삭제) 방식으로 대체.
- **transcript 60KB 상한**: 긴 세션은 마지막 60KB만 요약 → 세션 초반 내용 누락 가능. 트레이드오프(토큰 비용 vs 완전성). 상한값은 조정 가능.
- **jq content 파싱**: transcript JSONL의 `.message.content`가 string/array 혼재. 위 jq는 양쪽 처리하나, 실제 스키마는 **구현 단계에서 실제 transcript 한 줄을 떠서 검증** 필요(`(가정)`).
- **PROJECT.md와의 경계**: handoff.md는 gitignore된 개인 메모, PROJECT.md는 팀 현황판. 서로 안 건드림 → SSOT 충돌 회피.
- **위험: claude 바이너리가 cmux 래퍼**: headless가 안 돌 위험. 구현 단계에서 `claude -p "test" </dev/null` 실측이 게이트.
- **빈/실패 시 안전**: 모든 스크립트가 실패 시 `exit 0`으로 조용히 빠져 세션 흐름을 막지 않는다.

## 6. 할 일 목록 (Todo List)

> 확정됨 (2026-06-20 승인). 구현 중 진행 추적기로 사용.
> 게이트(G) 작업은 통과해야 다음으로 진행한다. 실패 시 멈추고 계획으로 되돌린다.

### A. 실측 게이트 (구현 전 사실 확인 — 코드 작성 아님)

- [x] **G1.** `claude -p` headless 정상 동작 확인 — cmux 래퍼 아래서도 `1+1`→`2` 반환, exit 0. ✅
- [x] **G2.** transcript 스키마 확인 — `user.content`=string, `assistant.content`=array(type=text). §4 jq 필터가 실제 텍스트 정확히 추출 확인. ✅
- [x] **G3.** `$CLAUDE_PROJECT_DIR` 확인 — BDS 루트에서 자식 훅이 `CLAUDE_PROJECT_DIR=/Users/chanhyung/BDS` 정확히 받음. ✅
- [x] **G4.** 환경변수 전파 확인 — 부모 `HANDOFF_HOOK_RUNNING=1` set 후 `claude -p` 호출 시 자식 세션 SessionEnd 훅이 `[1]`을 봄. **재귀 가드(환경변수 방식) 작동 — 설계 변경 불필요.** ✅

### B. 파일 생성

- [x] B1. `.claude/hooks/` 디렉터리 생성.
- [x] B2. `.claude/hooks/handoff-snapshot.sh` 작성 + 실행권한. 문법검사 OK.
- [x] B3. `.claude/hooks/handoff-write.sh` 작성 + 실행권한. 문법검사 OK.
- [x] B4. `.claude/hooks/handoff-inject.sh` 작성 + 실행권한. 문법검사 OK.
- [x] B5. `.claude/settings.json` 신규 작성 — 3개 훅 등록. `jq empty` 유효성 OK.
- [x] B6. `.gitignore`에 `/handoff.md`, `.claude/.handoff-snapshot` 추가.

### C. 동작 검증 (스크립트에 실제 stdin JSON 주입한 단위 검증)

- [x] C1. **snapshot**: stdin에 transcript_path 주입 → `.claude/.handoff-snapshot`에 경로 기록 확인.
- [x] C2. **write**: 실제 `claude -p` 호출로 `handoff.md`가 4항목 형식으로 생성됨 확인(품질 양호).
- [x] C3. **재귀 가드**: `HANDOFF_HOOK_RUNNING=1`이면 write 훅이 claude -p 미호출하고 즉시 exit 0 확인.
- [x] C4. **inject**: handoff.md를 헤더와 함께 stdout 출력(주입 형식) 확인.
- [x] C5. **실패 안전성**: transcript/handoff.md 없을 때 세 훅 모두 조용히 exit 0 확인.
- [x] C6. **git 청결**: handoff.md·.handoff-snapshot 둘 다 `git check-ignore` 통과, status 미노출 확인.

> **남은 실세션 검증(다음 세션에서)**: 위는 스크립트 단위 검증. 살아있는 세션에서 settings.json의 훅이 실제 발화하는 end-to-end는 다음 세션 시작/종료 때 확인됨. (단위로 모든 코드 경로는 통과.)
