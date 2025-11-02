---
title: Query Builder
description: Master the type-safe query builder API
---

The query builder provides a fluent, chainable API for querying your SQLite database with full TypeScript type safety.

## Basic Queries

Start a query with `db.query(tableName)`:

```typescript
const todos = await db.query("todos").all();
// Returns all rows from the todos table
```

## Where Clauses

Filter results with `.where()`:

```typescript
// Single condition
const completedTodos = await db.query("todos")
  .where("completed", "=", true)
  .all();

// Multiple conditions (AND)
const recentTodos = await db.query("todos")
  .where("completed", "=", false)
  .where("createdAt", ">", "2024-01-01")
  .all();
```

### Supported Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `=` | `.where("id", "=", "123")` | Equality |
| `!=` | `.where("status", "!=", "deleted")` | Inequality |
| `>` | `.where("age", ">", 18)` | Greater than |
| `>=` | `.where("age", ">=", 18)` | Greater than or equal |
| `<` | `.where("price", "<", 100)` | Less than |
| `<=` | `.where("price", "<=", 100)` | Less than or equal |
| `LIKE` | `.where("name", "LIKE", "%John%")` | Pattern matching |
| `IN` | `.where("status", "IN", ["active", "pending"])` | Value in list |

:::tip
The `IN` operator accepts an array of values and generates `WHERE column IN (?, ?, ...)` SQL.
:::

## Selecting Columns

Use `.select()` to choose specific columns:

```typescript
// Select specific columns
const titles = await db.query("todos")
  .select("id", "title")
  .all();
// Type: Array<{ id: string, title: string }>

// Select single column
const ids = await db.query("todos")
  .select("id")
  .all();
// Type: Array<{ id: string }>
```

Without `.select()`, all columns are returned:

```typescript
const todos = await db.query("todos").all();
// Type: Array<{ id: string, title: string, completed: boolean, createdAt: string }>
```

## Ordering

Sort results with `.orderBy()`:

```typescript
// Ascending order (default)
const todos = await db.query("todos")
  .orderBy("createdAt", "ASC")
  .all();

// Descending order
const todos = await db.query("todos")
  .orderBy("createdAt", "DESC")
  .all();

// Multiple columns
const todos = await db.query("todos")
  .orderBy("completed", "ASC")
  .orderBy("createdAt", "DESC")
  .all();
```

## Limiting Results

Use `.limit()` and `.skip()` for pagination:

```typescript
// Get first 10 results
const page1 = await db.query("todos")
  .limit(10)
  .all();

// Get next 10 results
const page2 = await db.query("todos")
  .skip(10)
  .limit(10)
  .all();

// Pagination helper
function paginateTodos(page: number, pageSize: number) {
  return db.query("todos")
    .skip(page * pageSize)
    .limit(pageSize)
    .all();
}
```

## Query Execution Methods

### `.all()`

Returns all matching rows as an array:

```typescript
const todos = await db.query("todos").all();
// Type: Array<Todo>
```

### `.first()`

Returns the first matching row or `null`:

```typescript
const todo = await db.query("todos")
  .where("id", "=", "123")
  .first();
// Type: Todo | null

if (todo) {
  console.log(todo.title);
}
```

### `.count()`

Returns the number of matching rows:

```typescript
const totalTodos = await db.query("todos").count();
// Type: number

const completedCount = await db.query("todos")
  .where("completed", "=", true)
  .count();
```

## Chaining

Chain methods to build complex queries:

```typescript
const results = await db.query("todos")
  .where("completed", "=", false)
  .where("priority", "IN", ["high", "urgent"])
  .orderBy("createdAt", "DESC")
  .skip(0)
  .limit(20)
  .select("id", "title", "priority")
  .all();

// Type: Array<{ id: string, title: string, priority: string }>
```

The order of most methods doesn't matter, except:
- `.select()` should come before `.all()` or `.first()`
- `.limit()` and `.skip()` should come at the end
- `.count()`, `.all()`, `.first()` must be last (they execute the query)

## Type Safety

The query builder maintains full type safety throughout the chain:

```typescript
const dbSchema = {
  users: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    age: z.number(),
  })
} as const;

// ✅ Valid - 'users' table exists
db.query("users")

// ❌ TypeScript error - 'invalid' table doesn't exist
db.query("invalid")

// ✅ Valid - 'name' column exists
db.query("users").where("name", "=", "Alice")

// ❌ TypeScript error - 'invalid' column doesn't exist
db.query("users").where("invalid", "=", "value")

// ✅ Valid - string value for string column
db.query("users").where("name", "=", "Alice")

// ❌ TypeScript error - number value for string column
db.query("users").where("name", "=", 42)

// ✅ Valid - selecting existing columns
db.query("users").select("id", "name")

// ❌ TypeScript error - selecting non-existent column
db.query("users").select("invalid")
```

## Advanced Patterns

### Reusable Queries

Store query builders for reuse:

```typescript
function getActiveTodos() {
  return db.query("todos")
    .where("completed", "=", false)
    .where("deletedAt", "=", null);
}

// Use the builder
const recent = await getActiveTodos()
  .orderBy("createdAt", "DESC")
  .limit(10)
  .all();

const highPriority = await getActiveTodos()
  .where("priority", "=", "high")
  .all();
```

### Dynamic Filtering

Build queries dynamically:

```typescript
function searchTodos(filters: {
  completed?: boolean;
  priority?: string;
  search?: string;
}) {
  let query = db.query("todos");

  if (filters.completed !== undefined) {
    query = query.where("completed", "=", filters.completed);
  }

  if (filters.priority) {
    query = query.where("priority", "=", filters.priority);
  }

  if (filters.search) {
    query = query.where("title", "LIKE", `%${filters.search}%`);
  }

  return query.all();
}

// Use it
const results = await searchTodos({
  completed: false,
  priority: "high",
  search: "urgent"
});
```

### Pagination

Create a pagination helper:

```typescript
async function paginate<T>(
  query: QueryBuilder<T>,
  page: number,
  pageSize: number
) {
  const total = await query.count();
  const data = await query
    .skip(page * pageSize)
    .limit(pageSize)
    .all();

  return {
    data,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}

// Use it
const result = await paginate(
  db.query("todos").where("completed", "=", false),
  0,
  20
);
```

## Raw SQL Access

For complex queries not supported by the builder, use `.raw()`:

```typescript
const results = await db.raw<CustomType>(
  "SELECT * FROM todos WHERE title LIKE ? AND completed = ?",
  ["%urgent%", false]
);
```

See the [API Reference](/api/raw-sql/) for more details on raw SQL.

## Next Steps

- [Mutations](/core/mutations/) - Learn how to insert, update, and delete data
- [Migrations](/core/migrations/) - Manage schema changes over time
- [Type Safety Guide](/guides/type-safety/) - Advanced type safety patterns
