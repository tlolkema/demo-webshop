---
name: get-user-story
description: Fetch a single user story/ticket from the scrumboard API using GET /api/tickets/[id]. Trigger when the user asks to retrieve, inspect, or use a scrumboard ticket by id.
allowed-tools: Bash(curl:*) Bash(jq:*)
---

# Get User Story

Fetch one scrumboard ticket and return it as a concise user story context for implementation or testing.

## Input

`$ARGUMENTS` is the ticket id, ticket URL, or a short phrase containing the ticket id.

## Workflow

1. Extract the numeric ticket id from `$ARGUMENTS`.
2. Fetch the ticket into a shell variable, then validate and normalize it. Do **not** pipe `curl` directly into `jq`; if the API returns an HTML/error response, a transient Vercel response, or mixed output, the direct pipe can produce an unhelpful `jq: parse error` and hide the useful response body.

   ```bash
   ticket_id="<id>"

   response="$(curl --fail-with-body --location --silent --show-error \
     --retry 3 --retry-delay 1 --retry-all-errors \
     -H 'Accept: application/json' \
     -H 'Accept-Encoding: identity' \
     "https://scrum-board-navy.vercel.app/api/tickets/${ticket_id}")"

   printf '%s' "$response" | jq -e . >/dev/null || {
     echo "Ticket API did not return valid JSON for ticket ${ticket_id}. First 1000 bytes:" >&2
     printf '%s' "$response" | head -c 1000 >&2
     exit 1
   }

   printf '%s' "$response" | jq '{id, title, status, description, createdAt, updatedAt}'
   ```

3. Return the normalized `jq` output as the ticket context. Do not return the raw `curl` output or a tool-generated summary.
4. If the command fails, report the validation error and retry once before continuing with any downstream skill. Do not derive test cases from a partial, truncated, or non-JSON response.
