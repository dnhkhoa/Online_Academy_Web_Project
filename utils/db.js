import knex from "knex";

const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "aws-1-ap-southeast-1.pooler.supabase.com",
    port: Number(process.env.DB_PORT || 6543),
    user: process.env.DB_USER || "postgres.llkbsvszgnqzgeodatog",
    password: process.env.DB_PASSWORD || "BNX3LzSKGijvhNcG",
    database: process.env.DB_NAME || "postgres",
    ssl: { rejectUnauthorized: false },
  },
  pool: { min: 0, max: 7 },
});

export default db;
