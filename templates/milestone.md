# [BT-###] — [Milestone title]

## Status

- **Owner:** [Name or role]
- **Stage:** Idea | Planning | Implementation | Validation | Review | Merge | Release
- **Target release:** [Version, date, or TBD]
- **Issue / project link:** [URL or reference]
- **Dependencies:** [Milestone IDs or none]

## Objective

[Describe the user or system outcome in one concise paragraph. Explain why it
matters without prescribing unnecessary implementation detail.]

## Background

[Summarize the current behavior, relevant repository facts, and prior decisions.
Label assumptions and link authoritative context.]

## Scope

### In scope

- [Required behavior or deliverable]
- [Required behavior or deliverable]

### Out of scope

- [Explicit non-goal]
- [Deferred behavior and its follow-up milestone, if known]

## User experience

[Describe the happy path, loading/empty/error states, responsive behavior,
accessibility expectations, and any copy or visual requirements.]

## Technical approach

[Describe the proposed boundaries, data flow, types, routes, persistence,
external providers, migrations, and compatibility impact. Link an architecture
decision when the choice affects future projects.]

## Data, privacy, and security

- **Data introduced or changed:** [Description or none]
- **Sensitive data:** [Classification and handling or none]
- **Secrets/configuration:** [Names and storage location; never include values]
- **Retention/deletion:** [Policy or not applicable]
- **Abuse/failure considerations:** [Risks and controls]

## Acceptance criteria

- [ ] Given [precondition], when [action], then [observable result].
- [ ] Given [failure or edge condition], when [action], then [safe result].
- [ ] Existing [route/behavior/contract] remains unchanged.
- [ ] Documentation and operational guidance match the delivered behavior.

## Validation plan

### Automated

- [ ] `bash -n <changed-script>` when shell scripts change
- [ ] `git diff --check`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] [Lint, unit, integration, schema, or end-to-end command]

### Runtime

- [ ] Restart or recreate the required runtime.
- [ ] Verify [URL / flow] returns [expected result].
- [ ] Verify invalid, empty, loading, and provider-failure behavior.
- [ ] Inspect runtime logs for the exercised window.

### Human review

- [ ] Product behavior and copy
- [ ] Responsive and visual quality
- [ ] Keyboard and screen-reader accessibility
- [ ] Privacy, security, and operational impact

## Risks and mitigations

| Risk | Likelihood / impact | Mitigation | Owner |
| --- | --- | --- | --- |
| [Risk] | [Low/Medium/High] | [Prevention or response] | [Owner] |

## Rollout and rollback

- **Rollout:** [Sequence, environment, feature flag, or migration]
- **Observation:** [Health indicators, logs, metrics, and duration]
- **Rollback:** [Known-good revision and data/config reversal]

## Open questions

- [ ] [Decision needed, owner, and due point]

## Delivery

- **Branch:** `[type]/[milestone]-[slug]`
- **Commit subject:** `[BT-###]: [Imperative summary]`
- **Pull request:** [Link when opened]
- **Release / deployment:** [Version, commit, environment, and timestamp]

## Results

[Complete at handoff: changed behavior, acceptance evidence, validation results,
known limitations, and follow-up issues.]
