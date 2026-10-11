# Trello---Impact
Trello Impact is a design concept for Trello, the task board app: when you add or reschedule a task, an AI helper shows you which other tasks that change might disrupt and why, so you can decide what to do before anything is updated.

## Running the prototype

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
```

Built with React 18, TypeScript, Vite and the Atlassian Design System (Atlaskit components, tokens, icons and Pragmatic drag and drop). Mock data lives in `src/data/` and all changes are saved to `localStorage`; use **Profile → Reset demo data** to start over.
