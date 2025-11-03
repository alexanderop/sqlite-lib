import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { createSQLiteClient, type SQLiteClient } from "../index";
import { SQLiteError, ValidationError, ConstraintError } from "../errors";

const testSchema = {
  users: z.object({
    id: z.number().optional(),
    name: z.string().min(3),
    email: z.string().email(),
    age: z.number().min(0).max(150),
  }),
  posts: z.object({
    id: z.number().optional(),
    userId: z.number(),
    title: z.string().min(1),
    content: z.string(),
  }),
};

describe("Error Handling", () => {
  let db: SQLiteClient<typeof testSchema>;

  beforeEach(async () => {
    db = await createSQLiteClient({
      schema: testSchema,
      filename: `test-errors-${Date.now()}.sqlite3`,
    });

    // Enable foreign key constraints
    await db.exec("PRAGMA foreign_keys = ON");

    // Create users table with unique constraint on email
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age INTEGER NOT NULL
      )
    `);

    // Create posts table with foreign key constraint
    await db.exec(`
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
  });

  afterEach(async () => {
    await db.close();
  });

  describe("ValidationError", () => {
    it("should throw ValidationError on schema validation failure", async () => {
      try {
        await db.insert("users").values({
          name: "ab", // Too short (min 3)
          email: "invalid-email", // Not a valid email
          age: 200, // Too large (max 150)
        });
        expect.fail("Should have thrown ValidationError");
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect(e).toBeInstanceOf(SQLiteError);

        const error = e as ValidationError;
        expect(error.message).toMatch(/validation/i);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.field).toBeDefined();
        expect(error.issues).toBeInstanceOf(Array);
        expect(error.issues.length).toBeGreaterThan(0);

        // Check that issues contain field paths
        const paths = error.issues.map((issue) => issue.path.join("."));
        expect(paths).toContain("name");
        expect(paths).toContain("email");
        expect(paths).toContain("age");
      }
    });

    it("should throw ValidationError on update with invalid data", async () => {
      await db.insert("users").values({
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      });

      try {
        await db.update("users")
          .where("name", "=", "John Doe")
          .set({
            email: "not-an-email", // Invalid email
          })
          .execute();
        expect.fail("Should have thrown ValidationError");
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);

        const error = e as ValidationError;
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ConstraintError", () => {
    it("should throw ConstraintError on UNIQUE constraint violation", async () => {
      await db.insert("users").values({
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      });

      try {
        await db.insert("users").values({
          name: "Jane Doe",
          email: "john@example.com", // Duplicate email
          age: 25,
        });
        expect.fail("Should have thrown ConstraintError");
      } catch (e) {
        expect(e).toBeInstanceOf(ConstraintError);
        expect(e).toBeInstanceOf(SQLiteError);

        const error = e as ConstraintError;
        expect(error.code).toBe("CONSTRAINT_ERROR");
        expect(error.constraint).toContain("UNIQUE");
        expect(error.message).toContain("email");
      }
    });

    it("should throw ConstraintError on FOREIGN KEY violation", async () => {
      try {
        await db.insert("posts").values({
          userId: 999, // Non-existent user
          title: "Test Post",
          content: "Content",
        });
        expect.fail("Should have thrown ConstraintError");
      } catch (e) {
        expect(e).toBeInstanceOf(ConstraintError);

        const error = e as ConstraintError;
        expect(error.code).toBe("CONSTRAINT_ERROR");
        expect(error.constraint).toContain("FOREIGN KEY");
      }
    });

    it("should throw ConstraintError on NOT NULL violation", async () => {
      try {
        await db.exec(`INSERT INTO users (name, email) VALUES ('John', 'john@example.com')`);
        expect.fail("Should have thrown ConstraintError");
      } catch (e) {
        expect(e).toBeInstanceOf(ConstraintError);

        const error = e as ConstraintError;
        expect(error.code).toBe("CONSTRAINT_ERROR");
        expect(error.constraint).toContain("NOT NULL");
      }
    });
  });

  describe("SQLiteError", () => {
    it("should throw SQLiteError on SQL syntax error", async () => {
      try {
        await db.exec("INVALID SQL SYNTAX");
        expect.fail("Should have thrown SQLiteError");
      } catch (e) {
        expect(e).toBeInstanceOf(SQLiteError);

        const error = e as SQLiteError;
        expect(error.code).toBe("SQL_ERROR");
        expect(error.sql).toBe("INVALID SQL SYNTAX");
        expect(error.message).toContain("syntax");
      }
    });

    it("should throw SQLiteError on non-existent table", async () => {
      try {
        await db.exec("SELECT * FROM non_existent_table");
        expect.fail("Should have thrown SQLiteError");
      } catch (e) {
        expect(e).toBeInstanceOf(SQLiteError);

        const error = e as SQLiteError;
        expect(error.code).toBe("SQL_ERROR");
        expect(error.sql).toContain("non_existent_table");
      }
    });
  });

  describe("Error properties", () => {
    it("should include SQL in error for exec()", async () => {
      try {
        await db.exec("SELECT * FROM invalid_table");
        expect.fail("Should have thrown");
      } catch (e) {
        const error = e as SQLiteError;
        expect(error.sql).toBe("SELECT * FROM invalid_table");
      }
    });

    it("should include helpful error messages", async () => {
      try {
        await db.insert("users").values({
          name: "Jo", // Too short
          email: "joe@example.com",
          age: 30,
        });
        expect.fail("Should have thrown");
      } catch (e) {
        const error = e as ValidationError;
        expect(error.message).toMatch(/validation|failed|invalid/i);
      }
    });
  });
});
