# [BT-###]: [Imperative summary]

## Summary

[Explain the outcome and why the change is needed. Keep this readable without
requiring reviewers to reconstruct intent from the diff.]

## Related work

- **Milestone / issue:** [Reference]
- **Depends on:** [PRs, milestones, or none]
- **Follow-up:** [Deferred work or none]

## Changes

- [Behavior or architecture change]
- [Data, configuration, documentation, or operational change]

## Out of scope

- [Explicitly excluded or deferred work]

## Implementation notes

[Explain material decisions, server/client boundaries, data flow, compatibility,
migrations, provider behavior, or tradeoffs that help reviewers.]

## Screenshots or recordings

| Before | After |
| --- | --- |
| [Image or N/A] | [Image or N/A] |

[Include desktop, mobile, loading, empty, and error states when material. Remove
sensitive information.]

## Validation

| Command or check | Result | Notes |
| --- | --- | --- |
| `bash -n <changed-script>` | Pass / Fail / N/A | [Evidence] |
| `git diff --check` | Pass / Fail | [Evidence] |
| `npx tsc --noEmit` | Pass / Fail / N/A | [Evidence] |
| `npm run build` | Pass / Fail / N/A | [Evidence and warnings] |
| HTTP / user-flow verification | Pass / Fail / N/A | [Routes and behavior] |
| Runtime logs | Pass / Fail / N/A | [Service and time window] |

## Risk and operations

- **Risk level:** Low | Medium | High
- **Security/privacy:** [Impact, controls, or none]
- **Performance/cost:** [Impact or none]
- **Configuration/secrets:** [Names and setup, never values]
- **Migration:** [Steps, compatibility, or none]
- **Rollout:** [Sequence, flag, or ordinary merge]
- **Rollback:** [Safe reversal procedure]
- **Monitoring:** [Health, logs, metrics, and observation window]

## Reviewer focus

- [Ask reviewers to examine the highest-risk contract or behavior.]
- [Identify a decision that merits explicit confirmation.]

## Checklist

- [ ] Acceptance criteria are satisfied and linked to evidence.
- [ ] The diff contains only milestone-related changes.
- [ ] Types, runtime data, UI, tests, and documentation agree.
- [ ] Loading, empty, error, and edge states were considered.
- [ ] Accessibility, responsive behavior, security, and privacy were reviewed.
- [ ] No secrets, temporary output, debug code, or generated artifacts are
      included.
- [ ] Required checks pass on the final revision.
- [ ] Breaking changes, migrations, rollout, and rollback are documented.
- [ ] Review comments are resolved before merge.
