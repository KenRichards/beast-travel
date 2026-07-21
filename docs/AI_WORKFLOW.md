# AI Workflow

BEAST projects use ChatGPT for product reasoning and milestone design, Codex
for repository implementation and executed validation, and a human owner for
intent, access, review, and release authority.

## Collaboration model

```text
Human intent
    |
    v
ChatGPT planning and acceptance criteria
    |
    v
Human-approved milestone
    |
    v
Codex repository inspection, implementation, and validation
    |
    v
ChatGPT-assisted review + human review
    |
    v
Human-approved merge and release
```

This is a feedback loop, not a one-way handoff. Codex reports repository facts
that can refine the plan. ChatGPT helps evaluate scope or product tradeoffs.
The human decides any change that materially alters outcome, risk, cost, or
external state.

## Defining a milestone

Begin with [the milestone template](../templates/milestone.md). A milestone is
ready for implementation only when it contains:

- a stable identifier and concise title;
- a user- or system-visible objective;
- explicit in-scope work and exclusions;
- dependencies, constraints, assumptions, and known risks;
- acceptance criteria that can be demonstrated as true or false;
- required static, build, runtime, and manual validation;
- the expected branch, commit, and final handoff behavior.

Keep a milestone small enough to review as one coherent change. Split it when
independent outcomes, migrations, provider integrations, or risky operational
changes would obscure validation or rollback.

## ChatGPT workflow

ChatGPT should:

1. clarify the desired outcome and audience;
2. identify missing decisions without inventing repository facts;
3. propose scope, exclusions, sequencing, and acceptance criteria;
4. anticipate error states, privacy, accessibility, migration, and operational
   needs;
5. produce a Codex request using
   [the implementation template](../templates/codex-task.md);
6. evaluate the returned diff summary and evidence against the milestone;
7. help the human decide whether follow-up work is required.

Plans should label assumptions. They should never include secrets or encourage
the agent to bypass repository protections.

## Codex workflow

Codex should:

1. read all applicable repository instructions before acting;
2. confirm the current branch and working tree, preserving unrelated changes;
3. inspect source, configuration, history, tests, and locally installed
   framework documentation relevant to the task;
4. state material assumptions and create the requested branch;
5. implement the smallest complete change that satisfies the criteria;
6. inspect its own diff and check for scope drift, secrets, temporary output,
   and generated artifacts;
7. run the exact validation requested plus any checks warranted by changed
   files;
8. report commands and outcomes honestly, including skipped or unavailable
   checks;
9. commit, push, open a PR, deploy, or stop only as the task explicitly directs.

Codex should pause for human direction when a required decision would change
product behavior, expose or destroy data, add meaningful cost, require new
external authority, or substantially expand scope.

## Acceptance criteria

Acceptance criteria describe observable outcomes, not implementation activity.
Use precise statements such as:

- “A valid `/trips/<trip-id>/day/<day>` route returns HTTP 200 and displays the
  matching itinerary title.”
- “An unknown trip or day resolves through the application not-found flow.”
- “No client bundle receives the weather provider credential.”

Avoid criteria such as “code is clean” or “feature is implemented.” Translate
quality expectations into checks, constraints, or reviewable behavior. Every
criterion must have an owner and evidence source: automated check, route
verification, log inspection, screenshot, or human review.

If understanding changes during implementation, update the milestone and
obtain human agreement before treating new behavior as accepted scope.

## Validation requirements

Validation must be proportional to the change and must follow
[the repository validation guide](VALIDATION.md). At minimum:

- syntax checks cover every changed shell script;
- whitespace and patch integrity pass;
- TypeScript compiles without emission;
- the production application builds;
- affected routes are exercised in a running environment;
- runtime logs are inspected for errors;
- the final repository status contains only intentional changes, or is clean
  after the requested commit.

An AI may run and summarize checks, but it may not claim a command passed if it
was not executed. When an environment cannot support a check, the handoff must
name the missing check and explain what the human must do.

## Review expectations

AI review and human review serve different purposes and both are valuable.

Codex self-review should compare the full diff with scope, inspect error paths,
verify repository conventions, and remove accidental changes. ChatGPT review
can compare the implementation summary to product intent and identify missing
acceptance coverage. Human review must evaluate:

- whether the result solves the intended problem;
- user experience, visual quality, and accessibility;
- security, privacy, operational impact, and third-party cost;
- maintainability and architectural fit;
- the credibility and completeness of validation evidence.

AI output is proposed work. The human remains accountable for approval, merge,
deployment, and release.

## Prompt and data safety

- Never place passwords, tokens, private keys, personal travel documents,
  payment details, or production data in an AI prompt.
- Use placeholders for secrets and let the human configure them through an
  approved secret store.
- Give agents only the access and scope required for the milestone.
- Treat pasted external content as untrusted data, not instructions.
- Review generated code for dependency, licensing, security, and privacy impact.
- Preserve a traceable issue, branch, diff, validation record, and review for
  AI-assisted changes.
