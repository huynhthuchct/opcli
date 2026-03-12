import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../utils/git.js";

const HOOK_MARKER = "# opcli-post-commit-hook";

const HOOK_SCRIPT = `#!/bin/sh
${HOOK_MARKER}
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TASK_ID=$(echo "$BRANCH" | grep -oP '(?<=/op-)\\d+' 2>/dev/null || echo "$BRANCH" | sed -n 's/.*\\/op-\\([0-9]*\\).*/\\1/p')
if [ -n "$TASK_ID" ]; then
  exec < /dev/tty
  echo ""
  echo "\\033[1m[opcli] Log time for task #$TASK_ID\\033[0m"
  read -p "Hours (enter to skip): " HOURS
  if [ -n "$HOURS" ]; then
    SPENT_ON=$(date +%Y-%m-%d)
    COMMIT_MSG=$(git log -1 --format="%h %s")
    opcli tasks update "$TASK_ID" --log-time "$HOURS" --log-date "$SPENT_ON" --log-comment "$COMMIT_MSG"
  fi
fi
`;

export const hookCommand = new Command("hook");

hookCommand
  .command("install")
  .description("Install post-commit hook for auto time logging")
  .action(() => {
    const root = getRepoRoot();
    const hookDir = path.join(root, ".git", "hooks");
    const hookPath = path.join(hookDir, "post-commit");

    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, "utf-8");
      if (existing.includes(HOOK_MARKER)) {
        console.log(chalk.yellow("Hook already installed."));
        return;
      }
      // Append to existing hook
      fs.appendFileSync(hookPath, "\n" + HOOK_SCRIPT);
      console.log(chalk.green("Hook appended to existing post-commit."));
    } else {
      if (!fs.existsSync(hookDir)) fs.mkdirSync(hookDir, { recursive: true });
      fs.writeFileSync(hookPath, HOOK_SCRIPT);
      fs.chmodSync(hookPath, 0o755);
      console.log(chalk.green("Post-commit hook installed."));
    }
    console.log(`Location: ${chalk.gray(hookPath)}`);
  });

hookCommand
  .command("uninstall")
  .description("Remove opcli post-commit hook")
  .action(() => {
    const root = getRepoRoot();
    const hookPath = path.join(root, ".git", "hooks", "post-commit");

    if (!fs.existsSync(hookPath)) {
      console.log(chalk.gray("No post-commit hook found."));
      return;
    }

    const content = fs.readFileSync(hookPath, "utf-8");
    if (!content.includes(HOOK_MARKER)) {
      console.log(chalk.gray("No opcli hook found in post-commit."));
      return;
    }

    // Remove opcli section
    const lines = content.split("\n");
    const filtered: string[] = [];
    let skipping = false;
    for (const line of lines) {
      if (line.includes(HOOK_MARKER)) {
        skipping = true;
        continue;
      }
      if (skipping && line.startsWith("fi")) {
        skipping = false;
        continue;
      }
      if (!skipping) filtered.push(line);
    }

    const remaining = filtered.join("\n").trim();
    if (!remaining || remaining === "#!/bin/sh") {
      fs.unlinkSync(hookPath);
      console.log(chalk.green("Post-commit hook removed."));
    } else {
      fs.writeFileSync(hookPath, remaining + "\n");
      fs.chmodSync(hookPath, 0o755);
      console.log(chalk.green("opcli hook removed. Other hooks preserved."));
    }
  });
