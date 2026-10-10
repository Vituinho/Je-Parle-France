import "dotenv/config";
import { db } from "../src/server/db";
import { pruneTelemetry } from "../src/server/services/telemetry-retention";
async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--apply"))
    throw new Error("Invalid arguments");
  const result = await pruneTelemetry({ apply: args[0] === "--apply" });
  console.log(JSON.stringify(result));
  if (result.more)
    console.log(
      "Batch limit reached. Repeat after reviewing the result; invalid legacy payloads are preserved.",
    );
}
void main()
  .catch(() => {
    console.error(
      "Telemetry pruning failed. Check database access and use no argument (dry run) or --apply. No private rows are printed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
