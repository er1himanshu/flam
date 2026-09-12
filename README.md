```markdown
# FlamAI Lightweight TypeScript ORM Assignment

This repository is a monorepo with:

- `packages/orm`: a lightweight, typed TypeScript ORM for Postgres / serverless Postgres
- `apps/todo-app`: a small Todo app that uses the ORM as a workspace package dependency

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

2. Configure the database:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to a Postgres connection string. Neon, Supabase, or local Postgres all work.

3. Build all workspaces:

```bash
npm run build
```

4. Run the Todo app in development:

```bash
npm run dev
```

5. Run the Todo app after build:

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

At startup, the app creates the `todo` table if it does not already exist.

## ORM API

Model definition:

```ts
const Todo = defineModel('todo', {
  id: number({ primaryKey: true, generated: true }),
  title: string(),
  completed: boolean({ default: false })
});
```

Example usage:

```ts
await db.todo.create({ title: 'Finish assignment', completed: false });
await db.todo.findMany({ where: { completed: false } });
await db.todo.update({ where: { id: 1 }, data: { completed: true } });
await db.todo.delete({ where: { id: 1 } });
```

## Type design

- `defineModel(...)` captures the model name and schema at type level.
- `InferSelect<TModel>` maps schema fields to typed result objects.
- `InferCreate<TModel>` excludes generated fields and makes default/nullable fields optional.
- `Where<TModel>` is a typed partial of selected fields.
- `ModelClient<TModel>` keeps `create`, `findMany`, `update`, and `delete` type-safe.

Invalid field names or types are caught at compile time.

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
- Filter by all / completed / incomplete
- Minimal frontend UI in `apps/todo-app/public/index.html`

## Deployment

### ORM package publishing

From `packages/orm`:

```bash
npm publish --access public
```

### Todo app deployment

The app is a standard Node + Express app and can be deployed to Render, Railway, Fly, or Vercel with a Node runtime.

Use:

- build command: `npm run build`
- start command: `npm run start`
- env var: `DATABASE_URL`

## Limitations

- No relation support
- Equality-based `where` only
- No migrations system
- No transaction helper abstraction
- No query chaining API
```
