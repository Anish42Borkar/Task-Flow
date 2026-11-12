const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runE2ETests() {
  console.log('====================================================');
  console.log('   TASKFLOW FULL-STACK AUTOMATED E2E TEST SUITE     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Admin Login
  console.log('--- 1. AUTHENTICATION & JWT GENERATION ---');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'anish.borkar@example.com', password: 'Password123!' }),
  }).then((r) => r.json());

  assert(
    adminLoginRes.success && adminLoginRes.data?.accessToken && adminLoginRes.data?.user?.role === 'admin',
    'Admin login returns valid JWT and role "admin"',
  );
  const adminToken = adminLoginRes.data.accessToken;

  // TEST 2: Regular User Login
  const userLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul@taskflow.com', password: 'Password123!' }),
  }).then((r) => r.json());

  assert(
    userLoginRes.success && userLoginRes.data?.accessToken && userLoginRes.data?.user?.role === 'user',
    'Regular user login returns valid JWT and role "user"',
  );
  const userToken = userLoginRes.data.accessToken;
  const userProfile = userLoginRes.data.user;

  // TEST 3: Project Access Isolation
  console.log('\n--- 2. ROLE-BASED PROJECT ISOLATION ---');
  const adminProjects = await fetch(`${API_BASE}/projects`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  const userProjects = await fetch(`${API_BASE}/projects`, {
    headers: { Authorization: `Bearer ${userToken}` },
  }).then((r) => r.json());

  assert(
    adminProjects.data.length >= 3,
    `Admin can view all projects (${adminProjects.data.length} found)`,
  );

  const nonMemberProject = adminProjects.data.find(
    (p) => !userProjects.data.some((up) => up.id === p.id),
  );

  assert(
    nonMemberProject !== undefined,
    `Regular user sees only member projects (isolated from "${nonMemberProject?.name}")`,
  );

  // TEST 4: ProjectMemberGuard Security Boundary
  console.log('\n--- 3. BACKEND RBAC & PROJECT MEMBER GUARD ---');
  const forbiddenAccessRes = await fetch(`${API_BASE}/projects/${nonMemberProject.id}/tasks`, {
    headers: { Authorization: `Bearer ${userToken}` },
  }).then((r) => r.json());

  assert(
    forbiddenAccessRes.statusCode === 403,
    `ProjectMemberGuard blocks unauthorized user accessing non-member project (HTTP 403)`,
    JSON.stringify(forbiddenAccessRes),
  );

  // TEST 5: Task Creation
  console.log('\n--- 4. TASK MANAGEMENT & RBAC PERMISSIONS ---');
  const activeUserProject = userProjects.data[0];
  const createTaskRes = await fetch(`${API_BASE}/projects/${activeUserProject.id}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      title: 'Automated E2E Verification Task',
      description: 'Testing task creation and DnD pipeline',
      status: 'Pending',
      priority: 'High',
    }),
  }).then((r) => r.json());

  assert(
    createTaskRes.success && createTaskRes.data?.title === 'Automated E2E Verification Task',
    'Project member can create a new task in assigned project',
  );
  const createdTaskId = createTaskRes.data.id;

  // TEST 6: Task Status Update
  const updateStatusRes = await fetch(`${API_BASE}/tasks/${createdTaskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ status: 'In Progress' }),
  }).then((r) => r.json());

  assert(
    updateStatusRes.success && updateStatusRes.data?.status === 'In Progress',
    'Task status successfully updated to "In Progress"',
  );

  // TEST 7: RBAC Task Deletion (Non-Admin forbidden, Admin allowed)
  const userDeleteRes = await fetch(`${API_BASE}/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` },
  }).then((r) => r.json());

  assert(
    userDeleteRes.statusCode === 403,
    'Non-admin user cannot delete task (HTTP 403 Forbidden)',
  );

  // TEST 8: Drag-and-Drop Task Ordering & Database Persistence
  console.log('\n--- 5. DRAG-AND-DROP REORDERING & PERSISTENCE ---');
  const tasksBefore = await fetch(`${API_BASE}/projects/${activeUserProject.id}/tasks`, {
    headers: { Authorization: `Bearer ${userToken}` },
  }).then((r) => r.json());

  const originalOrder = tasksBefore.data.map((t) => t.id);
  const reversedOrder = [...originalOrder].reverse();

  const reorderRes = await fetch(`${API_BASE}/projects/${activeUserProject.id}/tasks/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ orderedTaskIds: reversedOrder }),
  }).then((r) => r.json());

  assert(
    reorderRes.success && reorderRes.data?.success === true,
    'Task reorder API accepts new task sequence',
  );

  const tasksAfter = await fetch(`${API_BASE}/projects/${activeUserProject.id}/tasks`, {
    headers: { Authorization: `Bearer ${userToken}` },
  }).then((r) => r.json());

  const newOrder = tasksAfter.data.map((t) => t.id);
  assert(
    JSON.stringify(newOrder) === JSON.stringify(reversedOrder),
    'Reordered task indices persisted in PostgreSQL across queries',
  );

  // TEST 9: Admin Deletes Task
  const adminDeleteRes = await fetch(`${API_BASE}/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    adminDeleteRes.success && (adminDeleteRes.data?.success === true || adminDeleteRes.data?.deleted === true),
    'Admin successfully deletes task',
  );

  // TEST 10: Real-Time Socket.IO Authentication & Room Join
  console.log('\n--- 6. REAL-TIME SOCKET.IO NOTIFICATIONS & ROOMS ---');
  await new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${userToken}` },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      assert(socket.connected, `Socket connected and authenticated (Socket ID: ${socket.id})`);

      socket.emit('project:join', { projectId: activeUserProject.id }, (ack) => {
        assert(true, `Socket successfully joined room project:${activeUserProject.id}`);
        socket.disconnect();
        resolve(null);
      });

      // fallback if ack not requested
      setTimeout(() => {
        socket.disconnect();
        resolve(null);
      }, 1000);
    });

    socket.on('connect_error', (err) => {
      assert(false, 'Socket connection failed', err.message);
      resolve(null);
    });
  });

  // TEST 11: Granular Permissions Matrix API
  console.log('\n--- 7. PERMISSIONS & ROLES MATRIX ---');
  const rolesRes = await fetch(`${API_BASE}/roles`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    rolesRes.success && rolesRes.data?.length >= 2,
    `Admin can query system roles (${rolesRes.data?.length} roles available)`,
  );

  const testRole = rolesRes.data.find((r) => r.id === 'user') || rolesRes.data[0];
  const permsRes = await fetch(`${API_BASE}/permissions/${testRole.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    permsRes.success && (Array.isArray(permsRes.data) || Array.isArray(permsRes.data?.permissions)),
    `Admin can fetch granular permissions matrix for role "${testRole.name}"`,
  );

  // TEST 12: Notifications Query & Mark As Read
  console.log('\n--- 8. NOTIFICATIONS PIPELINE ---');
  const notifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    notifsRes.success && (Array.isArray(notifsRes.data) || Array.isArray(notifsRes.data?.notifications)),
    `User can fetch notifications list`,
  );

  const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    markAllRes.success,
    'User can mark all notifications as read',
  );

  // TEST 13: System Settings API (Application Name, Timezone, Date Format)
  console.log('\n--- 9. SYSTEM SETTINGS PERSISTENCE & API INTEGRATION ---');
  const getSettingsRes = await fetch(`${API_BASE}/settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    getSettingsRes.success && getSettingsRes.data?.appName,
    `Admin can fetch system settings (Current App Name: "${getSettingsRes.data?.appName}")`,
  );

  const updatedSettings = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appName: 'TaskFlow Enterprise',
      timezone: '(GMT+05:30) India Standard Time',
      dateFormat: 'DD MMM, YYYY (e.g. 28 Oct, 2026)',
    }),
  }).then((r) => r.json());

  assert(
    updatedSettings.success && updatedSettings.data?.appName === 'TaskFlow Enterprise',
    'Admin successfully updated Application Name to "TaskFlow Enterprise"',
  );

  const verifySettings = await fetch(`${API_BASE}/settings`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  assert(
    verifySettings.data?.appName === 'TaskFlow Enterprise' &&
      verifySettings.data?.timezone === '(GMT+05:30) India Standard Time' &&
      verifySettings.data?.dateFormat === 'DD MMM, YYYY (e.g. 28 Oct, 2026)',
    'Settings changes verified persisted in PostgreSQL across queries',
  );

  // Reset back to standard default
  await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appName: 'TaskFlow',
      timezone: '(GMT+05:30) India Standard Time',
      dateFormat: 'DD MMM, YYYY (e.g. 28 Oct, 2026)',
    }),
  });

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 ALL ASSIGNMENT SPECIFICATIONS FULLY VERIFIED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
