import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }, // descomentar en producción si usás Railway/Fly
});

export default pool;
