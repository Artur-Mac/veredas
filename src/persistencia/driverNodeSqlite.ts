import { DatabaseSync } from "node:sqlite";
import type { ParamSql, SqliteDriver, StatementSql } from "./adaptadorSqlite";

/**
 * Adaptador Node 22 / Jest (`node:sqlite`, SQLite 3.51 com `ENABLE_RTREE` e `ENABLE_FTS5`).
 * Utilizado exclusivamente em scripts Node e testes automatizados; nunca importado pelo bundle mobile.
 */
export function abrirDriverNodeSqlite(caminhoArquivo = ":memory:", readOnly = false): SqliteDriver {
  const db = new DatabaseSync(caminhoArquivo, { readOnly });
  return {
    engine: "node:sqlite",
    exec(sql: string) {
      db.exec(sql);
    },
    prepare(sql: string): StatementSql {
      const stmt = db.prepare(sql);
      return {
        run(...params: ParamSql[]) {
          const r = stmt.run(...params);
          return { changes: r.changes, lastInsertRowid: r.lastInsertRowid };
        },
        get(...params: ParamSql[]) {
          return stmt.get(...params) as Record<string, unknown> | undefined;
        },
        all(...params: ParamSql[]) {
          return stmt.all(...params) as Record<string, unknown>[];
        },
      };
    },
    close() {
      db.close();
    },
  };
}
