import { Command } from "commander";
import { loadConfig } from "../config/store.js";
import { OpenProjectClient } from "../api/openproject.js";
import type { WorkPackage, Status } from "../api/openproject.js";
import {
  promptSelectTask,
  promptSelectStatus,
  promptConfirmUpdate,
} from "../utils/prompts.js";

function requireConfig() {
  const config = loadConfig();
  if (!config) {
    console.error("No configuration found. Run 'opcli config setup' first.");
    process.exit(1);
  }
  return config;
}

export function formatTasksTable(tasks: WorkPackage[]): string {
  const header = "ID\t| Status\t\t| Priority\t| Subject";
  const separator = "-".repeat(80);
  const rows = tasks.map(
    (t) => `${t.id}\t| ${t.status}\t\t| ${t.priority}\t\t| ${t.subject}`
  );
  return [header, separator, ...rows].join("\n");
}

export const tasksCommand = new Command("tasks");

tasksCommand
  .command("list")
  .description("List work packages assigned to you")
  .action(async () => {
    const config = requireConfig();
    const client = new OpenProjectClient(config);

    try {
      const tasks = await client.listMyWorkPackages();
      if (tasks.length === 0) {
        console.log("No tasks assigned to you.");
        return;
      }
      console.log(formatTasksTable(tasks));
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

tasksCommand
  .command("update [id]")
  .description("Update the status of a work package")
  .option("-s, --status <status>", "New status name")
  .action(async (id: string | undefined, options: { status?: string }) => {
    const config = requireConfig();
    const client = new OpenProjectClient(config);

    try {
      let task: WorkPackage;

      if (!id) {
        const tasks = await client.listMyWorkPackages();
        if (tasks.length === 0) {
          console.log("No tasks assigned to you.");
          return;
        }
        task = await promptSelectTask(tasks);
      } else {
        task = await client.getWorkPackage(Number(id));
      }

      const availableStatuses = await client.getAvailableStatuses(task.id);
      if (availableStatuses.length === 0) {
        console.log("No status transitions available for this task.");
        return;
      }

      let targetStatus: Status;

      if (options.status) {
        const match = availableStatuses.find(
          (s) => s.name.toLowerCase() === options.status!.toLowerCase()
        );
        if (!match) {
          console.error(`Status "${options.status}" is not available.`);
          console.error("Available statuses: " + availableStatuses.map((s) => s.name).join(", "));
          process.exit(1);
        }
        targetStatus = match;
      } else {
        targetStatus = await promptSelectStatus(availableStatuses);
      }

      const confirmed = await promptConfirmUpdate(task, targetStatus);
      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }

      await client.updateWorkPackageStatus(task.id, task.lockVersion, targetStatus.href);
      console.log(`Updated #${task.id} → ${targetStatus.name}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
