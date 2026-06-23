---
name: develop-feature
description: Develop a feature from a scrumboard user story. Fetches the story with get-user-story, asks implementation questions, implements the change, then tests it with test-userstory.
---

# Develop Feature

Implement a feature from a scrumboard ticket with a structured flow: fetch story, clarify implementation, develop, then test.

## Input

`$ARGUMENTS` is the scrumboard ticket id, ticket URL, or user story reference.

## Workflow

### Step 1 — Get the user story

Use the `get-user-story` skill with `$ARGUMENTS` to fetch the ticket from the scrumboard.

Do not continue until the ticket is available and contains enough detail to understand the requested behavior.

### Step 2 — Ask implementation questions

Ask the user the minimum questions needed to safely implement the story. Use multiple-choice questions whenever choosing from known options.

Cover only what is unclear from the ticket, such as:

- Expected user flow or acceptance criteria
- Target environment or pages affected
- UI copy, validation rules, and edge cases
- Data/API behavior
- Whether to preserve backwards compatibility
- Any constraints on scope or files to change

Do not ask questions that can be answered by inspecting the repository.

### Step 3 — Inspect the codebase

Review the relevant files and existing patterns before editing. Prefer following existing structure, naming, styling, and test conventions.

### Step 4 — Develop the feature

Implement the smallest complete change that satisfies the user story and clarified requirements.

During implementation:

- Keep changes focused on the story.
- Reuse existing utilities and patterns.
- Avoid unrelated refactors.
- Update docs or fixtures only when required by the story.
- Run relevant local checks when available.

### Step 5 — Test the user story

Use the `test-user-story` skill with the fetched user story and implemented behavior to validate the feature.

If testing reveals failures, fix the issue and rerun the relevant test flow until the story passes or a blocker is identified.
