const { Pool } = require('pg');
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'root', database: 'taskflow' });
async function main() {
  await pool.query("UPDATE role_permissions SET can_create = true, can_edit = true WHERE id = 'user_tasks'");
  console.log('Restored user_tasks can_create and can_edit to true');
  await pool.end();
}
main();
