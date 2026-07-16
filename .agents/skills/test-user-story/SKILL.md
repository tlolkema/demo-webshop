---
name: test-user-story
description: Test a user story using the 'playwright-cli' skill. Trigger when user asks to test a user story or wants to verify local development changes.
allowed-tools: Bash
---

# Test User Story

Validate a user story by deriving test cases from it and executing each one via the skill 'playwright-cli'. Produce the user-selected evidence type for the executed flow.

## Variables

USER_STORY: the full text of $ARGUMENTS

When this skill is called without arguments, ask the user what functionality or user story they want to test. If the user mentions a specific story or ticket, use the `get-user-story` skill to retrieve the full user story before deriving test cases.

## Workflow

### Step 1 — Derive test cases

Read USER_STORY and break it down into a concrete, numbered list of independent test cases. Each test case must have:

- A short name (e.g. "Login with valid credentials")
- A clear goal in one sentence
- The specific steps to perform
- The expected outcome that determines pass or fail

Do not proceed to Step 2 until this list is complete.

IMPORTANT: Combine related checks into a single case when they share the same user flow. Only create separate test cases when they truly represent different user flows.

## Step 2 - User approval

- Ask the user which test cases to execute, do this in a multiple choice format so the user can select which test cases to execute.
- Ask the user which environment to use, do this in a multiple choice format so the user can select the environment, check environments from: `<repo>/environments.json`
- Ask the user which evidence type to create: `screenshots` or `videos`. There is no default; the user must choose one.

Do not proceed to Step 3 until the user has selected the test cases to execute, the environment to use, and the evidence type.

### Step 3 — Execute test cases

Before capturing evidence, create the evidence directory:

```bash
mkdir -p ai-evidence/<story-name>
```

Use this directory for all evidence and the HTML report for the run. Capture only the evidence type selected by the user unless that type is not technically possible.

#### Evidence

Capture evidence for each executed browser flow using the evidence type selected by the user.

If the user selected `videos`:

1. First explore and execute the complete test case normally with `playwright-cli` to identify stable locators, actions, assertions, and timing.
2. After the full test case has been explored and performed, do another run and create the evidence using the video recording capabilities. Use annotations and pauses (every annotation = 2 second pause)

Always stop video recording before reporting, including on failures. If the selected evidence type cannot be captured, continue with the other evidence type and mention why in the report.

#### HTML evidence report

After executing the selected test cases, create a small local HTML report at `ai-evidence/<story-name>/index.html`.

Generate this report repeatably from the template at `.agents/skills/test-user-story/references/report.html`; do not invent new report structure or styling during each run.

Create a run data file at `ai-evidence/<story-name>/report-data.json`, then call the report generator exactly like this:

```bash
node .agents/skills/test-user-story/references/generate-report.js ai-evidence/<story-name>/report-data.json
```

The generator writes `ai-evidence/<story-name>/index.html`. The report title is “AI report”.

Use this JSON shape for `report-data.json`:

```json
{
  "storyName": "Story title",
  "environment": "production",
  "environmentUrl": "https://example.com/",
  "overallStatus": "PASS or FAILURE",
  "passedCases": 1,
  "totalCases": 2,
  "cases": [
    {
      "number": 1,
      "name": "Case name",
      "goal": "Case goal",
      "status": "PASS, FAIL, or SKIPPED",
      "steps": ["Step 1", "Step 2"],
      "evidence": "relative-evidence-file.webm",
      "failedStep": "Step that failed; only required for FAIL",
      "expected": "Expected result; only required for FAIL",
      "actual": "Actual result; only required for FAIL",
      "consoleErrors": ["Console errors captured at failure time; only for FAIL"]
    }
  ]
}
```

Failure details and possible console errors must be stored on the failing test case object so the generated report renders them inside the failed case card, not in a separate section at the bottom of the page.

Use relative paths from `index.html` to the evidence files so the report is portable with its directory.

Before reporting completion, validate the generated report:

- The `node .agents/skills/test-user-story/references/generate-report.js ...` command completed successfully.
- No `{{PLACEHOLDER}}` tokens remain in `index.html`.
- All referenced evidence files exist next to `index.html`.

### Step 4 — Report status to user

## Report

After executing the testcases report in the following format.

### On success

```
✅ SUCCESS

**Story:** <story name>
**Steps:** N/N passed
**Evidence:** ./ai-evidence/<story-name>/

| #   | Step             | Status | Evidence |
| --- | ---------------- | ------ | -------- |
| 1   | Step description | PASS   | 01-step-name.webm |
| 2   | Step description | PASS   | 02-step-name.png |

**AI report:** [Open report](file://<absolute-path-to>/ai-evidence/<story-name>/index.html)
```

### On failure

```
❌ FAILURE

**Story:** <story name>
**Steps:** X/N passed
**Failed at:** Step Y
**Evidence:** ./ai-evidence/<story-name>/

| #   | Step             | Status  | Evidence         |
| --- | ---------------- | ------- | ---------------- |
| 1   | Step description | PASS    | 00_step-name.webm |
| 2   | Step description | FAIL    | 01_step-name.png  |
| 3   | Step description | SKIPPED | —                |

### Failure Detail
**Step Y:** Step description
**Expected:** What should have happened
**Actual:** What actually happened

### Console Errors
<JS console errors captured at time of failure>

**AI report:** [Open report](file://<absolute-path-to>/ai-evidence/<story-name>/index.html)
```
