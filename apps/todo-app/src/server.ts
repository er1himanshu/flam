import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './models.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const bootstrap = async (): Promise<void> => {
  await db.$query(`
    CREATE TABLE IF NOT EXISTS "todo" (
      "id" SERIAL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "completed" BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
};

app.get('/api/todos', async (req, res) => {
  const completed = req.query.completed;
  const where =
    completed === 'true' ? { completed: true } : completed === 'false' ? { completed: false } : undefined;

  const todos = await db.todo.findMany({ where });
  res.json(todos);
});

app.post('/api/todos', async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const todo = await db.todo.create({ title, completed: false });
  res.status(201).json(todo);
});

app.patch('/api/todos/:id/complete', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }

  const updated = await db.todo.update({
    where: { id },
    data: { completed: true }
  });

  if (updated === 0) {
    res.status(404).json({ error: 'todo not found' });
    return;
  }

  res.status(204).send();
});

app.delete('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'invalid id' });
    return;
  }

  const deleted = await db.todo.delete({ where: { id } });
  if (deleted === 0) {
    res.status(404).json({ error: 'todo not found' });
    return;
  }

  res.status(204).send();
});

app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const run = async (): Promise<void> => {
  await bootstrap();

  app.listen(port, () => {
    console.log(`Todo app running on http://localhost:${port}`);
  });
};

run().catch(async (error) => {
  console.error(error);
  await db.$close();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await db.$close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.$close();
  process.exit(0);
});