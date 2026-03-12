import { Command } from "commander";
import { configCommand } from "./commands/config.js";
import { tasksCommand } from "./commands/tasks.js";
import { logCommand } from "./commands/log.js";
import { hookCommand } from "./commands/hook.js";

const program = new Command();

program
  .name("opcli")
  .description("CLI tool for OpenProject task management")
  .version("0.1.0");

program.addCommand(configCommand);
program.addCommand(tasksCommand);
program.addCommand(logCommand);
program.addCommand(hookCommand);

program.parse();
