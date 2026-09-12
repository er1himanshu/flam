export type Primitive = string | number | boolean;

export type ColumnKind = 'number' | 'string' | 'boolean';

export type ColumnOptions = {
  primaryKey?: boolean;
  generated?: boolean;
  nullable?: boolean;
  default?: Primitive;
};

export type ColumnDefinition<
  T,
  TKind extends ColumnKind = ColumnKind,
  TOptions extends ColumnOptions = ColumnOptions
> = {
  kind: TKind;
  options: TOptions;
  _type?: T;
};

export type ModelSchema = Record<string, ColumnDefinition<Primitive | null, ColumnKind, ColumnOptions>>;

export type ModelDefinition<TName extends string, TSchema extends ModelSchema> = {
  name: TName;
  schema: TSchema;
};

export type InferColumnType<TColumn extends ColumnDefinition<Primitive | null>> =
  TColumn extends ColumnDefinition<infer TValue, ColumnKind, infer TOptions>
    ? TOptions extends { nullable: true }
      ? TValue | null
      : TValue
    : never;

export type InferSelect<TModel extends ModelDefinition<string, ModelSchema>> = {
  [K in keyof TModel['schema']]: InferColumnType<TModel['schema'][K]>;
};

type CreatableKeys<TSchema extends ModelSchema> = {
  [K in keyof TSchema]: TSchema[K]['options']['generated'] extends true
    ? never
    : K;
}[keyof TSchema];

type RequiredCreateKeys<TSchema extends ModelSchema> = {
  [K in CreatableKeys<TSchema>]: TSchema[K]['options']['default'] extends Primitive
    ? never
    : TSchema[K]['options']['nullable'] extends true
      ? never
      : K;
}[CreatableKeys<TSchema>];

type OptionalCreateKeys<TSchema extends ModelSchema> = Exclude<
  CreatableKeys<TSchema>,
  RequiredCreateKeys<TSchema>
>;

export type InferCreate<TModel extends ModelDefinition<string, ModelSchema>> = {
  [K in RequiredCreateKeys<TModel['schema']>]: InferColumnType<TModel['schema'][K]>;
} & {
  [K in OptionalCreateKeys<TModel['schema']>]?: InferColumnType<TModel['schema'][K]>;
};

export type InferUpdate<TModel extends ModelDefinition<string, ModelSchema>> = {
  [K in keyof TModel['schema'] as TModel['schema'][K]['options']['generated'] extends true
    ? never
    : K]?: InferColumnType<TModel['schema'][K]>;
};

export type Where<TModel extends ModelDefinition<string, ModelSchema>> = Partial<
  InferSelect<TModel>
>;

export type FindManyArgs<TModel extends ModelDefinition<string, ModelSchema>> = {
  where?: Where<TModel>;
  limit?: number;
  offset?: number;
};

export type UpdateArgs<TModel extends ModelDefinition<string, ModelSchema>> = {
  where: Where<TModel>;
  data: InferUpdate<TModel>;
};

export type DeleteArgs<TModel extends ModelDefinition<string, ModelSchema>> = {
  where: Where<TModel>;
};

export type QueryResult<T = unknown> = {
  rows: T[];
  rowCount: number | null;
};

export type QueryExecutor = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
};

export type ModelClient<TModel extends ModelDefinition<string, ModelSchema>> = {
  create(data: InferCreate<TModel>): Promise<InferSelect<TModel>>;
  findMany(args?: FindManyArgs<TModel>): Promise<Array<InferSelect<TModel>>>;
  update(args: UpdateArgs<TModel>): Promise<number>;
  delete(args: DeleteArgs<TModel>): Promise<number>;
};
