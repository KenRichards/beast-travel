# Release Process

BEAST releases are traceable from milestone to branch, commit, pull request,
merge, version, deployment, and verification.

## Branch types

### Feature branches

Use `feature/<milestone>-<slug>` for product capabilities and refactors that
deliver a milestone. Documentation-only work may use `docs/`; maintenance may
use `chore/`.

Create the branch from current `main`, keep it focused, and remove it after its
pull request merges.

### Fix branches

Use `fix/<milestone>-<slug>` for defects found before release. Use
`fix/<issue>-<slug>` or `hotfix/<issue>-<slug>` for an urgent production fix
when the repository adopts a hotfix path.

A production fix still requires a reproducible bug report, regression
validation, review, and verification. Apply the fix to the active development
line as well if the production branch differs from `main`.

## Merge strategy

Pull requests are the normal path into `main`. The default is squash merge for
a branch that represents one milestone, producing one readable integration
commit. Use a merge commit when preserving a meaningful series of independently
valid commits or recording a coordinated integration is more valuable. Use
rebase merge only when the team deliberately wants each source commit on
`main`.

Whichever strategy is chosen:

- require the milestone's validation and approval on the final revision;
- do not merge unresolved required review threads;
- do not force-push shared branches without coordination;
- never merge a failed build to “fix forward” unless an authorized emergency
  procedure explicitly accepts that risk.

## Commit message conventions

Use an imperative, milestone-prefixed subject:

```text
BT-020: Add weather forecasts to itinerary days
BT-020: Handle unavailable weather provider responses
```

For sub-milestones, preserve the full identifier:

```text
BT-019.2: Add engineering documentation and project templates
```

Subject rules:

- start with the milestone or issue identifier;
- follow with a colon and an imperative summary;
- use sentence case with no trailing period;
- keep the subject concise and specific;
- do not use `WIP` for the final reviewed commit.

Add a body when the reason, tradeoff, migration, compatibility impact, or
follow-up is not clear from the diff. The body explains why and operational
impact, not a file-by-file narration.

## Versioning

Use Semantic Versioning once formal release artifacts begin:

- `MAJOR` for intentionally incompatible public contract or data-format changes;
- `MINOR` for backward-compatible capabilities;
- `PATCH` for backward-compatible corrections.

Before `1.0.0`, minor releases may include evolving contracts, but release notes
must identify migrations and compatibility limits. Use annotated Git tags in
the form `vMAJOR.MINOR.PATCH`. The tagged commit must be on the protected release
line and must match the deployed artifact.

Do not change versions merely to identify an internal build. Use commit hashes
and CI run identifiers for build traceability.

## GitHub workflow

1. Create or link a milestone/issue with acceptance criteria.
2. Branch from updated `main` using the correct branch type.
3. Implement and validate according to [Validation](VALIDATION.md).
4. Push the branch and open a pull request using
   [the pull-request template](../templates/pull-request.md).
5. Link the issue, summarize behavior and risk, and include exact validation
   results plus screenshots for material UI changes.
6. Let required CI checks finish and complete human review.
7. Address feedback and rerun every check affected by the revision.
8. Merge with the approved strategy.
9. Verify the resulting `main` branch and delete the source branch.
10. Create an annotated version tag and GitHub release when the change belongs
    to a formal release.
11. Deploy the exact approved commit or tag.
12. Verify health, critical routes, user flows, and logs; record the result.

Branch protection should require pull requests, successful status checks, and
at least one human approval for production repositories. Restrict who can push
tags or bypass protections.

## Release readiness checklist

- [ ] Milestone acceptance criteria have evidence.
- [ ] Required automated and manual validation passes.
- [ ] Human code, functional, accessibility, security, and operational review
      is complete as applicable.
- [ ] Data changes are backward compatible or have a tested migration and
      rollback.
- [ ] Configuration and secrets exist in the target environment.
- [ ] Release notes identify user-visible changes and known limitations.
- [ ] Deployment, health verification, observation, and rollback owners are
      assigned.
- [ ] The release revision and version are unambiguous.

## Failed deployment or verification

Stop the rollout when critical health, route, data, or log verification fails.
Roll back to the last known-good immutable revision when safe to do so. Open a
tracked bug with timestamps, affected version, symptoms, logs, and the recovery
action. Implement the correction on a fix branch and repeat the complete review
and release gates.
