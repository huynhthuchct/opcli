import { Command } from "commander";
import { saveConfig } from "../config/store.js";
import { OpenProjectClient } from "../api/openproject.js";
import { promptCredentials } from "../utils/prompts.js";

export const configCommand = new Command("config");

configCommand
  .command("setup")
  .description("Configure OpenProject credentials")
  .action(async () => {
    const url = "https://devtak.cbidigital.com";
    console.log(`Configuring connection to ${url}\n`);

    const { username, password } = await promptCredentials();

    console.log("\nLogging in...");

    try {
      const session = await OpenProjectClient.login(url, username, password);
      const client = new OpenProjectClient({ url, username, password, session });
      const user = await client.getMe();
      console.log(`Authenticated as ${user.firstName} ${user.lastName} (${user.login})`);
      saveConfig({ url, username, password, session });
      console.log("Configuration saved.");
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
