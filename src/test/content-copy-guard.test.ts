import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "../..");
const sourceRoots = [
  path.join(repoRoot, "src", "pages"),
  path.join(repoRoot, "src", "components"),
];

const blockedPatterns = [
  /\.claude\/tasks\/tasks\.md/,
  /Phase \d+/,
  /later phases/i,
  /active repo/i,
];

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectFiles(fullPath);
    }

    return fullPath.endsWith(".tsx") ? [fullPath] : [];
  });

describe("app-facing copy guard", () => {
  it("does not leak internal planning language into rendered routes and sections", () => {
    const files = sourceRoots.flatMap(collectFiles);
    const matches = files.flatMap((filePath) => {
      const content = readFileSync(filePath, "utf-8");
      const hit = blockedPatterns.find((pattern) => pattern.test(content));

      return hit ? [`${path.relative(repoRoot, filePath)} matched ${hit}`] : [];
    });

    expect(matches).toEqual([]);
  });
});
