import { Pool } from 'pg';
import {
  buildDeleteQuery,
  buildInsertQuery,
  buildSelectQuery,
  buildUpdateQuery
} from './query-builder.js';
import type {
  DeleteArgs,
  FindManyArgs,
  InferCreate,
  ModelClient,
  ModelDefinition,
  ModelSchema,
  QueryExecutor,
  UpdateArgs
} from './types.js';

type ModelMap<TModels extends readonly ModelDefinition<string, ModelSchema>[]> = {
  [TModel in TModels[number] as TModel['name']]: ModelClient<TModel>;
};

export type OrmClient<TModels extends readonly ModelDefinition<string, ModelSchema>[]> =
  ModelMap<TModels> & {
    $query: QueryExecutor['query'];
    $close: () => Promise<void>;
  };

export type CreateClientArgs<TModels extends readonly ModelDefinition<string, ModelSchema>[]> = {
  models: TModels;
  executor?: QueryExecutor;
  connectionString?: string;
};

const modelClient = <TModel extends ModelDefinition<string, ModelSchema>>(
  executor: QueryExecutor,
  model: TModel
): ModelClient<TModel> => ({
  async create(data: InferCreate<TModel>) {
    const query = buildInsertQuery(model, data);
    const result = await executor.query(query.text, query.values);
    return result.rows[0] as Awaited<ReturnType<ModelClient<TModel>['create']>>;
  },
  async findMany(args?: FindManyArgs<TModel>) {
    const query = buildSelectQuery(model, args);
    const result = await executor.query(query.text, query.values);
    return result.rows as Awaited<ReturnType<ModelClient<TModel>['findMany']>>;
  },
  async update(args: UpdateArgs<TModel>) {
    const query = buildUpdateQuery(model, args);
    const result = await executor.query(query.text, query.values);
    return result.rowCount ?? 0;
  },
  async delete(args: DeleteArgs<TModel>) {
    const query = buildDeleteQuery(model, args);
    const result = await executor.query(query.text, query.values);
    return result.rowCount ?? 0;
  }
});

export const createOrmClient = <TModels extends readonly ModelDefinition<string, ModelSchema>[]>(
  args: CreateClientArgs<TModels>
): OrmClient<TModels> => {
  if (!args.executor && !args.connectionString) {
    throw new Error('Either executor or connectionString must be provided');
  }

  const pool = args.executor ? null : new Pool({ connectionString: args.connectionString });
  const executor: QueryExecutor =
    args.executor ?? {
      query: (text: string, values?: unknown[]) => pool!.query(text, values)
    };

  const output = {} as OrmClient<TModels>;
  output.$query = executor.query.bind(executor);
  output.$close = async () => {
    if (pool) {
      await pool.end();
    }
  };

  for (const model of args.models) {
    output[model.name as keyof ModelMap<TModels>] = modelClient(executor, model) as never;
  }

  return output as OrmClient<TModels>;
};
