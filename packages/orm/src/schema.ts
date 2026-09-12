import type {
  ColumnDefinition,
  ColumnKind,
  ColumnOptions,
  ModelDefinition,
  ModelSchema
} from './types.js';

const defineColumn = <T, TKind extends ColumnKind, TOptions extends ColumnOptions>(
  kind: TKind,
  options: TOptions
): ColumnDefinition<T, TKind, TOptions> => ({ kind, options });

export const number = <TOptions extends ColumnOptions = ColumnOptions>(
  options = {} as TOptions
): ColumnDefinition<number, 'number', TOptions> =>
  defineColumn<number, 'number', TOptions>('number', options);

export const string = <TOptions extends ColumnOptions = ColumnOptions>(
  options = {} as TOptions
): ColumnDefinition<string, 'string', TOptions> =>
  defineColumn<string, 'string', TOptions>('string', options);

export const boolean = <TOptions extends ColumnOptions = ColumnOptions>(
  options = {} as TOptions
): ColumnDefinition<boolean, 'boolean', TOptions> =>
  defineColumn<boolean, 'boolean', TOptions>('boolean', options);

export const defineModel = <TName extends string, TSchema extends ModelSchema>(
  name: TName,
  schema: TSchema
): ModelDefinition<TName, TSchema> => ({ name, schema });
