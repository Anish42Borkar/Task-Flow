import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

async function seed() {
  console.log('🌱 Starting TaskFlow database seeding...');

  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'taskflow',
    ssl: false,
  });

  const db = drizzle(pool, { schema });

  try {
    // 1. Seed Roles
    console.log('Creating roles...');
    await db.insert(schema.roles).values([
      {
        id: 'admin',
        name: 'Admin',
        description: 'Full access to all features, users, and settings.',
        isSystemRole: true,
      },
      {
        id: 'project_manager',
        name: 'Project Manager',
        description: 'Can create and manage projects, tasks, and team members.',
        isSystemRole: false,
      },
      {
        id: 'user',
        name: 'User / Member',
        description: 'Can view projects and manage assigned tasks.',
        isSystemRole: true,
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Can view projects and tasks with read-only access.',
        isSystemRole: false,
      },
    ]).onConflictDoNothing();

    // 2. Seed Role Permissions
    console.log('Configuring default permissions...');
    const modules = ['projects', 'tasks', 'user_management', 'permissions', 'settings', 'notifications'];
    const permissionEntries: schema.NewRolePermission[] = [];

    // Admin permissions
    for (const mod of modules) {
      permissionEntries.push({
        id: `admin_${mod}`,
        roleId: 'admin',
        module: mod,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      });
    }

    // User permissions
    for (const mod of modules) {
      const isTaskOrProject = mod === 'tasks' || mod === 'projects' || mod === 'notifications';
      permissionEntries.push({
        id: `user_${mod}`,
        roleId: 'user',
        module: mod,
        canView: isTaskOrProject,
        canCreate: mod === 'tasks',
        canEdit: mod === 'tasks',
        canDelete: false,
      });
    }

    await db.insert(schema.rolePermissions).values(permissionEntries).onConflictDoNothing();

    // 3. Seed Users
    console.log('Creating initial users...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const [adminUser] = await db.insert(schema.users).values({
      fullName: 'Anish Borkar',
      email: 'anish.borkar@example.com',
      passwordHash,
      phone: '+91 98765 43210',
      department: 'IT',
      roleId: 'admin',
      isActive: true,
    }).onConflictDoNothing().returning();

    const [regularUser] = await db.insert(schema.users).values({
      fullName: 'Rahul Kumar',
      email: 'rahul@taskflow.com',
      passwordHash,
      phone: '+91 91234 56789',
      department: 'IT',
      roleId: 'user',
      isActive: true,
    }).onConflictDoNothing().returning();

    const [member2] = await db.insert(schema.users).values({
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      passwordHash,
      phone: '+91 98111 22334',
      department: 'Delivery',
      roleId: 'user',
      isActive: true,
    }).onConflictDoNothing().returning();

    // 4. Seed Projects
    console.log('Creating initial projects...');
    const adminId = adminUser?.id;
    const userId = regularUser?.id;

    if (adminId) {
      const [p1] = await db.insert(schema.projects).values({
        name: 'Website Redesign',
        description: 'Marketing website revamp with new UI/UX',
        status: 'active',
        dueDate: new Date('2026-11-30T00:00:00Z'),
        createdBy: adminId,
      }).onConflictDoNothing().returning();

      const [p2] = await db.insert(schema.projects).values({
        name: 'Mobile App',
        description: 'Cross-platform mobile application (React Native)',
        status: 'in_progress',
        dueDate: new Date('2026-12-15T00:00:00Z'),
        createdBy: adminId,
      }).onConflictDoNothing().returning();

      const [p3] = await db.insert(schema.projects).values({
        name: 'API Integration',
        description: 'Core backend REST and WebSocket APIs',
        status: 'completed',
        dueDate: new Date('2026-11-10T00:00:00Z'),
        createdBy: adminId,
      }).onConflictDoNothing().returning();

      // 5. Seed Project Memberships
      if (p1 && userId) {
        await db.insert(schema.projectMembers).values([
          { projectId: p1.id, userId: adminId },
          { projectId: p1.id, userId: userId },
        ]).onConflictDoNothing();

        // 6. Seed Tasks
        console.log('Creating initial tasks...');
        const [t1] = await db.insert(schema.tasks).values({
          title: 'Update project documentation',
          description: 'Update project documentation with the latest changes and deployment steps.',
          projectId: p1.id,
          status: 'In Progress',
          orderIndex: 1.0,
          priority: 'High',
          dueDate: new Date('2026-11-30T00:00:00Z'),
          createdBy: adminId,
        }).onConflictDoNothing().returning();

        const [t2] = await db.insert(schema.tasks).values({
          title: 'Design Dashboard UI',
          description: 'Create high-fidelity dark navy dashboard components in React.',
          projectId: p1.id,
          status: 'In Progress',
          orderIndex: 2.0,
          priority: 'Medium',
          dueDate: new Date('2026-11-25T00:00:00Z'),
          createdBy: adminId,
        }).onConflictDoNothing().returning();

        // 7. Seed Task Assignee
        if (t1 && userId) {
          await db.insert(schema.taskAssignees).values({
            taskId: t1.id,
            userId: userId,
          }).onConflictDoNothing();
        }
      }

      if (p2 && userId) {
        await db.insert(schema.projectMembers).values([
          { projectId: p2.id, userId: adminId },
          { projectId: p2.id, userId: userId },
        ]).onConflictDoNothing();

        await db.insert(schema.tasks).values({
          title: 'Fix login issue',
          description: 'Resolve session persistence and token refresh behavior.',
          projectId: p2.id,
          status: 'Pending',
          orderIndex: 1.0,
          priority: 'High',
          dueDate: new Date('2026-12-15T00:00:00Z'),
          createdBy: adminId,
        }).onConflictDoNothing();
      }

      // 8. Seed Notifications
      console.log('Creating initial notifications...');
      const notifsToInsert: schema.NewNotification[] = [];
      if (adminId) {
        notifsToInsert.push(
          {
            userId: adminId,
            title: 'Welcome to TaskFlow Admin',
            message: 'You have full administrative privileges to manage projects, tasks, and users.',
            type: 'info',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30),
          },
          {
            userId: adminId,
            title: 'New project workspace',
            message: 'Project "Website Redesign" was successfully established.',
            type: 'project_updated',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60),
          },
          {
            userId: adminId,
            title: 'Task in progress',
            message: 'Rahul Kumar began working on "Update project documentation".',
            type: 'task_updated',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 120),
          },
        );
      }
      if (userId) {
        notifsToInsert.push(
          {
            userId: userId,
            title: 'Task assigned to you',
            message: 'You have been assigned a new task "Update project documentation" by Anish Borkar.',
            type: 'task_assigned',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 15),
          },
          {
            userId: userId,
            title: 'Assigned to Project',
            message: 'You have been added to the project "Website Redesign".',
            type: 'project_assigned',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 50),
          },
          {
            userId: userId,
            title: 'Assigned to Project',
            message: 'You have been added to the project "Mobile App".',
            type: 'project_assigned',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 90),
          },
        );
      }
      if (notifsToInsert.length > 0) {
        await db.insert(schema.notifications).values(notifsToInsert).onConflictDoNothing();
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
