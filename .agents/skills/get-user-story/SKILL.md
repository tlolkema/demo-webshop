---
name: get-user-story
description: Fetch a scrumboard ticket by id. Use when the user asks to retrieve, inspect, implement, or test a ticket.
allowed-tools: Bash(curl:*)
---

# Get Ticket

1. Get the numeric ticket id from `$ARGUMENTS`. Ask for it if none is provided.
2. Fetch the ticket:

   ```bash
   curl --fail-with-body --silent --show-error --location \
     -H 'Accept: application/json' \
     "https://scrum-board-navy.vercel.app/api/tickets/<id>"
   ```

3. Use the returned JSON as the ticket context. If the request fails, report the error and stop.
