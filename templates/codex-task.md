# Codex Implementation Request — [BT-###]

## Repository and branch

- **Repository:** [Absolute path or repository URL]
- **Base branch:** `main`
- **Working branch:** `[type]/[milestone]-[slug]`
- **Working tree context:** [Expected clean state or known user-owned changes]

## Objective

[State the complete outcome Codex should deliver.]

## Repository instructions

[Identify applicable `AGENTS.md` files, version-specific framework docs, project
standards, and constraints Codex must read before implementation.]

## Scope

### Create

- `[path]` — [Purpose]

### Update

- `[path]` — [Required change]

### Do not change

- [Explicit exclusion, external system, data, dependency, or behavior]

## Requirements

- [Functional or documentation requirement]
- [Error, empty, loading, responsive, accessibility, or compatibility behavior]
- [Data and type contract]
- [Privacy, security, performance, or operational constraint]

## Acceptance criteria

- [ ] [Observable criterion]
- [ ] [Observable failure or edge behavior]
- [ ] [Regression protection]

## Validation

Run and report:

```bash
git diff --check
npx tsc --noEmit
npm run build
```

[Add shell syntax, lint, tests, Docker restart/recreate, HTTP routes, browser
checks, and runtime log inspection appropriate to this task.]

Ensure:

- [ ] no broken internal links or references;
- [ ] no secrets, debug code, temporary files, or generated artifacts;
- [ ] only intended files are staged or committed;
- [ ] final status matches the requested handoff state.

## Git instructions

- **Commit required:** Yes | No
- **Commit subject:** `[BT-###]: [Imperative summary]`
- **Push required:** Yes | No
- **Open pull request:** Yes | No; draft | ready
- **Merge:** No unless separately and explicitly authorized

## Handoff

Present:

- outcome and any material implementation decisions;
- diff summary and complete changed-file list;
- validation commands with pass/fail/not-run results;
- known limitations and follow-up work;
- commit hash and final branch/status, when committed.

Stop after [commit | push | draft PR | requested endpoint].
