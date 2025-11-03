declare module "@sqlite.org/sqlite-wasm" {
  export type MessageType =
    | "open"
    | "exec"
    | "close"
    | "export"
    | "transaction"
    | "config-get";

  export type Message = {
    type: MessageType;
    messageId?: string;
    args?: Record<string, unknown>;
    dbId?: string;
    sql?: string;
    bind?: unknown[];
    returnValue?: string;
    filename?: string;
  };

  export type Response = {
    type: "error" | string;
    messageId?: string;
    dbId?: string;
    result?: {
      message?: string;
      resultRows?: Record<string, unknown>[];
      dbId?: string;
    };
  };

  export type WorkerAPI = (
    type: MessageType,
    args?: Record<string, unknown>
  ) => Promise<Response>;

  export function sqlite3Worker1Promiser(config: {
    onready?: () => void;
  }): WorkerAPI;
}
