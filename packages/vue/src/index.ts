/**
 * @alexop/sqlite-vue - Vue 3 integration for SQLite with type-safe queries
 *
 * This package provides Vue 3 composables and plugin for working with SQLite
 * in the browser using WASM and OPFS for persistence.
 *
 * ## Main Exports:
 * - `createSQLite` - Vue plugin factory for setting up SQLite
 * - `useSQLiteClientAsync` - Composable to access the SQLite client
 * - `useSQLiteQuery` - Reactive query composable with auto-refresh
 * - `createTypedComposables` - Factory for creating fully typed composables
 *
 * @packageDocumentation
 */

export { createSQLite } from "./plugin";
export { useSQLiteQuery } from "./useSQLiteQuery";
export { useSQLiteClientAsync } from "./useSQLiteClientAsync";
export { createTypedComposables } from "./typed-composables";
export type { UseSQLiteQueryReturn } from "./typed-composables";
export { SQLITE_CLIENT_KEY } from "./injection";
