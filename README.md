# Trello---Impact
Trello Impact is a design concept for Trello, the task board app: when you add or reschedule a task, an AI helper shows you which other tasks that change might disrupt and why, so you can decide what to do before anything is updated.

## Running the prototype

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
```

Built with React 18, TypeScript, Vite and the Atlassian Design System (Atlaskit components, tokens, icons and Pragmatic drag and drop). Mock data lives in `src/data/` and all changes are saved to `localStorage`; use **Profile → Reset demo data** to start over.

## Tests

```sh
npm test            # unit tests (Vitest): dependency engine, timing, Scenario 2, migrations, link safety
npm run test:e2e    # end-to-end tests (Playwright) against the dev server
```

The end-to-end tests need Chromium: run `npx playwright install chromium` once, or point `PLAYWRIGHT_CHROMIUM_PATH` at an installed Chrome or Chromium.

## Demo switches

Add these to the URL, before the `#`:

| Switch | Effect |
|---|---|
| `?impact=creation-failed` | The first applied action fails; the actions after it are held as Not run. |
| `?impact=outcome-unknown` | The last applied action's outcome is unknown, so it can be checked but not retried. |
| `?as=morgan` (any member's first name) | Act as that board member, e.g. to answer an Impact question as the card owner. |
| `?scenario=2` / `?scenario=2-unlinked` | Start Scenario 2 with or without Morgan's link between Website Launch and Accessibility review. |

The product rules for Impact are in [docs/impact-spec.md](docs/impact-spec.md).
