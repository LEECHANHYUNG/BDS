# RTK - Rust Token Killer (Codex CLI)

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Always prefix shell commands with `rtk`.

Examples (this repo uses pnpm + Turborepo + Biome):

```bash
rtk git status
rtk git diff
rtk pnpm install
rtk pnpm lint
rtk pnpm check
rtk pnpm test
```

## Meta Commands

```bash
rtk gain            # Token savings analytics
rtk gain --history  # Recent command savings history
rtk proxy <cmd>     # Run raw command without filtering
```

## Verification

```bash
rtk --version
rtk gain
which rtk
```
