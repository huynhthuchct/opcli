import { describe, it, expect } from "vitest";
import { formatTasksTable } from "../../src/commands/tasks.js";

describe("formatTasksTable", () => {
  it("formats work packages as a table string", () => {
    const tasks = [
      { id: 1234, subject: "Fix login bug", status: "In Progress", priority: "High", lockVersion: 1 },
      { id: 1235, subject: "Add dashboard", status: "New", priority: "Normal", lockVersion: 2 },
    ];
    const output = formatTasksTable(tasks);
    expect(output).toContain("1234");
    expect(output).toContain("Fix login bug");
    expect(output).toContain("In Progress");
    expect(output).toContain("High");
  });
});
