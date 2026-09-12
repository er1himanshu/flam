# FlamAI Lightweight TypeScript ORM Assignment

This repository is a monorepo containing:

- `packages/orm`: a lightweight, typed TypeScript ORM for Postgres/serverless Postgres
- `apps/todo-app`: a small Todo app that consumes the ORM as a workspace package dependency

## Monorepo structure

```txt
flam/
├── packages/
│   └── orm/
│       └── src/
│           ├── client.ts
│           ├── query-builder.ts
│           ├── schema.ts
│           └── types.ts
├── apps/
│   └── todo-app/
│       ├── src/
│       │   ├── models.ts
│       │   └── server.ts
│       └── public/
│           └── index.html
├── tsconfig.base.json
└── README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure database:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to a Postgres connection string (Neon/Supabase/local Postgres all work).

3. Build all workspaces:

```bash
npm run build
```

4. Run Todo app (development):

```bash
npm run dev
```

5. Run Todo app (production build):

```bash
npm run build
npm run start
```

## Database configuration

The Todo app reads `DATABASE_URL` from environment variables.

Example:

```bash
DATABASE_URL=******host:5432/dbname
```

At startup, the app auto-creates a `todo` table if it does not exist.

## ORM API overview

Model definition:

```ts
const Todo = defineModel('todo', {
  id: number({ primaryKey: true, generated: true }),
  title: string(),
  completed: boolean({ default: false })
});
```

Client usage:

```ts
await db.todo.create({ title: 'Finish assignment', completed: false });
await db.todo.findMany({ where: { completed: false } });
await db.todo.update({ where: { id: 1 }, data: { completed: true } });
await db.todo.delete({ where: { id: 1 } });
```

## Type design and inference approach

- `defineModel(...)` captures model name and schema at type level.
- `InferSelect<TModel>` maps schema fields to strongly typed result objects.
- `InferCreate<TModel>` excludes generated fields and marks default/nullable columns as optional.
- `Where<TModel>` is a typed partial of the selected model fields.
- `ModelClient<TModel>` methods (`create`, `findMany`, `update`, `delete`) preserve field-level type safety.

Invalid field names/types are caught at compile time.

## Query flow

`Model API` → `query-builder.ts` → `SQL + parameters` → `pg` driver (`Pool.query`) → typed rows

- `create` uses `INSERT ... RETURNING *`
- `findMany` uses `SELECT *` with optional `WHERE`, `LIMIT`, `OFFSET`
- `update` uses `UPDATE ... SET ... WHERE ...`
- `delete` uses `DELETE ... WHERE ...`

## Todo app features

- Create todo
- List todos
- Mark todo as completed
- Delete todo
- Filter by all/completed/incomplete
- Minimal frontend UI in `apps/todo-app/public/index.html`

## Deployment / packaging readiness

### ORM package publishing

From `packages/orm`:

```bash
npm publish --access public
```

Package includes built `dist` output and exports configured in `package.json`.

### Todo app deployment

The app is standard Node + Express and can be deployed to Render/Railway/Fly/Vercel (Node runtime) by setting:

- build command: `npm run build`
- start command: `npm run start`
- env var: `DATABASE_URL`

## Limitations (intentional)

- No relation support
- Equality-based `where` only (no OR/IN/gt/lt)
- No migrations system
- No transaction helper abstraction
- No query chaining API

## Time spent

~7-9 hours (design, implementation, docs, validation).

## AI usage disclosure

Used GitHub Copilot/Copilot Coding Agent for:

- Initial architecture scaffolding
- Type-level API shaping
- SQL builder/code review assistance
- README/architecture drafting

All final code and structure were reviewed and validated in this repository.
