# Development Workflow

BEAST work moves through small, reviewable milestones. Each milestone has a
single outcome, explicit acceptance criteria, reproducible validation, and a
traceable Git history.

## Branch strategy

`main` is the integration branch and must remain buildable. Never implement a
milestone directly on `main`.

Create branches from an up-to-date `main` using these prefixes:

| Work type | Pattern | Example |
| --- | --- | --- |
| Feature or milestone | `feature/<milestone>-<slug>` | `feature/bt-020-weather` |
| Bug fix | `fix/<milestone>-<slug>` | `fix/bt-020-weather-timeout` |
| Documentation | `docs/<milestone>-<slug>` | `docs/bt-019.2-engineering-docs` |
| Maintenance | `chore/<milestone>-<slug>` | `chore/bt-026-dependencies` |

Use lowercase, hyphenated slugs. Keep one milestone on one branch unless a
documented recovery or follow-up branch is required. Rebase or merge current
`main` into a long-lived branch before final validation, according to the
repository's active merge policy.

## Milestone workflow

1. Copy [the milestone template](../templates/milestone.md).
2. Define the objective, in-scope work, exclusions, dependencies, risks,
   acceptance criteria, and validation commands.
3. Create the branch before changing files.
4. Give Codex a bounded request based on
   [the Codex task template](../templates/codex-task.md).
5. Implement in coherent increments and inspect the diff continuously.
6. Run the complete [validation suite](VALIDATION.md).
7. Perform human functional and code review.
8. Commit with the milestone identifier and push the branch.
9. Open a pull request using [the PR template](../templates/pull-request.md).
10. Merge only after acceptance criteria and required checks pass.
11. Deploy, verify the running application, and update release records.

The detailed stage gates are in
[Milestone lifecycle](MILESTONE_LIFECYCLE.md).

## Responsibilities

### ChatGPT

ChatGPT is the planning and reasoning partner. It should:

- turn product intent into a milestone with clear scope and constraints;
- expose assumptions, dependencies, edge cases, and user-visible behavior;
- write testable acceptance criteria and an appropriate validation plan;
- help split work that is too large for one safe review;
- evaluate implementation summaries and validation evidence;
- preserve product context across related milestones.

ChatGPT does not replace repository inspection, executed validation, or human
approval. Plans must distinguish confirmed repository facts from proposals.

### Codex

Codex is the repository implementation agent. It should:

- read repository instructions and the installed framework documentation;
- inspect the current branch, working tree, architecture, and conventions;
- implement only the requested scope while preserving unrelated work;
- keep the user informed of assumptions, blockers, and material discoveries;
- run the specified checks and report exact results;
- review the final diff, commit only intended files when requested, and stop at
  the requested handoff point.

Codex must not merge, deploy, publish, delete data, or expand scope without
authorization. A passing build is necessary evidence, not permission to ship.

### Human owner and reviewer

The human owns product intent and all consequential decisions. The human:

- approves the milestone, tradeoffs, external effects, and scope changes;
- supplies credentials or protected access without placing secrets in prompts;
- performs usability and visual review where automation is insufficient;
- evaluates maintainability, security, accessibility, and operational risk;
- approves the pull request, merge, deployment, and release communication.

The implementation author and reviewer should be different people whenever
the project has enough maintainers to support that separation.

## Human review

Review the change against the milestone rather than only reading the diff.
Confirm:

- every acceptance criterion has evidence;
- behavior outside the requested scope remains intact;
- public interfaces, JSON shapes, and route contracts are intentional;
- server/client boundaries and error states are appropriate;
- accessibility and responsive behavior have been considered;
- documentation and operational instructions match the implementation;
- no secrets, generated output, temporary files, or unrelated edits are
  included.

Request changes when evidence is missing. Do not treat an AI-generated summary
as validation evidence unless the referenced commands were actually run.

## Commit process

Before committing:

1. Run `git status --short` and inspect every changed path.
2. Review `git diff` and `git diff --check`.
3. Run all scope-appropriate validation.
4. Stage only the intended files.
5. Review `git diff --cached --stat` and `git diff --cached`.
6. Commit with the convention in [Release process](RELEASE_PROCESS.md).

Prefer one coherent milestone commit when the change is small. Larger work may
use several independently valid commits, but avoid checkpoint, generated, or
format-only noise. Never rewrite or discard another contributor's changes
without explicit agreement.

## Merge process

1. Push the feature branch and open a pull request.
2. Link the milestone or issue and include validation evidence.
3. Resolve all required review comments and rerun affected checks.
4. Require the branch to be current with `main` when repository policy demands
   it.
5. Use the repository's selected merge strategy; squash merge is the default
   for a single-milestone branch.
6. Verify `main` after merge and delete the remote branch when it is no longer
   needed.

Never merge merely because the branch builds. Approval, acceptance criteria,
and required automated checks are separate gates.

## Deployment process

Deployment begins only from an approved commit on `main` or from an explicitly
approved release tag.

1. Identify the exact commit and target environment.
2. Confirm environment configuration and backout steps.
3. Build the same revision that will run in the environment.
4. Deploy using the project's documented platform procedure.
5. Restart or replace the runtime only when the deployment requires it.
6. Verify health, critical HTTP routes, browser behavior, and runtime logs.
7. Record the deployed revision, time, operator, and validation results.
8. Roll back when critical verification fails; do not repair production
   interactively without a tracked fix.

The current `compose.yaml` defines a development runtime, not a production
release image. A production deployment design must be reviewed separately.
