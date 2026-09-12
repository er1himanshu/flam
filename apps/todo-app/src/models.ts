import 'dotenv/config';
import { boolean, createOrmClient, defineModel, number, string } from '@flamai/light-orm';

export const Todo = defineModel('todo', {
  id: number({ primaryKey: true, generated: true }),
  title: string(),
  completed: boolean({ default: false })
});

const models = [Todo] as const;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run todo-app');
}

export const db: ReturnType<typeof createOrmClient<typeof models>> = createOrmClient({
  connectionString,
  models
});