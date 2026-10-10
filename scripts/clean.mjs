#!/usr/bin/env node
// 생성물 정리: node_modules, .venv, web/dist, __pycache__
import { rmSync } from "node:fs";
import { join } from "node:path";

import { ROOT, SERVER, WEB, c } from "./lib.mjs";

const targets = [
  ["node_modules (npm)", join(ROOT, "node_modules")],
  ["web/node_modules", join(WEB, "node_modules")],
  ["server/.venv", join(SERVER, ".venv")],
  ["web/dist", join(WEB, "dist")],
  ["server/__pycache__", join(SERVER, "__pycache__")],
];

for (const [label, path] of targets) {
  rmSync(path, { recursive: true, force: true });
  console.log(`  ${c.dim("rm")} ${label}`);
}
console.log(c.green("\n정리 완료. 다시 쓰려면 `npm run setup` 을 실행하세요."));