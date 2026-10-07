#!/usr/bin/env node
/** Updates a row of docs/ROADMAP.md:  node scripts/roadmap.mjs "<Area>" <status> "<notes>" */
import { readFileSync, writeFileSync } from "node:fs";

const [area, status, notes = ""] = process.argv.slice(2);
const file = new URL("../docs/ROADMAP.md", import.meta.url);
const lines = readFileSync(file, "utf8").split("\n");
const index = lines.findIndex((line) => line.startsWith(`| ${area} |`));
if (index === -1) {
  console.error(`Row not found: ${area}`);
  process.exit(1);
}
lines[index] = `| ${area} | ${status} | ${notes} |`;
writeFileSync(file, lines.join("\n"));
console.log(lines[index]);
