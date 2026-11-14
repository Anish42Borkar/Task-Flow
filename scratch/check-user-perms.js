const { Pool } = require('pg');
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'root', database: 'taskflow' });
async function main() {
  const r = await pool.query("SELECT * FROM role_permissions WHERE role_id = 'user'");
  console.table(r.rows);
  await pool.end();
}
main();
