/** Mise à niveau non destructive d'une base existante : `npm run db:upgrade` */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { applyDefaults } from "./defaults";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });

applyDefaults(db)
  .then(() => console.log("Mise à niveau terminée (pages légales, FAQ, identité par défaut)."))
  .finally(() => db.$disconnect());
