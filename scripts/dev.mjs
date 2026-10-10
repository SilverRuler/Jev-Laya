#!/usr/bin/env node
// 백엔드(uvicorn :8000) 와 프론트엔드(vite :5173) 를 함께 띄운다.
//   Ctrl+C 한 번으로 둘 다 정리한다.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  BACKEND_PORT,
  BACKEND_URL,
  FRONTEND_PORT,
  ROOT,
  SERVER,
  WEB,
  c,
  has,
  prefixLines,
  waitForHttp,
} from "./lib.mjs";

const children = [];
let shuttingDown = false;

function spawnChild(label, color, cmd, args, cwd, env) {
  const child = spawn(cmd, args, {
    cwd,
    env: { ...process.env, ...env, FORCE_COLOR: "1" },
    // POSIX 에서 자식(uv -> python, npm -> vite)까지 같은 그룹으로 만들어
    // 그룹째로 죽여 고아 프로세스를 남기지 않는다. Windows 는 taskkill 로 처리.
    detached: process.platform !== "win32",
    shell: process.platform === "win32",
  });
  prefixLines(child.stdout, label, color);
  prefixLines(child.stderr, label, color);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(color(`[${label}]`) + c.red(` 종료됨 (code=${code} signal=${signal ?? "-"})`));
    shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(c.dim("\n종료 중..."));
  for (const child of children) {
    if (child.pid === undefined || child.exitCode !== null) continue;
    try {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        process.kill(-child.pid, "SIGTERM");
      }
    } catch {
      /* 이미 죽었음 */
    }
  }
  setTimeout(() => {
    for (const child of children) {
      if (child.pid === undefined || child.exitCode !== null) continue;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        /* noop */
      }
    }
    process.exit(code);
  }, 1500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// ── 사전 점검 ────────────────────────────────────────────────────────────────
if (!has("uv")) {
  console.error(c.red("uv 를 찾지 못했습니다. 먼저 `npm run setup` 을 실행하세요."));
  process.exit(1);
}
if (!existsSync(join(SERVER, ".venv"))) {
  console.error(c.red("server/.venv 가 없습니다. 먼저 `npm run setup` 을 실행하세요."));
  process.exit(1);
}
if (!existsSync(join(ROOT, "node_modules"))) {
  console.error(c.red("node_modules 가 없습니다. 먼저 `npm run setup` 을 실행하세요."));
  process.exit(1);
}

const portBusy = await fetch(`http://127.0.0.1:${BACKEND_PORT}/healthz`, {
  signal: AbortSignal.timeout(1500),
})
  .then((r) => r.ok)
  .catch(() => false);
if (portBusy) {
  console.error(
    c.red(`${BACKEND_PORT} 포트에 이미 서버가 있습니다. `) +
      c.dim("멈추려면 그 프로세스를 종료하세요."),
  );
  process.exit(1);
}

// ── 백엔드 ───────────────────────────────────────────────────────────────────
console.log(c.bold(`\n백엔드 기동  ${c.dim(`uvicorn :${BACKEND_PORT}`)}`));
spawnChild("api", c.blue, "uv", ["run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(BACKEND_PORT)], SERVER);

console.log(c.dim("  체크포인트 로딩 중... 첫 기동은 몇 분 걸릴 수 있습니다."));
const ready = await waitForHttp(`${BACKEND_URL}/healthz`, { timeoutMs: 300_000 });
if (!ready) {
  console.error(c.red("\n백엔드가 5분 안에 준비되지 않았습니다. 위 [api] 로그를 확인하세요."));
  shutdown(1);
  process.exit(1);
}
console.log(c.green(`  준비 완료  ${BACKEND_URL}`));

// 백엔드만 띄우는 모드 (프론트 없이 API 만 필요할 때)
if (process.argv.includes("--server-only")) {
  console.log(c.dim("\n  Ctrl+C 로 종료"));
} else {
  // ── 프론트엔드 ─────────────────────────────────────────────────────────────
  console.log(c.bold(`\n프론트엔드 기동  ${c.dim(`vite :${FRONTEND_PORT}`)}\n`));
  spawnChild("web", c.magenta, "npm", ["run", "dev", "--", "--port", String(FRONTEND_PORT)], WEB);

  console.log(
    [
      "",
      c.green(c.bold("  준비 완료")),
      `    UI        ${c.blue(`http://localhost:${FRONTEND_PORT}`)}`,
      `    API       ${BACKEND_URL}/v1/systemone`,
      `    헬스체크  ${BACKEND_URL}/healthz`,
      "",
      c.dim("  Ctrl+C 로 둘 다 종료"),
      "",
    ].join("\n"),
  );
}