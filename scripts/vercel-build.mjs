import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function runStep(label, command, args, cwd) {
  process.stdout.write(`${label}\n`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runStep(
  "Building job portal…",
  "pnpm",
  ["run", "build"],
  path.join(root, "artifacts/job-portal"),
);
runStep(
  "Building API bundle…",
  process.execPath,
  [path.join(root, "artifacts/api-server/build-vercel.mjs")],
  root,
);
process.stdout.write("Vercel build finished successfully.\n");
