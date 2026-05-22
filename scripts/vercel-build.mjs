import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function runStep(label, command, args, cwd) {
  process.stdout.write(`${label}\n`);
  const useShell = process.platform === "win32";
  const commandString = useShell
    ? [command, ...args]
        .map((part) => (/\s/.test(part) ? `"${part}"` : part))
        .join(" ")
    : command;
  const result = spawnSync(commandString, useShell ? [] : args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
    shell: useShell,
  });
  if (result.status !== 0 || result.error) {
    if (result.error) {
      console.error("Build runner error:", result.error);
    }
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
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
