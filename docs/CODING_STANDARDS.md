# Coding Standards

These standards are the default for BEAST repositories. Existing project
configuration and version-specific framework documentation remain the source
of truth when they impose stricter requirements.

## General principles

- Optimize for clarity, correctness, and small reviewable changes.
- Preserve strict types and explicit data contracts.
- Avoid new dependencies when platform or existing project capabilities are
  sufficient.
- Keep secrets out of source, fixtures, logs, screenshots, and prompts.
- Make error, empty, loading, and unavailable states intentional.
- Update documentation when behavior, data shape, setup, or operations change.

## TypeScript

- Keep `strict` mode enabled and do not weaken compiler settings to bypass an
  error.
- Prefer `interface` for extendable object shapes and `type` for unions,
  mappings, and compositions; be consistent within a domain.
- Model finite values with literal unions rather than unbounded `string`.
- Avoid `any`. Use `unknown` at trust boundaries and narrow it before use.
- Do not use unsafe type assertions as a substitute for runtime validation.
- Type function inputs and exported return values when the contract is not
  immediately obvious.
- Use `import type` for type-only imports.
- Treat values from JSON, URLs, forms, storage, networks, and environment
  variables as untrusted until validated.
- Prefer pure transformation and lookup functions in `src/lib/`.

## React

- Use function components and immutable props.
- Keep components focused on one UI responsibility; extract repeated or
  independently testable behavior.
- Derive values during render when possible. Use state only for values that
  change over time and affect rendering.
- Use effects to synchronize with external systems, not to calculate ordinary
  render data.
- Provide stable semantic keys from domain data; do not use array indexes when
  items can be reordered.
- Preserve semantic HTML, keyboard behavior, visible focus, useful alternative
  text, and appropriate accessible names.
- Keep presentation near the component and domain logic in typed helpers.
- Render explicit loading, empty, error, and success states for asynchronous or
  fallible UI.

## Next.js

This repository uses Next.js 16 App Router. Read the relevant guide in
`node_modules/next/dist/docs/` before changing framework behavior because the
installed version may differ from remembered APIs.

- Treat layouts and pages as Server Components by default.
- Add `"use client"` only at the narrowest boundary that requires state,
  effects, event handlers, or browser APIs.
- Keep secrets and privileged data access in server-only code.
- Use App Router file conventions for routes, metadata, loading, errors, and
  not-found behavior.
- In this installed version, dynamic route `params` are asynchronous; follow
  the local type pattern and `await` them.
- Use `next/image`, `next/link`, and metadata APIs where appropriate.
- Keep props crossing the server/client boundary serializable.
- Avoid importing browser-only packages into the server module graph; isolate
  them behind client components or dynamic imports when necessary.
- Verify behavior with `npm run build`; development rendering alone is not
  enough.

## JSON

- Use valid JSON: double-quoted keys and strings, no comments, and no trailing
  commas.
- Format with two-space indentation and a final newline.
- Keep property order stable and group related fields consistently.
- Use ISO 8601 dates (`YYYY-MM-DD`) and explicit IANA time zones when time-zone
  behavior matters.
- Use numbers for numeric values and document the unit in the field name or
  schema. Never encode a number as a formatted display string.
- Use stable, lowercase, hyphenated identifiers that are unique within their
  domain.
- Keep currency as an ISO 4217 code and coordinates as numeric latitude and
  longitude.
- Update the corresponding TypeScript types and all consumers when a data
  shape changes.
- Add runtime schema validation before accepting user-provided or remote JSON.
  A compile-time assertion does not validate runtime data.

## Shell scripts

- Use Bash when Bash features are required and begin executable scripts with
  `#!/usr/bin/env bash`.
- Enable strict behavior with `set -Eeuo pipefail` unless a documented reason
  requires a narrower setting.
- Quote variable expansions and paths.
- Resolve the repository root from the script location instead of assuming the
  caller's working directory.
- Use descriptive, task-specific variable names. Do not repurpose environment
  variables such as `HOME`.
- Prefer functions for repeated or independently understandable operations.
- Print actionable errors to standard error and exit nonzero on failure.
- Make setup and installer operations idempotent where practical.
- Validate changed scripts with `bash -n <script>` and, when available,
  ShellCheck.
- Do not print credentials or use destructive commands with unresolved
  variables, broad globs, or unvalidated paths.

## Docker and Compose

- Pin image versions intentionally; avoid floating `latest` tags.
- Use development and production configurations for their distinct purposes.
- Keep build context small with `.dockerignore` when images are introduced.
- Run applications as a non-root user in production images.
- Do not bake secrets into images or commit secret-bearing environment files.
- Add health checks for long-running production services.
- Use named volumes only for data that must persist; document ownership and
  backup expectations.
- Keep containers disposable. Configuration belongs in environment or tracked
  files and durable state belongs in an explicit data store.
- Validate Compose changes with `docker compose config` and verify service logs
  after restart.

## Naming

| Item | Convention | Example |
| --- | --- | --- |
| React component and file | `PascalCase` | `JourneyTimeline.tsx` |
| Type or interface | `PascalCase` | `TripLocation` |
| Function and variable | `camelCase` | `getItineraryDay` |
| Constant | `UPPER_SNAKE_CASE` | `STATUS_LABELS` |
| Route or data directory | lowercase kebab-case | `switzerland-2026` |
| JSON identifier | lowercase kebab-case | `lucerne-station` |
| Branch slug | lowercase kebab-case | `feature/bt-020-weather` |
| Environment variable | `UPPER_SNAKE_CASE` | `MAP_API_TOKEN` |

Choose names that express domain meaning. Avoid ambiguous abbreviations,
generic containers such as `data`, and redundant type suffixes.

## Imports

Order imports in groups separated by one blank line:

1. framework and external packages;
2. absolute project imports through the `@/` alias;
3. relative imports;
4. styles or other side effects.

Use type-only imports where possible. Avoid deep imports into another module's
private implementation and avoid circular dependencies. Prefer the `@/` alias
for imports across `src/`; use relative paths for tightly colocated files.

## Formatting

- Follow the repository's ESLint and TypeScript configuration.
- Use two spaces for JavaScript, TypeScript, JSX, JSON, YAML, and Markdown
  nesting unless a format requires otherwise.
- Keep lines readable; wrap complex JSX and prose instead of forcing horizontal
  scrolling.
- Include a final newline and remove trailing whitespace.
- Let an adopted formatter own mechanical style. Do not mix unrelated
  reformatting into a functional change.
- Run `git diff --check` before every handoff.

## Comments

- Explain intent, constraints, tradeoffs, or non-obvious behavior; do not
  narrate syntax.
- Keep comments current when code changes.
- Use documentation comments for exported APIs only when they add contract
  information that types and names cannot express.
- Include a tracking reference and removal condition for temporary workarounds.
- Do not leave commented-out code; version control already retains history.

## Error handling

- Fail early at trust boundaries with messages that identify the operation and
  relevant safe context.
- Preserve the original error as a cause when wrapping it.
- Never silently discard errors unless the fallback is intentional and
  documented.
- Do not expose secrets, tokens, internal paths, or personal data in UI errors
  or logs.
- Log once at the layer that can add useful context; avoid duplicate noise.
- Use Next.js error and not-found conventions for route-level failures.
- Give users an actionable recovery path where one exists.
- Test failure paths as deliberately as success paths.
