import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../config/store.js";
import { OpenProjectClient } from "../api/openproject.js";
import type { TimeEntry } from "../api/openproject.js";

function requireConfig() {
  const config = loadConfig();
  if (!config) {
    console.error("No configuration found. Run 'opcli config setup' first.");
    process.exit(1);
  }
  return config;
}

function colorHours(hours: number): string {
  const str = hours.toFixed(1) + "h";
  if (hours <= 4) return chalk.red(str);
  if (hours < 7) return chalk.yellow(str);
  return chalk.green(str);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

export const statsCommand = new Command("stats");

statsCommand
  .description("Show time logging statistics")
  .option("-m, --month <month>", "Month (1-12, default: current)")
  .option("-y, --year <year>", "Year (default: current)")
  .action(async (options: { month?: string; year?: string }) => {
    const config = requireConfig();
    const client = new OpenProjectClient(config);

    try {
      const now = new Date();
      const month = parseInt(options.month || String(now.getMonth() + 1), 10);
      const year = parseInt(options.year || String(now.getFullYear()), 10);
      const daysInMonth = getDaysInMonth(year, month);
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const to = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      const entries = await client.getTimeEntries(from, to);

      const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      console.log(chalk.bold(`\nTime Stats — ${monthName}\n`));

      // Group by date
      const byDate = new Map<string, TimeEntry[]>();
      for (const e of entries) {
        const list = byDate.get(e.spentOn) || [];
        list.push(e);
        byDate.set(e.spentOn, list);
      }

      const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));
      let totalHours = 0;
      let workDays = 0;
      let loggedDays = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayName = getDayName(dateStr);
        const weekend = isWeekend(dateStr);

        if (!weekend) workDays++;

        const dayEntries = byDate.get(dateStr) || [];
        const dayTotal = dayEntries.reduce((sum, e) => sum + e.hours, 0);

        if (dayTotal > 0) {
          loggedDays++;
          totalHours += dayTotal;
        }

        // Date label
        const dateLabel = weekend ? chalk.gray(`${dateStr} ${dayName}`) : `${dateStr} ${chalk.gray(dayName)}`;

        if (dayTotal === 0) {
          if (weekend) {
            console.log(`  ${dateLabel}  ${chalk.gray("—")}`);
          } else {
            // Only show as missing if date is in the past
            const today = now.toISOString().substring(0, 10);
            if (dateStr <= today) {
              console.log(`  ${dateLabel}  ${chalk.red("0.0h")}`);
            } else {
              console.log(`  ${dateLabel}  ${chalk.gray("—")}`);
            }
          }
        } else {
          console.log(`  ${dateLabel}  ${colorHours(dayTotal)}`);
          dayEntries.forEach((e) => {
            const taskLabel = chalk.gray(`#${e.workPackageId}`);
            const title = e.workPackageTitle.length > 50
              ? e.workPackageTitle.substring(0, 49) + "…"
              : e.workPackageTitle;
            console.log(`    ${taskLabel} ${pad(e.hours.toFixed(1) + "h", 6)} ${title}`);
          });
        }
      }

      // Summary
      const avgHours = loggedDays > 0 ? totalHours / loggedDays : 0;
      console.log(chalk.bold(`\n  Total:   ${colorHours(totalHours)} in ${loggedDays} days`));
      console.log(chalk.bold(`  Average: ${colorHours(avgHours)} / day`));
      console.log(chalk.gray(`  Work days: ${workDays} | Logged: ${loggedDays} | Missing: ${workDays - loggedDays}\n`));
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
