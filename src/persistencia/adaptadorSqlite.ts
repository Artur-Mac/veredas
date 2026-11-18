/**
 * Interface agnóstica de driver SQLite para paridade total entre:
 * - React Native (`expo-sqlite` com FTS5, R*Tree e SQLCipher em produção offline);
 * - Node 22 / Jest (`node:sqlite` via `driverNodeSqlite.ts`).
 */

export type ParamSql = string | number | bigint | Uint8Array | null;

export type StatementSql = {
  run(...params: ParamSql[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  get(...params: ParamSql[]): Record<string, unknown> | undefined;
  all(...params: ParamSql[]): Record<string, unknown>[];
};

export type SqliteDriver = {
  exec(sql: string): void;
  prepare(sql: string): StatementSql;
  close(): void;
  readonly engine: "expo-sqlite" | "node:sqlite" | "custom";
};

export type ExpoSqliteSyncLike = {
  execSync(source: string): void;
  prepareSync(source: string): {
    executeSync(...params: ParamSql[]): {
      changes: number;
      lastInsertRowId: number;
      getFirstSync(): Record<string, unknown> | null;
      getAllSync(): Record<string, unknown>[];
    };
  };
  closeSync(): void;
};

export function criarDriverExpoSqlite(db: ExpoSqliteSyncLike): SqliteDriver {
  return {
    engine: "expo-sqlite",
    exec(sql: string) {
      db.execSync(sql);
    },
    prepare(sql: string): StatementSql {
      const stmt = db.prepareSync(sql);
      return {
        run(...params: ParamSql[]) {
          const res = stmt.executeSync(...params);
          return { changes: res.changes, lastInsertRowid: res.lastInsertRowId };
        },
        get(...params: ParamSql[]) {
          return stmt.executeSync(...params).getFirstSync() ?? undefined;
        },
        all(...params: ParamSql[]) {
          return stmt.executeSync(...params).getAllSync();
        },
      };
    },
    close() {
      db.closeSync();
    },
  };
}
