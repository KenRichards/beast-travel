# Milestone Specification — [BT-### / Milestone title]

Use this specification to give an implementer a bounded, execution-ready
milestone. Replace every placeholder, remove inapplicable examples, and use
“N/A — reason” when a section does not apply.

## Milestone status

- **Owner:** [Name or role]
- **Stage:** Idea | Planning | Implementation | Validation | Review | Merge | Release
- **Priority:** Critical | High | Medium | Low
- **Target release:** [Version, date, or TBD]
- **Issue / project link:** [URL or reference]
- **Dependencies:** [Milestone IDs or none]

## Objective and business value

[Describe the desired user or system outcome, who benefits, why it matters,
and how success will be measured.]

## Background

[Summarize relevant repository behavior, prior decisions, dependencies, and
explicit assumptions. Link authoritative documentation where available.]

## Scope

### In scope

- [Required behavior or deliverable]
- [Required behavior or deliverable]

### Out of scope

- [Explicit non-goal]
- [Deferred work and its follow-up milestone, if known]

## Repository boundaries

- **Repository:** [Name or path]
- **Primary branch:** [Branch]
- **Working branch:** `[type]/[milestone]-[slug]`
- **Files expected to change:** [Paths or bounded patterns]
- **Files that must not change:** [Paths, data, or generated artifacts]

## User experience

[Describe the happy path and applicable loading, empty, error, responsive,
accessibility, content, and visual requirements.]

## Technical approach

[Describe the expected boundaries, data flow, types, routes, persistence,
external providers, migrations, compatibility requirements, and operational
constraints without over-prescribing incidental implementation details.]

## Data, privacy, and security

- **Data introduced or changed:** [Description or none]
- **Sensitive data:** [Classification, handling, retention, and deletion]
- **Secrets/configuration:** [Names and storage location; never include values]
- **Abuse/failure considerations:** [Risks and controls]

## Implementation requirements

- [Observable implementation constraint]
- [Compatibility or preservation requirement]
- [Documentation, migration, or operational requirement]

## Acceptance criteria

- [ ] Given [precondition], when [action], then [observable result].
- [ ] Given [failure or edge condition], when [action], then [safe result].
- [ ] Existing [route, behavior, or contract] remains unchanged.
- [ ] Documentation and operational guidance match delivered behavior.

## Validation plan

Record each applicable command, expected outcome, and evidence. Follow
[the repository validation procedure](../docs/VALIDATION.md).

### Automated

- [ ] All tracked Bash scripts pass `bash -n`.
- [ ] `git diff --check` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] [Lint, unit, integration, schema, or end-to-end command]

### Runtime

- [ ] [Restart or recreate the runtime, or N/A with reason.]
- [ ] [Verify affected URLs and flows, or N/A with reason.]
- [ ] [Inspect runtime logs, or N/A with reason.]

### Repository integrity

- [ ] Only intended files are staged.
- [ ] No secrets, user data, or generated artifacts are staged.
- [ ] Final Git status matches the documented handoff state.

## Risks and mitigations

| Risk | Likelihood / impact | Mitigation | Owner |
| --- | --- | --- | --- |
| [Risk] | [Low/Medium/High] | [Prevention or response] | [Owner] |

## Rollout and rollback

- **Rollout:** [Sequence, environment, feature flag, or migration]
- **Observation:** [Health indicators, logs, metrics, and duration]
- **Rollback:** [Known-good revision and data/config reversal]

## Deliverables

- [Source or configuration files]
- [Documentation]
- [Tests, migrations, installer updates, or N/A with reason]

## Delivery

- **Commit subject:** `[BT-###]: [Imperative summary]`
- **Pull request:** [Link when opened]
- **Release / deployment:** [Version, commit, environment, and timestamp]

## Completion checklist

- [ ] Acceptance criteria are satisfied.
- [ ] Required validation passed and evidence is recorded.
- [ ] Documentation is current.
- [ ] Repository status contains only the documented handoff state.
- [ ] The milestone is ready for review.

## Implementer instructions

1. Read applicable repository and framework instructions before editing.
2. Inspect staged and unstaged work before making changes.
3. Implement only the approved scope and preserve user data.
4. Do not modify unrelated files or weaken existing safeguards.
5. Run every applicable validation check and record failures accurately.
6. Review the final diff and status, then summarize the handoff.
7. Stop before merge unless merge authorization is explicit.
