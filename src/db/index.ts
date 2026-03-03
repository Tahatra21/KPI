import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For query purposes (max 10 connections in pool)
const queryClient = postgres(connectionString, { max: 10 });

export const db = drizzle(queryClient, { schema });
