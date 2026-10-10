import "dotenv/config";
import { db } from "../src/server/db";
import { pruneTelemetry } from "../src/server/services/telemetry-retention";
async function main() {
  const args = process.argv.slice(2);
  const apply = args[0] === "--apply";
  if (apply) args.shift();
  const maxBatches =
    args.length === 0
      ? 20
      : args.length === 2 && args[0] === "--max-batches" && /^(?:[1-9]|1[0-9]|20)$/.test(args[1]!)
        ? Number(args[1])
        : null;
  if (maxBatches === null) throw new Error("Invalid arguments");
  const result = await pruneTelemetry({ apply, maxBatches });
  console.log(JSON.stringify(result));
  if (result.more)
    console.log(
      "Batch limit reached. Review backlog; invalid legacy payloads are preserved. No private rows are printed.",
    );
}
void main()
  .catch(() => {
    console.error(
      "Telemetry pruning failed. Check database access; use no argument (dry run), optional --apply then --max-batches 1..20. No private rows are printed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
