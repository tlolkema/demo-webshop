# End-to-end tests

Simple Playwright tests for the demo webshop. Each test uses Gherkin-style `Given`, `When`, and `Then` test steps; no page objects are used.

## Setup

From the repository root:

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm test
```
