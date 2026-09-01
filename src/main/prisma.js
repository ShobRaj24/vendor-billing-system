import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export function createPrismaClient(databasePath) {
  const adapter = new PrismaBetterSqlite3({
    url: `file:${databasePath.replaceAll("\\", "/")}`,
  });

  return new PrismaClient({
    adapter,
  });
}
