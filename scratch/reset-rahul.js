const { Pool } = require('pg');
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'root', database: 'taskflow' });
async function main() {
  await pool.query("UPDATE users SET role_id = 'user' WHERE email = 'rahul@taskflow.com'");
  
  // Remove rahul from API Integration project to maintain role isolation test
  const p3Res = await pool.query("SELECT id FROM projects WHERE name = 'API Integration'");
  const uRes = await pool.query("SELECT id FROM users WHERE email = 'rahul@taskflow.com'");
  if (p3Res.rows[0] && uRes.rows[0]) {
    await pool.query("DELETE FROM project_members WHERE project_id = $1 AND user_id = $2", [p3Res.rows[0].id, uRes.rows[0].id]);
    console.log('Removed rahul from API Integration');
  }

  // Ensure rahul is member of Website Redesign
  const p1Res = await pool.query("SELECT id FROM projects WHERE name = 'Website Redesign'");
  if (p1Res.rows[0] && uRes.rows[0]) {
    await pool.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [p1Res.rows[0].id, uRes.rows[0].id]
    );
    console.log('Ensured rahul is member of Website Redesign');
  }

  await pool.end();
}
main();
