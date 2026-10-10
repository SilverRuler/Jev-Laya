#!/usr/bin/env node
// 백엔드 단독 래퍼: node scripts/server.mjs <check|run|sync>
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

import { BACKEND_PORT, SERVER, c, has } from "./lib.mjs";

const [, , command = "run", ...rest] = process.argv;

if (!has("uv")) {
  console.error(c.red("uv 를 찾지 못했습니다. https://docs.astral.sh/uv/ 설치 후 다시 시도하세요."));
  process.exit(1);
}

const COMMANDS = {
  sync: { args: ["sync"], desc: "의존성 설치" },
  check: { args: ["run", "ruff", "check", "."], desc: "정적 검사 (ruff)" },
  format: { args: ["run", "ruff", "check", "--fix", "."], desc: "자동 수정 (ruff --fix)" },
  run: { args: ["run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(BACKEND_PORT)], desc: "서버 기동" },
  reload: { args: ["run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(BACKEND_PORT), "--reload"], desc: "서버 기동 (자동 재시작)" },
};

const chosen = COMMANDS[command];
if (!chosen) {
  console.error(c.red(`알 수 없는 명령: ${command}`));
  console.error(`사용 가능: ${Object.keys(COMMANDS).join(", ")}`);
  process.exit(1);
}

if (command !== "sync" && !existsSync(`${SERVER}/.venv`)) {
  console.error(c.red("server/.venv 가 없습니다. 먼저 `npm run setup` 을 실행하세요."));
  process.exit(1);
}

console.log(c.dim(`${chosen.desc} (uv ${chosen.args.join(" ")})${rest.length ? ` ${rest.join(" ")}` : ""}`));
const result = spawnSync("uv", [...chosen.args, ...rest], { cwd: SERVER, stdio: "inherit" });
process.exit(result.status ?? 1);