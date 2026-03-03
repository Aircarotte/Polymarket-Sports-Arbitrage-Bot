import path from "node:path";
import { appendJsonl, ensureDir, loadJson, saveJson } from "../utils/fileUtils.js";

export class TradeJournal {
  constructor(private readonly dir: string) {
    ensureDir(dir);
  }

  signal(row: Record<string, any>): void { appendJsonl(row, path.join(this.dir, "signals.jsonl")); }
  risk(row: Record<string, any>): void { appendJsonl(row, path.join(this.dir, "risk_events.jsonl")); }
  order(row: Record<string, any>): void { appendJsonl(row, path.join(this.dir, "orders.jsonl")); }
  fill(row: Record<string, any>): void { appendJsonl(row, path.join(this.dir, "fills.jsonl")); }
  position(row: Record<string, any>): void { appendJsonl(row, path.join(this.dir, "positions.jsonl")); }

  loadState(): Record<string, any> {
    try {
      return loadJson<Record<string, any>>(path.join(this.dir, "state.json"));
    } catch {
      return { open_positions: [] };
    }
  }

  saveState(state: Record<string, any>): void {
    saveJson(state, path.join(this.dir, "state.json"));
  }
}
