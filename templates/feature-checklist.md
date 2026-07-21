# Feature Checklist — [BT-### / Feature title]

Use “N/A — reason” instead of silently omitting a category.

## Definition

- [ ] Objective and user value are clear.
- [ ] Scope and non-goals are documented.
- [ ] Dependencies, assumptions, risks, and owners are recorded.
- [ ] Acceptance criteria are observable and testable.
- [ ] Design, architecture, or data decisions are approved where needed.
- [ ] Rollout, rollback, and validation plans are defined.

## Implementation

- [ ] Work is on the correctly named feature branch.
- [ ] Applicable repository and framework instructions were read.
- [ ] Types, runtime schemas, and data agree.
- [ ] Server/client and public/private boundaries are intentional.
- [ ] Loading, empty, error, success, and unavailable states are implemented.
- [ ] Existing behavior is preserved outside the milestone scope.
- [ ] Configuration is documented and secrets remain outside source control.
- [ ] Dependencies are necessary, supported, pinned appropriately, and reviewed.
- [ ] Documentation reflects behavior and operations.

## Quality

- [ ] UI is responsive across supported viewports.
- [ ] Semantic HTML, keyboard use, focus, contrast, and accessible names pass
      review.
- [ ] User-facing text is clear and actionable.
- [ ] Error handling avoids sensitive details and offers recovery where possible.
- [ ] Security, privacy, retention, licensing, and third-party cost were reviewed.
- [ ] Performance impact and failure modes are acceptable.
- [ ] Tests cover important success, edge, and regression paths.

## Validation

- [ ] Changed shell scripts pass `bash -n`.
- [ ] `git diff --check` passes.
- [ ] Lint and feature-specific tests pass.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes without unexplained warnings.
- [ ] Runtime was restarted or recreated when required.
- [ ] Affected HTTP routes and user flows were verified.
- [ ] Invalid and failure paths were verified.
- [ ] Runtime logs contain no new actionable errors or warnings.
- [ ] No generated artifacts, secrets, debug output, or unrelated changes exist.

## Review and release

- [ ] Pull request links the milestone and explains behavior, risk, and rollout.
- [ ] Validation evidence and UI evidence are attached.
- [ ] Required automated checks pass on the final revision.
- [ ] Required human reviews are approved and comments resolved.
- [ ] Merge strategy and final commit are confirmed.
- [ ] Release version and notes are prepared when applicable.
- [ ] Deployment owner, verification owner, and rollback owner are assigned.
- [ ] Post-release health, routes, behavior, and logs are verified.
- [ ] Deferred work and newly discovered defects have tracking references.
