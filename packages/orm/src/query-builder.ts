import type {
  DeleteArgs,
  FindManyArgs,
  InferCreate,
  ModelDefinition,
  ModelSchema,
  UpdateArgs,
  Where
} from './types.js';

const quote = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`;

const whereClause = <TModel extends ModelDefinition<string, ModelSchema>>(
  where?: Where<TModel>,
  startIndex = 1
): { clause: string; values: unknown[] } => {
  if (!where || Object.keys(where).length === 0) {
    return { clause: '', values: [] };
  }

  const values: unknown[] = [];
  let nextParam = startIndex;
  const parts = Object.entries(where).map(([key, value]) => {
    if (value === null) {
      return `${quote(key)} IS NULL`;
    }

    values.push(value);
    const placeholder = `$${nextParam}`;
    nextParam += 1;
    return `${quote(key)} = ${placeholder}`;
  });

  return { clause: ` WHERE ${parts.join(' AND ')}`, values };
};

export const buildInsertQuery = <TModel extends ModelDefinition<string, ModelSchema>>(
  model: TModel,
  data: InferCreate<TModel>
): { text: string; values: unknown[] } => {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    throw new Error(`No data provided for model ${model.name} create`);
  }

  const columns = entries.map(([key]) => quote(key));
  const values = entries.map(([, value]) => value);
  const placeholders = values.map((_, index) => `$${index + 1}`);

  const text = `INSERT INTO ${quote(model.name)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  return { text, values };
};

export const buildSelectQuery = <TModel extends ModelDefinition<string, ModelSchema>>(
  model: TModel,
  args?: FindManyArgs<TModel>
): { text: string; values: unknown[] } => {
  const where = whereClause(args?.where);
  const values = [...where.values];

  let text = `SELECT * FROM ${quote(model.name)}${where.clause}`;

  if (typeof args?.limit === 'number') {
    values.push(args.limit);
    text += ` LIMIT $${values.length}`;
  }

  if (typeof args?.offset === 'number') {
    values.push(args.offset);
    text += ` OFFSET $${values.length}`;
  }

  return { text, values };
};

export const buildUpdateQuery = <TModel extends ModelDefinition<string, ModelSchema>>(
  model: TModel,
  args: UpdateArgs<TModel>
): { text: string; values: unknown[] } => {
  const dataEntries = Object.entries(args.data);
  if (dataEntries.length === 0) {
    throw new Error(`No update data provided for model ${model.name}`);
  }

  const values: unknown[] = [];
  const setClause = dataEntries
    .map(([key, value]) => {
      values.push(value);
      return `${quote(key)} = $${values.length}`;
    })
    .join(', ');

  const where = whereClause(args.where, values.length + 1);
  values.push(...where.values);

  const text = `UPDATE ${quote(model.name)} SET ${setClause}${where.clause}`;
  return { text, values };
};

export const buildDeleteQuery = <TModel extends ModelDefinition<string, ModelSchema>>(
  model: TModel,
  args: DeleteArgs<TModel>
): { text: string; values: unknown[] } => {
  const where = whereClause(args.where);
  const text = `DELETE FROM ${quote(model.name)}${where.clause}`;
  return { text, values: where.values };
};
