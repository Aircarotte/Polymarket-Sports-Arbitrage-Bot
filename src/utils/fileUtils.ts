import fs from "node:fs";
import path from "node:path";

export function ensureDir(fileOrDirPath: string): void {
  const dir = fileOrDirPath.endsWith(".json") || fileOrDirPath.endsWith(".csv") || fileOrDirPath.endsWith(".jsonl")
    ? path.dirname(fileOrDirPath)
    : fileOrDirPath;
  fs.mkdirSync(dir, { recursive: true });
}

export function loadJson<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function saveJson(data: unknown, filePath: string): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function appendJsonl(data: unknown, filePath: string): void {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, "utf8");
}

export function saveCsv(rows: Record<string, unknown>[], filePath: string): void {
  ensureDir(filePath);
  if (!rows.length) {
    fs.writeFileSync(filePath, "", "utf8");
    return;
  }
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const escapeCell = (v: unknown): string => {
    const s = typeof v === "string" ? v : JSON.stringify(v ?? "");
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, "\"\"")}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h] ?? "")).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}
