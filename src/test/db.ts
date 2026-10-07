import { db } from "@/server/db";

export const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);

/** Removes all rows from every application table (keeps migrations). */
export async function resetDatabase() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;

export async function createTestUser(overrides: { email?: string; name?: string } = {}) {
  counter += 1;
  const id = `test-user-${Date.now()}-${counter}`;
  return db.user.create({
    data: {
      id,
      name: overrides.name ?? "Victor Teste",
      email: overrides.email ?? `${id}@example.test`,
    },
  });
}
