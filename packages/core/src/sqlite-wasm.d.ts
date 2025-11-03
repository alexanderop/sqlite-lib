/**
 * Type declarations for @sqlite.org/sqlite-wasm
 *
 * Provides TypeScript types for the official SQLite WASM library.
 * This library runs SQLite in a Web Worker using WebAssembly with
 * support for OPFS (Origin Private File System) persistence.
 */
declare module "@sqlite.org/sqlite-wasm" {
  /**
   * SQLite worker message types
   *
   * Defines the available operations that can be sent to the SQLite worker.
   */
  export type MessageType =
    /** Open a database connection */
    | "open"
    /** Execute SQL statement */
    | "exec"
    /** Close a database connection */
    | "close"
    /** Export database to file */
    | "export"
    /** Transaction control */
    | "transaction"
    /** Get configuration value */
    | "config-get";

  /**
   * Message sent to SQLite worker
   *
   * Represents a command to be executed by the SQLite worker thread.
   */
  export type Message = {
    /** Type of operation to perform */
    type: MessageType;
    /** Unique message identifier for matching responses */
    messageId?: string;
    /** Additional arguments for the operation */
    args?: Record<string, unknown>;
    /** Database identifier from open() response */
    dbId?: string;
    /** SQL statement to execute (for exec type) */
    sql?: string;
    /** Parameter values for SQL placeholders (?) */
    bind?: unknown[];
    /** What to return from exec: "resultRows" for SELECT queries */
    returnValue?: string;
    /** Database filename (for open type) */
    filename?: string;
  };

  /**
   * Response from SQLite worker
   *
   * Contains the result of a worker operation or error information.
   */
  export type Response = {
    /** Response type: "error" on failure, or the message type on success */
    type: string;
    /** Message ID matching the original request */
    messageId?: string;
    /** Database identifier */
    dbId?: string;
    /** Result data from the operation */
    result?: {
      /** Error message (if type is "error") */
      message?: string;
      /** Query result rows (when returnValue: "resultRows" and rowMode: "object") */
      resultRows?: Record<string, unknown>[];
      /** Database ID returned from open operation */
      dbId?: string;
    };
  };

  /**
   * Worker API function type
   *
   * Promise-based function for sending messages to the SQLite worker
   * and receiving responses.
   *
   * @param type - Type of operation to perform
   * @param args - Operation-specific arguments
   * @returns Promise resolving to the worker response
   */
  export type WorkerAPI = (
    type: MessageType,
    args?: Record<string, unknown>
  ) => Promise<Response>;

  /**
   * Create a promise-based SQLite worker instance
   *
   * Initializes a SQLite WebAssembly worker with promise-based communication.
   * The worker runs SQLite in a separate thread, keeping the main thread responsive.
   *
   * @param config - Configuration object
   * @param config.onready - Optional callback invoked when worker is ready
   * @returns Promise-based API for communicating with the SQLite worker
   *
   * @example
   * ```typescript
   * const promiser = await new Promise((resolve) => {
   *   const p = sqlite3Worker1Promiser({
   *     onready: () => resolve(p)
   *   });
   * });
   *
   * // Open database
   * const openResponse = await promiser("open", {
   *   filename: "mydb.sqlite3"
   * });
   * const dbId = openResponse.result?.dbId;
   *
   * // Execute query
   * const execResponse = await promiser("exec", {
   *   dbId,
   *   sql: "SELECT * FROM users",
   *   returnValue: "resultRows",
   *   rowMode: "object"
   * });
   * const rows = execResponse.result?.resultRows;
   * ```
   */
  export function sqlite3Worker1Promiser(config: {
    onready?: () => void;
  }): WorkerAPI;
}
