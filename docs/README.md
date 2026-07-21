# BEAST Travel Engineering Documentation

This directory is the engineering handbook for BEAST Travel and the baseline
for future BEAST repositories. Start with the development workflow, then use
the document that matches the work being planned, implemented, or released.

## Documentation index

| Document | Purpose |
| --- | --- |
| [Development workflow](DEVELOPMENT_WORKFLOW.md) | Defines branches, milestones, team responsibilities, reviews, commits, merges, and deployment. |
| [Coding standards](CODING_STANDARDS.md) | Establishes implementation conventions for every language and format used by the repository. |
| [Architecture](ARCHITECTURE.md) | Explains the repository structure, application boundaries, data flow, and intended extension points. |
| [Reservation imports](RESERVATION_IMPORT.md) | Documents the Phase 1 reservation pipeline, normalized model, provider extension point, and safety boundaries. |
| [AI workflow](AI_WORKFLOW.md) | Describes how ChatGPT, Codex, and a human owner collaborate safely and predictably. |
| [Milestone lifecycle](MILESTONE_LIFECYCLE.md) | Provides the stage gates from an initial idea through release. |
| [Validation](VALIDATION.md) | Lists the static, build, runtime, route, log, and repository checks required before handoff. |
| [Release process](RELEASE_PROCESS.md) | Defines branch types, merge policy, commit messages, versioning, and the GitHub release workflow. |
| [Roadmap](ROADMAP.md) | Records the planned milestone sequence and space for future work. |

## Reusable templates

| Template | Use |
| --- | --- |
| [Milestone](../templates/milestone.md) | Turn a product idea into a bounded, verifiable milestone. |
| [Codex task](../templates/codex-task.md) | Give Codex an implementation request with explicit scope and handoff expectations. |
| [Feature checklist](../templates/feature-checklist.md) | Track feature readiness from planning through release. |
| [Bug report](../templates/bug-report.md) | Capture reproducible defects with impact and diagnostic evidence. |
| [Pull request](../templates/pull-request.md) | Present a change for focused human review and safe merge. |

## How to use this handbook

1. Copy the relevant template before implementation begins.
2. Follow the [milestone lifecycle](MILESTONE_LIFECYCLE.md) and keep acceptance
   criteria current as understanding changes.
3. Implement according to the [coding standards](CODING_STANDARDS.md) and
   [architecture](ARCHITECTURE.md).
4. Record the exact checks from [validation](VALIDATION.md).
5. Complete human review and the [release process](RELEASE_PROCESS.md).

Project-specific decisions take precedence when they are documented in the
repository. When a future BEAST project intentionally diverges from this
handbook, record the reason in its architecture or decision documentation.
