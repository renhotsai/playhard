---
description: Run the full 4-agent feature pipeline (plan -> code -> test -> review) with automatic fix loops
argument-hint: [feature request in plain language]
allowed-tools: Bash(git rev-parse:*) Bash(git status:*) Bash(git diff:*) Bash(mkdir:*) Bash(rm:*) Read Write Task
---

Run the full feature pipeline for this request:

**$ARGUMENTS**

Current branch: !`git rev-parse --abbrev-ref HEAD`

## Rules

- Execute the stages in order. Do not skip ahead, do not run stages in parallel, do not do any of the work yourself.
- After each stage, read the handoff file's Status before deciding what happens next.
- You are the orchestrator only. You do not write specs, code, or tests. You delegate and you route.
- Never commit, merge, push, or switch branches. The human does that.
- **Every loop has a hard limit. Never exceed it, no matter how close the fix seems.**

## Stage 0 - Clean slate

If the current branch is `main`, `master`, or `develop`, STOP and tell me to create a feature branch first.

```
mkdir -p .pipeline && rm -f .pipeline/spec.md .pipeline/changes.md .pipeline/test-results.md .pipeline/review.md .pipeline/attempts.md
```

## Stage 1 - Plan

Delegate to the **planner** subagent with the feature request above.

Read `.pipeline/spec.md`. If it has an OPEN QUESTIONS section, STOP and show me the questions. Do not proceed.

## Stage 2 - Build

Delegate to the **coder** subagent. State explicitly: **"BUILD MODE. Read .pipeline/spec.md and implement it."**

Read `.pipeline/changes.md`. If Status is `BLOCKED`, STOP and show me why.

## Stage 3 - Test / fix loop (max 3 fix rounds)

Set `fix_round = 0`.

**3a.** Delegate to the **tester** subagent. Read `.pipeline/test-results.md`.

**3b.** If Status is `PASS` -> go to Stage 4.

**3c.** If Status is `FAIL`, check the exit conditions before looping:

- `fix_round` has reached **3** -> STOP. Report all three attempts and the persistent failure.
- The Tester flagged this as a **repeat failure** (same test, same error as the previous round) -> STOP. The Coder is stuck; another round will not help.
- The failure is a missing dependency, broken build tooling, or environment problem rather than a code defect -> STOP. That is not something the Coder can fix.

Otherwise increment `fix_round` and delegate to the **coder** subagent with: **"FIX MODE, round {fix_round} of 3. Read .pipeline/test-results.md and .pipeline/attempts.md. Fix the root cause in application code only. You may not edit test files."**

Read `.pipeline/changes.md`. If Status is `BLOCKED` -> STOP and show me the Coder's reason (it is disputing a test, or the spec, or it has run out of ideas - all three need me).

Otherwise go back to **3a**.

## Stage 4 - Review / fix loop (max 2 fix rounds)

Set `review_round = 0`.

**4a.** Delegate to the **reviewer** subagent. Read `.pipeline/review.md`.

**4b.** Route on the verdict:

- `SHIP` -> go to Final report.
- `BLOCK` -> STOP immediately. Do not attempt a fix. BLOCK means the problem needs a human decision.
- `NEEDS WORK` -> continue to 4c.

**4c.** If `review_round` has reached **2** -> STOP and report both rounds plus the outstanding findings.

Otherwise increment `review_round` and delegate to the **coder** subagent with: **"FIX MODE, review round {review_round} of 2. Read the Must fix list in .pipeline/review.md. Address every item. Application code only - you may not edit test files."**

If `changes.md` comes back `BLOCKED` -> STOP and show me.

**4d.** Re-run the **tester** subagent - the review fix may have broken a test. If tests now fail, re-enter Stage 3's fix loop with the existing `fix_round` counter (it does not reset).

Then go back to **4a**.

## Final report

Print, in this order:

1. The verdict line.
2. Rounds used: `{fix_round}/3` test fixes, `{review_round}/2` review fixes.
3. One line per stage: spec written / files changed / tests passed / verdict.
4. If `attempts.md` exists, its full contents - I need to see what it struggled with.
5. `git diff --stat`.
6. The branch name, and the reminder that nothing has been committed or merged.

## If the pipeline stopped early

Say plainly which stage it stopped at, why, what the last known good state is, and what decision you need from me. Do not present a partial result as if it succeeded. A feature that stopped at round 3 with tests still red is not "mostly done" - say it is red.
