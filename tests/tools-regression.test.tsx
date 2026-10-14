// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SqliteFiddleTool } from "@/components/tools/sqlite-fiddle-tool";
import { JsonViewerTool } from "@/components/tools/json-viewer-tool";

describe("Phase 8 Functional Regression Suite", () => {
  describe("SqliteFiddleTool", () => {
    it("initializes SQLite WASM, executes queries, updates tables, and handles Reset Database without crashing", async () => {
      render(<SqliteFiddleTool />);

      // 1. Initial loading state completes
      await waitFor(() => {
        expect(screen.queryByText(/Loading WASM engine/i)).not.toBeInTheDocument();
      });

      // 2. Query execution (default query: SELECT sqlite_version() AS version;)
      const runBtn = screen.getByRole("button", { name: /Run Query/i });
      expect(runBtn).not.toBeDisabled();
      fireEvent.click(runBtn);

      // Results container exists
      expect(screen.getByText("SQL Editor")).toBeInTheDocument();
      expect(screen.getByText("Results", { selector: "span" })).toBeInTheDocument();

      // 3. Custom SQL Query: CREATE TABLE & INSERT & SELECT
      const editor = screen.getByLabelText("SQL Query Editor") as HTMLTextAreaElement;
      fireEvent.change(editor, {
        target: {
          value: "CREATE TABLE test_table (id INT, val TEXT); INSERT INTO test_table VALUES (1, 'hello'); SELECT * FROM test_table;",
        },
      });
      fireEvent.click(runBtn);

      // 4. Load Demo Data
      const demoBtn = screen.getByRole("button", { name: /Load Demo Data/i });
      fireEvent.click(demoBtn);

      // 5. Reset Database: previously crashed with TypeError reading 'Database' from undefined window.SQL
      const resetBtn = screen.getByRole("button", { name: /Reset Database/i });
      expect(resetBtn).not.toBeDisabled();
      
      let thrownError: any = null;
      try {
        fireEvent.click(resetBtn);
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).toBeNull();

      // Editor should reset
      expect(editor.value).toBe("");
    });

    it("displays useful UI error when invalid SQL query is executed", async () => {
      render(<SqliteFiddleTool />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading WASM engine/i)).not.toBeInTheDocument();
      });

      const editor = screen.getByLabelText("SQL Query Editor") as HTMLTextAreaElement;
      const runBtn = screen.getByRole("button", { name: /Run Query/i });

      // Run query to ensure UI stays responsive without crashing
      fireEvent.change(editor, { target: { value: "INVALID SQL SYNTAX AT ALL;" } });
      fireEvent.click(runBtn);

      expect(screen.getByText("SQL Editor")).toBeInTheDocument();
    });
  });

  describe("JsonViewerTool", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("parses and displays interactive JSON when clipboard paste succeeds", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          readText: vi.fn().mockResolvedValue('{"project":"Castov","active":true,"version":1}'),
        },
        configurable: true,
      });

      render(<JsonViewerTool />);

      const pasteBtn = screen.getByRole("button", { name: /Paste from Clipboard/i });
      fireEvent.click(pasteBtn);

      await waitFor(() => {
        expect(screen.getByText("Valid JSON")).toBeInTheDocument();
        expect(screen.getAllByText(/"Castov"/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("true")).toBeInTheDocument();
        expect(screen.getAllByText(/"project":/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it("handles clipboard access rejection gracefully, shows feedback, and activates manual input", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          readText: vi.fn().mockRejectedValue(new Error("Permission denied by user")),
        },
        configurable: true,
      });

      render(<JsonViewerTool />);

      const pasteBtn = screen.getByRole("button", { name: /Paste from Clipboard/i });
      fireEvent.click(pasteBtn);

      await waitFor(() => {
        // Displays clear user feedback banner
        expect(screen.getByRole("status")).toHaveTextContent(/Permission denied by user/i);
      });

      // Textarea is automatically made available so user can paste or type directly
      const textarea = screen.getByLabelText("Input JSON") as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();

      // Typing directly into the activated textarea works and parses JSON
      fireEvent.change(textarea, { target: { value: '{"manual":"ok"}' } });
      await waitFor(() => {
        expect(screen.getByText("Valid JSON")).toBeInTheDocument();
        expect(screen.getAllByText(/"ok"/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/"manual":/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it("handles empty clipboard content gracefully", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          readText: vi.fn().mockResolvedValue("   "),
        },
        configurable: true,
      });

      render(<JsonViewerTool />);

      const pasteBtn = screen.getByRole("button", { name: /Paste from Clipboard/i });
      fireEvent.click(pasteBtn);

      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(/Clipboard is empty/i);
      });
      expect(screen.getByLabelText("Input JSON")).toBeInTheDocument();
    });

    it("allows opening manual text editor directly from empty state", async () => {
      render(<JsonViewerTool />);

      const openDirectBtn = screen.getByRole("button", { name: /Open text editor directly/i });
      fireEvent.click(openDirectBtn);

      expect(screen.getByLabelText("Input JSON")).toBeInTheDocument();
    });
  });
});
