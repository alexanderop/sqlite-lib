import type { InjectionKey } from "vue";
import type { SQLiteClient, SchemaRegistry } from "@alexop/sqlite-core";

export const SQLITE_CLIENT_KEY: InjectionKey<Promise<SQLiteClient<SchemaRegistry>>> =
  Symbol("SQLITE_CLIENT");
