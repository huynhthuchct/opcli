import { describe, it, expect } from "vitest";
import { formatTasksTable } from "../../src/commands/tasks.js";

describe("formatTasksTable", () => {
  it("formats work packages as a table string", () => {
    const tasks = [
      { id: 1234, subject: "Fix login bug", status: "In Progress", priority: "High", assignee: "thuchuynh", lockVersion: 1, createdAt: "2026-03-10T10:00:00Z", updatedAt: "2026-03-12T10:00:00Z" },
      { id: 1235, subject: "Add dashboard", status: "New", priority: "Normal", assignee: "Unassigned", lockVersion: 2, createdAt: "2026-03-09T10:00:00Z", updatedAt: "2026-03-11T10:00:00Z" },
    ];
    const output = formatTasksTable(tasks);
    expect(output).toContain("1234");
    expect(output).toContain("Fix login bug");
    expect(output).toContain("In Progress");
    expect(output).toContain("High");
  });
});
