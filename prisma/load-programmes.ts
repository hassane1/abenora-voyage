/** `npm run db:programmes` : charge / met à jour les programmes sans toucher au reste */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { applyProgrammes } from "./programmes";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
applyProgrammes(db).finally(() => db.$disconnect());
