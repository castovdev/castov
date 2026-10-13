"use client";

import { useState, useEffect, useRef } from "react";
import initSqlJs, { Database } from "sql.js";
import { PlayIcon, DatabaseIcon, PlusIcon, TableIcon, TrashIcon } from "lucide-react";

export function SqliteFiddleTool() {
  const [db, setDb] = useState<Database | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [query, setQuery] = useState("SELECT sqlite_version() AS version;");
  
  const [results, setResults] = useState<{ columns: string[], values: any[][] }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const initDB = async () => {
      try {
        // Fallback timeout to prevent infinite hang
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("WASM initialization timed out after 10 seconds. Check if /sql-wasm.wasm is serving the correct binary.")), 10000)
        );

        // A common issue in Next.js is the bundler packing the Node version of sql.js.
        // We ensure we give it the exact absolute URL to the WASM file.
        const wasmUrl = typeof window !== 'undefined' ? window.location.origin + '/sql-wasm.wasm' : '/sql-wasm.wasm';

        const sqlPromise = initSqlJs({
          locateFile: (file) => wasmUrl
        });

        const SQL: any = await Promise.race([sqlPromise, timeoutPromise]);
        
        if (active) {
          const newDb = new SQL.Database();
          setDb(newDb);
          setIsInitializing(false);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          console.error("SQLite WASM Error:", err);
          setError("Failed to load SQLite engine: " + (err.message || String(err)));
          setIsInitializing(false);
        }
      }
    };
    initDB();
    return () => { active = false; };
  }, []);

  const refreshTables = (database: Database) => {
    try {
      const res = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
      if (res.length > 0 && res[0].values) {
        setTables(res[0].values.map(r => r[0] as string));
      } else {
        setTables([]);
      }
    } catch {
      setTables([]);
    }
  };

  const runQuery = () => {
    if (!db) return;
    setError(null);
    setResults([]);
    try {
      const res = db.exec(query);
      setResults(res);
      refreshTables(db);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const executeDemo = (sql: string) => {
    setQuery(sql);
    if (!db) return;
    setError(null);
    try {
      db.run(sql);
      const res = db.exec("SELECT * FROM employees;"); // Assuming the demo created this
      setResults(res);
      refreshTables(db);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const DEMO_SQL = `CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary INTEGER
);

INSERT INTO employees (name, department, salary) VALUES
  ('Alice Smith', 'Engineering', 120000),
  ('Bob Johnson', 'Marketing', 95000),
  ('Charlie Brown', 'Engineering', 110000),
  ('Diana Prince', 'Management', 150000);
`;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-4">
          <div className="bg-card border border-line rounded-xl p-4 shadow-sm">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <DatabaseIcon size={18} className="text-primary" /> Database
            </h2>
            {isInitializing ? (
              <div className="text-sm text-muted animate-pulse">Loading WASM engine...</div>
            ) : error && !db ? (
              <div className="text-xs text-danger p-2 bg-danger/10 rounded border border-danger/20 mb-2">
                <strong>WASM Error:</strong> {error}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">Tables</span>
                  <span className="text-xs bg-field border border-line rounded px-1.5 py-0.5">{tables.length}</span>
                </div>
                {tables.length === 0 ? (
                  <div className="text-xs text-muted italic">No tables yet.</div>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {tables.map(t => (
                      <li key={t} className="flex items-center gap-2 text-sm text-fg p-1.5 hover:bg-muted/10 rounded cursor-pointer transition-colors" onClick={() => setQuery(`SELECT * FROM ${t} LIMIT 10;`)}>
                        <TableIcon size={14} className="text-accent" /> {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            <hr className="border-line my-4" />
            
            <button 
              onClick={() => executeDemo(DEMO_SQL)}
              className="w-full btn btn-secondary btn-sm mb-2"
              disabled={isInitializing}
            >
              <PlusIcon size={14} /> Load Demo Data
            </button>
            <button 
              onClick={() => { if(db) { db.close(); setDb(new (window as any).SQL.Database()); setTables([]); setResults([]); setQuery(""); } }}
              className="w-full btn btn-secondary btn-sm !bg-red-500/10 !text-red-500 hover:!bg-red-500/20"
              disabled={isInitializing}
            >
              <TrashIcon size={14} /> Reset Database
            </button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-muted/5 border-b border-line px-4 py-2 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">SQL Editor</span>
              <button 
                onClick={runQuery} 
                disabled={isInitializing}
                className="btn btn-primary btn-sm px-4"
              >
                <PlayIcon size={14} /> Run Query
              </button>
            </div>
            <textarea
              aria-label="SQL Query Editor"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-48 bg-field p-4 font-mono text-sm text-fg resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              spellCheck={false}
              placeholder="SELECT * FROM table_name;"
            />
            {error && (
              <div className="bg-red-500/10 border-t border-red-500/20 p-3 text-sm font-mono text-red-500">
                {error}
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-xl overflow-hidden shadow-sm min-h-[300px]">
            <div className="bg-muted/5 border-b border-line px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Results</span>
            </div>
            <div className="p-0 overflow-x-auto">
              {results.length === 0 && !error ? (
                <div className="p-8 text-center text-muted text-sm">No results to display.</div>
              ) : (
                results.map((res, i) => (
                  <table key={i} className="w-full text-left border-collapse">
                    <thead className="bg-muted/10 border-b border-line">
                      <tr>
                        {res.columns.map((col, j) => (
                          <th key={j} className="p-3 text-xs font-semibold text-muted tracking-wider">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {res.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-muted/5 transition-colors">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="p-3 text-sm font-mono text-fg max-w-[200px] truncate" title={String(val)}>{val !== null ? String(val) : <span className="text-muted/50 italic">NULL</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
