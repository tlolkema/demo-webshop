---
name: write-e2e-test
description: Write a Playwright e2e test from test cases and playwright-cli data gathered in earlier workflow steps. Validates the test by running it once; fixes failures; then reruns at least 3 more times to confirm it is not flaky.
allowed-tools: Bash(npm:*) Bash(npx:*)
---

# Write E2E Test

Translate the test cases and Playwright exploration data from earlier workflow steps into a committed Playwright spec file, then validate it for correctness and stability.

## Variables

- **TEST_CASES**: the numbered test case list produced in the `test-user-story` step
- **PLAYWRIGHT_DATA**: the locators, selectors, actions, and timing observations captured during `playwright-cli` execution in the `test-user-story` step
- **STORY_NAME**: the slug / short title of the user story (used for the spec file name)

## Workflow

### Step 1 — Review available context

Before writing any code, collect the following from earlier steps in the session:

1. The numbered test cases produced when deriving cases from the user story (carry them forward from `test-user-story` Step 1).
2. The stable locators and action sequences discovered while executing those cases via `playwright-cli` (carry them forward from `test-user-story` Step 3).
3. The existing test conventions in this repository:
   - Read `e2e-tests/AGENTS.md` for project-specific rules.
   - Skim one existing spec (e.g. `e2e-tests/tests/basket.spec.ts`) to confirm structure, import style, and `beforeEach` pattern.

Do not re-explore the browser or re-derive test cases; use only what was already gathered.

### Step 2 — Write the spec file

Create a new Playwright spec at:

```
e2e-tests/tests/<story-slug>.spec.ts
```

Rules:
- Follow the **exact same conventions** as the existing specs: Gherkin-style `test.step` blocks (`Given`, `When`, `Then`), no page-object classes, same import line.
- Map every test case from TEST_CASES to one `test(...)` block.
- Use the **exact locators** captured in PLAYWRIGHT_DATA (role-based selectors preferred; fall back to data-testid or CSS only when no accessible role exists).
- Add a `test.beforeEach` that resets local state (e.g. `localStorage.clear()`) if the existing specs do so.
- Keep assertions tight: assert the specific element and text that proves the case passed, not generic page content.
- Do not add extra imports, helpers, or abstractions that do not exist in the other specs.

### Step 3 — Initial validation run

Run the newly created spec once in isolation:

```bash
npx playwright test e2e-tests/tests/<story-slug>.spec.ts --project=chromium
```

#### If the run fails

1. Read the error output carefully.
2. Identify the root cause (wrong locator, missing await, incorrect assertion, timing issue, etc.).
3. Fix the spec file — one targeted change at a time.
4. Re-run until the spec passes.
5. Do not proceed to Step 4 until the spec passes cleanly.

#### If the run passes

Proceed directly to Step 4.

### Step 4 — Stability run (flakiness check)

Run the spec **at least 3 more times** (back-to-back) to confirm it is not flaky:

```bash
npx playwright test e2e-tests/tests/<story-slug>.spec.ts --project=chromium
npx playwright test e2e-tests/tests/<story-slug>.spec.ts --project=chromium
npx playwright test e2e-tests/tests/<story-slug>.spec.ts --project=chromium
```

- If **all runs pass**: the test is stable. Report the result (spec path, number of tests, pass count across all runs).
- If **any run fails**: treat it as a flakiness issue. Investigate the failure, apply a fix (e.g. stricter waits, more specific assertions), and restart from Step 3.

### Step 5 — Report

Summarise the outcome:

- Path of the written spec file.
- Number of test cases written.
- Result of the initial validation run (pass / fixed-after-N-retries).
- Results of the 3+ stability runs (e.g. "4 / 4 runs passed").
- Any locator or timing changes made during fixing.
