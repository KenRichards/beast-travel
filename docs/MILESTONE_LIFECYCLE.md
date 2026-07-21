# Milestone Lifecycle

Every BEAST milestone passes through seven explicit stages. A stage is complete
only when its exit criteria are met.

```text
Idea
  |
  v
Planning
  |
  v
Implementation
  |
  v
Validation
  |
  v
Review
  |
  v
Merge
  |
  v
Release
```

## 1. Idea

Capture the problem, affected users, desired outcome, and why it matters. Keep
the idea solution-neutral until constraints are understood.

**Exit criteria**

- an owner and milestone identifier exist;
- the problem and expected value are understandable;
- obvious duplicates and prerequisite work have been considered;
- the idea is prioritized for planning.

## 2. Planning

Copy [the milestone template](../templates/milestone.md). Inspect the current
repository and convert the idea into bounded delivery work. Define exclusions
as carefully as inclusions.

Planning covers architecture, UI behavior, data contracts, error states,
privacy, accessibility, migration, dependencies, operations, rollback, and
validation as applicable.

**Exit criteria**

- objective, scope, and non-goals are explicit;
- acceptance criteria are observable and testable;
- risks, dependencies, and unresolved decisions have owners;
- the validation plan covers static and runtime behavior;
- branch, commit, review, and handoff expectations are defined;
- the human owner approves implementation.

## 3. Implementation

Create the milestone branch and work in small coherent increments. Follow the
[coding standards](CODING_STANDARDS.md) and preserve existing architectural
boundaries. Keep the milestone current if approved scope changes.

**Exit criteria**

- all in-scope behavior is implemented;
- every acceptance criterion has a planned evidence source;
- related types, data, configuration, tests, and documentation agree;
- the diff contains no unrelated edits, secrets, temporary files, or generated
  artifacts;
- the implementation is ready for formal validation.

## 4. Validation

Run the commands and runtime checks in [Validation](VALIDATION.md). Record the
exact command, result, and any relevant environment details. Fix failures and
rerun affected checks from a known state.

**Exit criteria**

- required syntax, diff, type, and production build checks pass;
- affected HTTP routes and user flows behave as specified;
- runtime logs show no new errors or warnings requiring action;
- all acceptance criteria have evidence;
- final status shows only intended work.

## 5. Review

Open a pull request using [the PR template](../templates/pull-request.md). Review
the milestone outcome, not just individual lines. Resolve feedback with new
commits or an agreed history update and rerun checks affected by each change.

**Exit criteria**

- required automated checks pass on the proposed merge revision;
- review comments are resolved or explicitly accepted;
- human functional, visual, security, accessibility, and operational review is
  complete as appropriate;
- documentation and release/rollback notes are accurate;
- an authorized reviewer approves the pull request.

## 6. Merge

Confirm the approved commit is current with `main` under repository policy.
Merge through GitHub with the chosen strategy; do not merge an unreviewed local
branch directly.

**Exit criteria**

- the intended revision is merged into `main` exactly once;
- required checks pass on or after the merged revision;
- the pull request links the milestone and retains validation evidence;
- the source branch is removed when no longer needed;
- the resulting `main` branch is buildable.

## 7. Release

Follow [the release process](RELEASE_PROCESS.md). Deploy or publish the exact
approved revision, then verify the running system and communicate the change.

**Exit criteria**

- the released commit and version are identifiable;
- deployment and any migrations complete successfully;
- health, critical routes, user behavior, and logs are verified;
- rollback readiness is confirmed during the observation window;
- release notes and milestone status are updated;
- follow-up issues capture deferred or newly discovered work.

## Reopening a stage

A failed gate moves the milestone back to the earliest affected stage. For
example, a review that uncovers a missing product decision returns to planning;
a route regression returns to implementation. Repeat all downstream checks
affected by the change. Do not waive a failed gate by relabeling the milestone
complete.
