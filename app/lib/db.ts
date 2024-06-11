import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/app/lib/drizzle/schema";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DB_URL as string,
});

export const db = drizzle(pool, { schema });
