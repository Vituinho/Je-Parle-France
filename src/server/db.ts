import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env";

export type Db = PrismaClient;

const globalForPrisma = globalThis as unknown as { __jpfPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: serverEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  globalForPrisma.__jpfPrisma ??= createClient();
  return globalForPrisma.__jpfPrisma;
}

/**
 * Lazily-initialised Prisma client. Created on first use so importing a module
 * that touches the database never requires DATABASE_URL at build time. The
 * instance is cached on globalThis to survive hot reloads in development.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
