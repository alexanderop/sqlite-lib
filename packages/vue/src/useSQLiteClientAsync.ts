import { inject } from "vue";
import { SQLITE_CLIENT_KEY } from "./injection";
import type { SQLiteClient, SchemaRegistry } from "@alexop/sqlite-core";

export function useSQLiteClientAsync(): Promise<SQLiteClient<SchemaRegistry>> {
  const promise = inject<Promise<SQLiteClient<SchemaRegistry>> | null>(SQLITE_CLIENT_KEY, null);
  if (!promise) {
    throw new Error("SQLite plugin not installed");
  }
  return promise;
}
