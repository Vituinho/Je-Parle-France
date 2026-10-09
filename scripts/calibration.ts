import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { calibrationTemplate, compareCalibration } from "./calibration-kit";

async function main() {
  const [command, path] = process.argv.slice(2);
  if (command === "init") {
    await mkdir(".data/calibration", { recursive: true });
    await writeFile(
      ".data/calibration/records.json",
      JSON.stringify(calibrationTemplate(), null, 2) + "\n",
      { flag: "wx" },
    );
    console.log("Created .data/calibration/records.json with pending assessments. No API calls.");
    return;
  }
  if (command === "check" && path) {
    if ((await stat(path)).size > 1_000_000) throw new Error("Oversized input");
    console.log(
      JSON.stringify(compareCalibration(JSON.parse(await readFile(path, "utf8"))), null, 2),
    );
    return;
  }
  console.error("Usage: npm run calibration -- init | check <local-records.json>");
  process.exitCode = 1;
}
void main().catch(() => {
  // JSON parser/Zod errors can contain submitted text: never print their values or stacks.
  console.error(
    "Calibration file could not be created or validated. Check its local schema, size and permissions; init never overwrites an existing file. See docs/CALIBRATION.md.",
  );
  process.exitCode = 1;
});
