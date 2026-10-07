import "dotenv/config";

// Integration tests always run against the dedicated test database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-value-at-least-32-chars";
