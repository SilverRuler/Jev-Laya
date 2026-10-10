#!/usr/bin/env node
// 최초 1회 설치: 프론트엔드(근로 npm) 의존성 + 백엔드(uv) 의존성 + .env 생성.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { BACKEND_URL, ROOT, SERVER, WEB, c, has } from "./lib.mjs";

const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(c.red(`\n실패: ${cmd} ${args.join(" ")}`));
    process.exit(r.status ?? 1);
  }
};

console.log(c.bold("\n1/3  프론트엔드 의존성 (npm)"));
if (!has("npm")) {
  console.error(c.red("  npm 이 없습니다. Node.js 20.19+ / 22.12+ 를 설치하세요."));
  process.exit(1);
}
// lockfile 이 있으면 재현 설치(ci), 없으면 최초 1회 생성(install).
const lock = join(ROOT, "package-lock.json");
if (existsSync(lock)) {
  run("npm", ["ci"], ROOT);
} else {
  console.log(c.dim("  package-lock.json 이 없어 npm install 로 생성합니다."));
  run("npm", ["install"], ROOT);
}

console.log(c.bold("\n2/3  백엔드 의존성 (uv)"));
if (!has("uv")) {
  console.log(c.yellow("  uv 를 찾지 못했습니다. 설치합니다..."));
  const install = spawnSync("bash", ["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"], {
    stdio: "inherit",
  });
  if (install.status !== 0) {
    console.error(c.red("  uv 설치 실패. https://docs.astral.sh/uv/getting-started/installation/ 를 참고하세요."));
    process.exit(1);
  }
}
run("uv", ["sync"], SERVER);

console.log(c.bold("\n3/3  백엔드 설정"));
const envFile = join(SERVER, ".env");
if (existsSync(envFile)) {
  console.log("  .env 이미 있음 — 건너뜁니다.");
} else {
  copyFileSync(join(SERVER, ".env.example"), envFile);
  console.log("  .env.example -> .env 생성");
}

console.log(c.green(c.bold("\n설치 완료.")));
console.log(`\n  시작:   ${c.bold("npm run dev")}`);
console.log(`  UI:     ${c.blue("http://localhost:5173")}`);
console.log(`  API:    ${BACKEND_URL}/v1/systemone`);
console.log(`  헬스체크: ${BACKEND_URL}/healthz`);
console.log(`\n  ${c.dim(`(웹 전용 실행: cd ${WEB.replace(process.env.HOME, "~")} && npm run dev)`)}\n`);