# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SQLite Web is a browser-based SQLite library using WASM and OPFS (Origin Private File System) for persistent storage. It provides a type-safe TypeScript API with Vue 3 integration through composables and plugins.

## Monorepo Structure

This is a pnpm workspace monorepo with two core packages and examples:

- **`packages/core`** (`@alexop/sqlite-core`): Framework-agnostic SQLite client using sqlite-wasm
- **`packages/vue`** (`@alexop/sqlite-vue`): Vue 3 plugin and composables (depends on core)
- **`examples/vue-app`**: Example Vue application

Workspace dependencies use `workspace:*` protocol (e.g., `@alexop/sqlite-core: workspace:*` in vue package).

## Build Commands

```bash
# Install all dependencies
pnpm install

# Build all packages (must build core before vue due to dependency)
pnpm build
# or
pnpm -r run build

# Build specific package
pnpm --filter @alexop/sqlite-core build
pnpm --filter @alexop/sqlite-vue build

# Run Vue example app
pnpm dev:vue
```

## Architecture

### Core Package (`@alexop/sqlite-core`)

The core package wraps sqlite-wasm's worker-based API with a clean async interface:

- **Initialization**: Lazy initialization on first query. Creates SQLite worker and opens database with OPFS VFS
- **Worker Communication**: Uses `sqlite3Worker1Promiser` for async communication with the SQLite worker
- **Migration System**: Runs migrations sorted by version number during initialization
- **Pub/Sub**: Custom event emitter for table change notifications (Map-based, table -> Set<callback>)
- **Query API**: Two main methods:
  - `exec()`: Execute SQL with parameters, returns raw result
  - `query<T>()`: Execute and return typed rows (configured with `rowMode: "object"`)

Key implementation details:
- All queries automatically trigger lazy init if needed
- Database ID (`dbId`) is required for all worker operations after opening
- Results use `rowMode: "object"` to return objects instead of arrays
- Each client instance maintains its own worker and database connection

### Vue Package (`@alexop/sqlite-vue`)

Provides Vue integration through dependency injection:

- **Plugin**: `createSQLite()` installs plugin, provides `Promise<SQLiteClient>` via injection key
- **Composables**:
  - `useSQLiteClientAsync()`: Returns the client promise (must be called during setup, not inside async functions)
  - `useSQLiteQuery()`: Reactive query composable that automatically subscribes to table changes

**Critical Vue Pattern**: `useSQLiteClientAsync()` must be called during component setup (not inside async functions) because it uses `inject()`. Store the promise, then await it later:

```typescript
// Correct: Call inject() during setup
const dbPromise = useSQLiteClientAsync();

async function addTodo() {
  const db = await dbPromise; // Await the stored promise
  // use db...
}
```

### Reactive Query Flow

1. `useSQLiteQuery()` gets client promise via `useSQLiteClientAsync()` during setup
2. On mount, awaits client and runs initial query
3. Subscribes to specified table changes via core's pub/sub
4. When `db.notifyTable(table)` is called, all subscribers re-run their queries
5. Returns reactive refs for `rows`, `loading`, and `error`

## Browser Requirements

SQLite WASM requires specific headers for SharedArrayBuffer support:

```typescript
// vite.config.ts
server: {
  headers: {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
},
optimizeDeps: {
  exclude: ["@sqlite.org/sqlite-wasm"]
}
```

## Publishing

Packages are published to npm with public access:

```bash
# Must build first
pnpm -r run build

# Publish core (independent)
cd packages/core
npm publish --access public

# Publish vue (after core is published, since it depends on core)
cd packages/vue
npm publish --access public
```

## Common Patterns

**Database Filename**: Use OPFS VFS for persistence: `file:mydb.sqlite3?vfs=opfs`

**Migrations**: Pass sorted array of `{ version: number, sql: string }` objects to `createSQLiteClient()`

**Table Change Notifications**: After mutations, call `client.notifyTable("table_name")` to trigger reactive updates in Vue components

**Error Handling**: All worker responses have `type` field - check for `type === "error"` and throw with `result.message`
