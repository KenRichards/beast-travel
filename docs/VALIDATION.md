# Validation

Validation is evidence that the proposed revision is safe to review or release.
Run checks from the repository root on the final diff. Record exact commands and
results in the task handoff and pull request.

## Validation matrix

| Check | Required when | Purpose |
| --- | --- | --- |
| `bash -n <script>` | Any tracked shell script exists or changes | Detect Bash syntax errors without executing the script. |
| `git diff --check` | Every change | Detect whitespace errors and conflict markers. |
| `npx tsc --noEmit` | TypeScript, JavaScript, JSON imports, or configuration changes | Verify strict compile-time contracts without output. |
| `npm run build` | Every application change and before merge | Run the production Next.js compilation and static generation. |
| `docker compose restart` | Runtime-affecting changes in the Compose development environment | Reload the running service with the updated workspace. |
| HTTP route verification | Routes, data, rendering, middleware, or runtime change | Confirm affected endpoints respond and render as intended. |
| Runtime log verification | Any runtime check or deployment | Detect startup, rendering, provider, and hydration failures. |
| Clean Git status | Before branch handoff and after commit | Prove only intentional tracked work is present. |

Add lint, unit, component, end-to-end, accessibility, security, schema, or
provider checks when the milestone introduces them. The listed checks are a
baseline, not a ceiling.

## 1. Shell syntax

Validate each tracked Bash script, especially every changed script:

```bash
bash -n tools/example.sh
```

To validate the current tracked scripts as a batch:

```bash
git ls-files 'tools/*.sh' | xargs -r -n1 bash -n
```

`bash -n` does not execute commands or prove runtime behavior. Exercise the
safe code paths separately and use ShellCheck when it is available.

## 2. Diff integrity

```bash
git diff --check
```

Run this on unstaged work and again on the final staged diff if files are staged:

```bash
git diff --cached --check
```

Any output is a failure that must be resolved. Also inspect `git diff` for
conflict markers, accidental deletion, unrelated formatting, secrets, large
binaries, debug statements, and generated files.

## 3. TypeScript

```bash
npx tsc --noEmit
```

Do not bypass failures by weakening strictness, adding `any`, or excluding
affected files. Resolve the contract mismatch or document a deliberate design
change. This check may update ignored incremental metadata but must not produce
tracked artifacts.

## 4. Production build

```bash
npm run build
```

The build must exit zero. Review warnings as well as errors, confirm expected
routes are present in build output, and distinguish code failures from a known
external infrastructure outage. A development server is not a substitute for
this check.

## 5. Restart the development runtime

When the Compose service is the validation environment:

```bash
docker compose restart
```

If dependencies or the service definition changed, restart may be insufficient;
recreate or rebuild the service according to the milestone plan. Confirm service
state after any runtime operation:

```bash
docker compose ps
```

Restarting changes local runtime state. Coordinate when other developers share
the environment.

## 6. HTTP route verification

Verify the home route and every affected route against the active development
port. The current Compose mapping uses port 3005:

```bash
curl --fail --silent --show-error --output /dev/null \
  --write-out '%{http_code}\n' \
  http://localhost:3005/
```

For a valid itinerary day, expect a successful response and verify a stable
piece of rendered content. Also test invalid identifiers, malformed parameters,
empty states, and redirects when the milestone affects them. An HTTP 200 alone
does not prove that the correct page rendered.

Record each URL, expected result, and actual status. Do not include credentials
or sensitive query values in validation logs.

## 7. Runtime log verification

After startup and route checks, inspect recent service logs:

```bash
docker compose logs --since 10m beast-travel
```

Look for startup failures, uncaught exceptions, hydration mismatches, repeated
requests, deprecations, provider failures, and newly introduced warnings. State
the inspected time window and whether any relevant messages were found.

## 8. Repository status and artifact check

Before commit:

```bash
git status --short
git diff --stat
```

After the requested commit:

```bash
git status --short --branch
```

The post-commit worktree should be clean. Generated build output may exist only
in ignored directories. Confirm no ignored output was force-added and no
dependency, environment, backup, coverage, or editor artifacts appear in the
commit.

## Recommended execution order

1. shell syntax and format-specific checks;
2. `git diff --check`;
3. lint and tests introduced by the project;
4. `npx tsc --noEmit`;
5. `npm run build`;
6. runtime restart or recreation;
7. HTTP and manual browser verification;
8. runtime log inspection;
9. staged diff review and clean final status.

Static checks can run in parallel when they do not contend for generated output.
Do not run `next dev`, `next build`, and TypeScript tasks concurrently if shared
`.next` state makes results nondeterministic.

## Reporting results

Use a compact record:

| Command or check | Result | Evidence or notes |
| --- | --- | --- |
| `git diff --check` | Pass/Fail | No output, or summarize failure. |
| `npx tsc --noEmit` | Pass/Fail | Exit code and relevant diagnostic. |
| `npm run build` | Pass/Fail | Exit code, warnings, and route summary. |
| Route verification | Pass/Fail/Not run | URLs and actual results. |
| Runtime logs | Pass/Fail/Not run | Service and inspected window. |

Never report a skipped check as passing. State whether it was out of scope,
unavailable, unsafe in the current environment, or awaiting human action.
