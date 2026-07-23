---
description: Run the full 4-agent feature pipeline (plan -> code -> test -> review)
argument-hint: [feature request in plain language]
allowed-tools: Bash(git rev-parse:*) Bash(git status:*) Bash(git diff:*) Bash(mkdir:*) Bash(rm:*) Read Task
---

Run the full feature pipeline for this request:

**$ARGUMENTS**

Current branch: !`git rev-parse --abbrev-ref HEAD`

## Rules

- Execute the stages below strictly in order. Do not skip ahead, do not run stages in parallel, do not do any of the work yourself.
- After each stage, confirm the handoff file exists and read its Status before starting the next stage.
- You are the orchestrator only. You do not write code, tests, or specs.
- Never commit, merge, push, or switch branches. The human does that.

## Stage 0 — Clean slate

If the current branch is `main`, `master`, or `develop`, STOP and tell me to create a feature branch first.

Clear stale handoff files so no agent reads last run's output:

```
mkdir -p .pipeline && rm -f .pipeline/spec.md .pipeline/changes.md .pipeline/test-results.md .pipeline/review.md
```

## Stage 1 — Plan

Delegate to the **planner** subagent with the feature request above.

Wait for `.pipeline/spec.md`. Read it. If it has an OPEN QUESTIONS section, STOP, show me the questions, and go no further.

## Stage 2 — Code

Delegate to the **coder** subagent. Tell it only to read `.pipeline/spec.md` and implement it.

Wait for `.pipeline/changes.md`. Read it. If Status is `BLOCKED`, STOP and show me why.

## Stage 3 — Test

Delegate to the **tester** subagent.

Wait for `.pipeline/test-results.md`. Read it. If Status is `FAIL`, STOP and show me the failures verbatim. Do not attempt a fix and do not proceed to review.

## Stage 4 — Review

Delegate to the **reviewer** subagent.

Wait for `.pipeline/review.md` and show it to me in full.

## Final report

Print, in this order:

1. The verdict line.
2. A one-line summary of each stage (spec written / files changed / tests passed / verdict).
3. `git diff --stat`.
4. The branch name, and the reminder that nothing has been committed or merged.

Then stop. Leave the branch exactly as it is for my review.
