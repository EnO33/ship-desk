# ShipDesk

Changelog, public roadmap and feedback board for SaaS products, in one place.

You ship a feature, you write a changelog entry, your users see it. They ask for stuff, they vote, you move it on the roadmap. That's the whole idea.

## Features

- **Changelog** with a rich text editor (Tiptap), drafts and publishing
- **Public roadmap** with drag and drop between columns
- **Feedback board** where users post ideas or bugs and upvote them, with statuses (open, under review, planned, closed)
- **Public project pages** at `/p/<slug>` for changelog, roadmap and feedback
- **Embeddable widget** at `/widget/<slug>` to show your latest updates inside your own app, light or dark
- **Analytics** on page views, posts, feedback and votes over 7, 30 or 90 days
- **i18n** in English, French, German and Spanish
- Dark mode, because obviously

## Stack

- [TanStack Start](https://tanstack.com/start) (SSR, server functions, file-based routing)
- React 19, TypeScript, Zod
- PostgreSQL (Neon) + Drizzle ORM
- Clerk for auth
- Tailwind CSS v4, shadcn/ui, Recharts, dnd-kit
- Vite, Vitest

## Run it locally

```bash
bun install
cp .env.example .env   # Clerk keys + DATABASE_URL
bun run db:push
bun --bun run dev
```

App runs on http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `bun --bun run dev` | Dev server on port 3000 |
| `bun --bun run build` | Production build |
| `bun --bun run test` | Run tests with Vitest |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply migrations |
| `bun run db:studio` | Open Drizzle Studio |
