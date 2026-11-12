const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'root',
  database: 'taskflow',
});

async function main() {
  const modules = ['projects', 'tasks', 'user_management', 'permissions', 'settings', 'notifications'];

  for (const mod of modules) {
    // Project manager
    await pool.query(
      `INSERT INTO role_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete`,
      [
        `project_manager_${mod}`,
        'project_manager',
        mod,
        true,
        mod === 'projects' || mod === 'tasks',
        mod === 'projects' || mod === 'tasks',
        false,
      ]
    );

    // Viewer
    await pool.query(
      `INSERT INTO role_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete`,
      [
        `viewer_${mod}`,
        'viewer',
        mod,
        mod === 'projects' || mod === 'tasks' || mod === 'notifications',
        false,
        false,
        false,
      ]
    );
  }

  const counts = await pool.query('SELECT role_id, count(*) FROM role_permissions GROUP BY role_id ORDER BY role_id');
  console.log('Perms per role in database:');
  console.table(counts.rows);
  await pool.end();
}

main().catch(console.error);
