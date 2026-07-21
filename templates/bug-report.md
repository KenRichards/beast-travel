# Bug Report — [Concise title]

## Summary

[Describe the defect and the user-visible or operational impact in two or three
sentences.]

## Triage

- **Reported by:** [Name or role]
- **Date/time observed:** [ISO 8601 with time zone]
- **Environment:** Local | Development | Staging | Production
- **Version / commit:** [Tag and full or short commit]
- **Severity:** Critical | High | Medium | Low
- **Priority:** Immediate | Next milestone | Planned | Backlog
- **Frequency:** Always | Intermittent | Once | Unknown
- **Regression:** Yes | No | Unknown; last known-good [version]

## Preconditions

- [Required account, trip, data, configuration, viewport, or browser state]

## Steps to reproduce

1. [Start from a known route or state.]
2. [Perform one specific action.]
3. [Continue until the defect appears.]

## Expected behavior

[State the observable correct result.]

## Actual behavior

[State what happened, including exact safe error text and status code where
useful.]

## Impact

- **Affected users/data:** [Scope without personal data]
- **Workaround:** [Safe workaround or none]
- **Data loss or security impact:** [Description or none known]
- **Operational impact:** [Availability, latency, cost, support, or none]

## Evidence

- **Route / request:** [Redacted URL and method]
- **Browser / device:** [Name and version]
- **Logs:** [Redacted relevant excerpt or link]
- **Screenshot / recording:** [Link with sensitive data removed]
- **Correlation / trace ID:** [Identifier only]

Do not attach credentials, tokens, personal travel documents, payment details,
or unredacted production data.

## Diagnostic notes

[Record observations, suspected boundary, recent related changes, and checks
already performed. Separate confirmed facts from hypotheses.]

## Acceptance criteria for the fix

- [ ] The reproduction steps produce the expected behavior.
- [ ] A regression test fails before the fix and passes after it, when practical.
- [ ] Related success and failure paths remain functional.
- [ ] Logs and user-facing errors are safe and actionable.

## Validation plan

- [ ] `git diff --check`
- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] [Regression test command]
- [ ] [Affected route and runtime log verification]

## Resolution

- **Root cause:** [Complete after diagnosis]
- **Fix branch / PR:** [Reference]
- **Released in:** [Version / commit / date]
- **Follow-up:** [Issue references or none]
