#!/usr/bin/env node
// 공용 경로/프로세스 유틸. web 과 server 를 동시에 다루기 위한 최소 헬퍼.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const WEB = join(ROOT, "web");
export const SERVER = join(ROOT, "server");

export const BACKEND_PORT = Number(process.env.JEV_BACKEND_PORT || 8000);
export const FRONTEND_PORT = Number(process.env.JEV_FRONTEND_PORT || 5173);
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

// uv 는 기본 설치 경로(~/.local/bin)가 셸 PATH 에 없을 수 있다.
const EXTRA_BIN = [join(homedir(), ".local", "bin"), "/usr/local/bin"];
export const PATH = [...EXTRA_BIN, process.env.PATH].filter(Boolean).join(":");

export const has = (bin) => {
  if (bin.includes("/")) return existsSync(bin);
  return PATH.split(":").some((dir) => dir && existsSync(join(dir, bin)));
};

// ANSI: 터미널이 아니면 비활성화
const tty = process.stdout.isTTY;
export const c = {
  dim: (s) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s),
  red: (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
  green: (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
  blue: (s) => (tty ? `\x1b[34m${s}\x1b[0m` : s),
  magenta: (s) => (tty ? `\x1b[35m${s}\x1b[0m` : s),
};

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitForHttp(url, { timeoutMs = 180_000, intervalMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch {
      /* 아직 안 뜸 */
    }
    await wait(intervalMs);
  }
  return false;
}

export const prefixLines = (stream, label, color) => {
  let carry = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    const text = carry + chunk;
    const lines = text.split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) {
      // 프로그레스 바(\r) 갱신은 같은 줄 덮어쓰기로 그대로 통과시킨다.
      if (line.includes("\r")) {
        process.stdout.write(line);
        continue;
      }
      process.stdout.write(`${color(`[${label}]`)} ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (carry) process.stdout.write(`${color(`[${label}]`)} ${carry}\n`);
  });
};