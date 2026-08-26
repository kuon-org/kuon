import prisma from "../prisma/client.js";

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_RETRY_DELAY_MS = 3000;

const readPositiveInteger = (
  value: string | undefined,
  fallback: number,
  envName: string,
) => {
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(
      `⚠️ ${envName} must be a positive integer. Falling back to ${fallback}.`,
    );
    return fallback;
  }

  return parsed;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getErrorCode = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
};

export const connectDatabaseWithRetry = async () => {
  const maxAttempts = readPositiveInteger(
    process.env.DB_CONNECT_MAX_ATTEMPTS,
    DEFAULT_MAX_ATTEMPTS,
    "DB_CONNECT_MAX_ATTEMPTS",
  );
  const retryDelayMs = readPositiveInteger(
    process.env.DB_CONNECT_RETRY_DELAY_MS,
    DEFAULT_RETRY_DELAY_MS,
    "DB_CONNECT_RETRY_DELAY_MS",
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`🔌 Connecting to database (${attempt}/${maxAttempts})...`);

      // With Prisma driver adapters, $connect() alone does not necessarily prove
      // that the database can actually execute a query. Use a lightweight query
      // as the readiness check so migration starts only after PostgreSQL is usable.
      await prisma.$queryRaw`SELECT 1`;

      console.log("✅ Database connection established");
      return;
    } catch (error) {
      const errorCode = getErrorCode(error);
      const suffix = errorCode ? ` (code: ${errorCode})` : "";

      console.error(
        `❌ Database connection failed (${attempt}/${maxAttempts})${suffix}`,
      );

      if (attempt === maxAttempts) {
        console.error(
          `❌ Database connection could not be established after ${maxAttempts} attempt(s). Server startup aborted.`,
        );
        throw new Error(
          `Database connection failed after ${maxAttempts} attempt(s)`,
          { cause: error },
        );
      }

      console.log(`⏳ Retrying database connection in ${retryDelayMs}ms...`);
      await sleep(retryDelayMs);
    }
  }
};
