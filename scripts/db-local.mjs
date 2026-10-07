#!/usr/bin/env node
/**
 * Project-local PostgreSQL cluster for development and integration tests.
 *
 * Uses the PostgreSQL binaries already installed on the machine (initdb, pg_ctl,
 * createdb) and keeps the data directory inside `.data/postgres`, so it never
 * touches a system-wide server or its credentials.
 *
 *   npm run db:local -- init     create the cluster + jpf_dev / jpf_test databases
 *   npm run db:local -- start    start the server (port 54329)
 *   npm run db:local -- stop     stop the server
 *   npm run db:local -- status   show server status
 *
 * Set PG_BIN to the directory containing the binaries if they are not on PATH.
 * Authentication is `trust` and the server only listens on localhost: this is a
 * development convenience and must never be used for production data.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const PORT = process.env.JPF_PG_PORT ?? "54329";
const USER = "jpf";
const DATABASES = ["jpf_dev", "jpf_test"];
const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, ".data", "postgres");
const logFile = path.join(root, ".data", "postgres.log");

function bin(name) {
  return process.env.PG_BIN ? path.join(process.env.PG_BIN, name) : name;
}

function run(name, args, { allowFailure = false } = {}) {
  const result = spawnSync(bin(name), args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (result.error) {
    console.error(`Could not run ${name}: ${result.error.message}. Set PG_BIN if needed.`);
    process.exit(1);
  }
  if (result.status !== 0 && !allowFailure) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result;
}

function isRunning() {
  return run("pg_ctl", ["-D", dataDir, "status"], { allowFailure: true }).status === 0;
}

function start() {
  if (!existsSync(dataDir)) {
    console.error("Cluster not initialised. Run: npm run db:local -- init");
    process.exit(1);
  }
  if (isRunning()) {
    console.log(`PostgreSQL already running on localhost:${PORT}`);
    return;
  }
  run("pg_ctl", [
    "-D",
    dataDir,
    "-l",
    logFile,
    "-w",
    "-o",
    `-p ${PORT} -c listen_addresses=localhost`,
    "start",
  ]);
  console.log(`PostgreSQL started on localhost:${PORT}`);
}

function init() {
  if (existsSync(dataDir)) {
    console.log("Cluster already exists at .data/postgres");
  } else {
    mkdirSync(path.dirname(dataDir), { recursive: true });
    run("initdb", ["-D", dataDir, "-U", USER, "--auth=trust", "--encoding=UTF8", "--locale=C"]);
    console.log("Cluster initialised at .data/postgres");
  }
  start();
  for (const db of DATABASES) {
    const created = run("createdb", ["-h", "localhost", "-p", PORT, "-U", USER, db], {
      allowFailure: true,
    });
    console.log(created.status === 0 ? `Created database ${db}` : `Database ${db} already exists`);
  }
  console.log(`\nDATABASE_URL=postgresql://${USER}@localhost:${PORT}/jpf_dev`);
}

const command = process.argv[2] ?? "status";
switch (command) {
  case "init":
    init();
    break;
  case "start":
    start();
    break;
  case "stop":
    if (isRunning()) run("pg_ctl", ["-D", dataDir, "-w", "stop"]);
    console.log("PostgreSQL stopped");
    break;
  case "status":
    console.log(isRunning() ? `Running on localhost:${PORT}` : "Not running");
    break;
  default:
    console.error(`Unknown command "${command}". Use init | start | stop | status.`);
    process.exit(1);
}
