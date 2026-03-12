import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface OpcliConfig {
  url: string;
  username: string;
  password: string;
}

interface StoredConfig {
  url: string;
  username: string;
  password: string;
}

export function getConfigPath(): string {
  return path.join(os.homedir(), ".opcli", "config.json");
}

export function loadConfig(): OpcliConfig | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const raw: StoredConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return {
    url: raw.url,
    username: raw.username,
    password: Buffer.from(raw.password, "base64").toString("utf-8"),
  };
}

export function saveConfig(config: OpcliConfig): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const stored: StoredConfig = {
    url: config.url,
    username: config.username,
    password: Buffer.from(config.password).toString("base64"),
  };
  fs.writeFileSync(configPath, JSON.stringify(stored, null, 2));
}
