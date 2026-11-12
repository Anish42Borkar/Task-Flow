const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'root',
  database: 'taskflow',
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "refresh_tokens" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "token_hash" varchar(255) NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "is_revoked" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "user_agent" varchar(255)
    );
    CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_hash" ON "refresh_tokens" ("token_hash");
    CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id");
  `);

  console.log('✅ Successfully created refresh_tokens table and indexes!');
  const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  console.log('Tables in database:', res.rows.map(r => r.table_name));
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  pool.end();
});
