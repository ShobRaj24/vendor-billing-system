import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

export function createPrismaClient(databasePath) {
  const adapter = new PrismaBetterSqlite3({
    url: `file:${databasePath.replaceAll("\\", "/")}`,
  });

  return new PrismaClient({
    adapter,
  });
}
