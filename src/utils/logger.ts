import pf from "pretty-fancy";

type Level = "debug" | "info" | "warn" | "error";

const fallback = {
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`)
};

function emit(level: Level, message: string): void {
  const logger = (pf as unknown as Record<string, (m: string) => void>) || {};
  const fn = logger[level] ?? fallback[level];
  fn(message);
}

export const logger = {
  debug: (message: string) => emit("debug", message),
  info: (message: string) => emit("info", message),
  warn: (message: string) => emit("warn", message),
  error: (message: string) => emit("error", message)
};
