# Architecture

## Package boundaries

- `packages/orm` contains reusable ORM primitives only:
  - schema/model DSL (`schema.ts`)
  - type system (`types.ts`)
  - SQL generation (`query-builder.ts`)
  - runtime client (`client.ts`)
- `apps/todo-app` contains domain/application code and imports `@flamai/light-orm` via workspace dependency.

This keeps ORM independent and publishable while the app remains a consumer.

## Design tradeoffs

- Chosen API: `defineModel` + generated model clients for ergonomic usage (`db.todo.findMany(...)`).
- Kept query surface intentionally small to keep abstraction clear and explainable for assignment review.
- Used `pg` as a standard Postgres driver for broad compatibility (including serverless Postgres providers).

## Type strategy

- Model schema is the source of truth.
- Derived utility types (`InferCreate`, `InferSelect`, `Where`) enforce compile-time safety.
- Generated/default fields are excluded from required create payloads.

## Query execution flow

1. App calls model method (`create/findMany/update/delete`)
2. Query builder produces parameterized SQL + values
3. Client executes SQL through `QueryExecutor` (`pg` pool by default)
4. Rows are returned with model-aware TypeScript typing

## Out of scope

- Relations and joins abstraction
- Migrations
- Rich operators and nested boolean logic
- Transactions API
