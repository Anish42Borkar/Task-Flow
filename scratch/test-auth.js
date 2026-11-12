const { spawn } = require('child_process');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAuthTests() {
  console.log('====================================================');
  console.log('   TASKFLOW AUTHENTICATION ENHANCEMENTS TEST SUITE  ');
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

  // Generate a random test email
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testUser = {
    fullName: `Test User ${randomSuffix}`,
    email: `test.user.${randomSuffix}@example.com`,
    password: 'Password123!',
    phone: '+91 99999 88888',
    department: 'Engineering',
  };

  // TEST 1: User Registration
  console.log('--- 1. PUBLIC REGISTRATION ---');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestRunner/1.0' },
    body: JSON.stringify(testUser),
  }).then((r) => r.json());

  assert(regRes.success === true, '1.1 Registration succeeds with success=true', JSON.stringify(regRes));
  assert(regRes.data?.accessToken !== undefined, '1.2 Registration returns accessToken');
  assert(regRes.data?.refreshToken !== undefined, '1.3 Registration returns refreshToken');
  assert(regRes.data?.user?.email === testUser.email, '1.4 Registration returns correct user email');
  assert(regRes.data?.user?.role === 'user', '1.5 Default registered role is user');
  assert(regRes.data?.user?.passwordHash === undefined, '1.6 passwordHash is excluded from response');

  // TEST 2: Duplicate Registration Rejection
  console.log('\n--- 2. DUPLICATE EMAIL VALIDATION ---');
  const dupRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  }).then((r) => r.json());

  assert(dupRes.success === false && dupRes.statusCode === 400, '2.1 Duplicate email returns HTTP 400 Bad Request', JSON.stringify(dupRes));

  // TEST 3: Login with newly registered user
  console.log('\n--- 3. USER LOGIN & REFRESH TOKEN ISSUANCE ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestBrowser/1.0' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  }).then((r) => r.json());

  assert(loginRes.success === true, '3.1 Login succeeds');
  assert(loginRes.data?.accessToken !== undefined, '3.2 Login returns accessToken');
  assert(loginRes.data?.refreshToken !== undefined, '3.3 Login returns refreshToken');

  const initialRefreshToken = loginRes.data?.refreshToken;
  const initialAccessToken = loginRes.data?.accessToken;

  // TEST 4: Profile access via new AccessToken
  console.log('\n--- 4. ACCESSING PROTECTED PROFILE WITH ACCESS TOKEN ---');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${initialAccessToken}` },
  }).then((r) => r.json());

  assert(meRes.success === true, '4.1 GET /auth/me returns 200 with new accessToken');
  assert(meRes.data?.user?.email === testUser.email, '4.2 Authenticated profile matches user');

  // TEST 5: Refreshing Tokens
  console.log('\n--- 5. REFRESH TOKEN ROTATION ---');
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestBrowser/1.0' },
    body: JSON.stringify({ refreshToken: initialRefreshToken }),
  }).then((r) => r.json());

  assert(refreshRes.success === true, '5.1 POST /auth/refresh succeeds');
  assert(refreshRes.data?.accessToken !== undefined, '5.2 Returns new accessToken');
  assert(refreshRes.data?.refreshToken !== undefined, '5.3 Returns rotated refreshToken');
  assert(refreshRes.data?.refreshToken !== initialRefreshToken, '5.4 New refreshToken is different (rotated)');

  const newRefreshToken = refreshRes.data?.refreshToken;
  const newAccessToken = refreshRes.data?.accessToken;

  // TEST 6: Refresh token replay attack prevention (old token cannot be reused)
  console.log('\n--- 6. REFRESH TOKEN REUSE PREVENTION ---');
  const replayRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: initialRefreshToken }),
  }).then((r) => r.json());

  assert(replayRes.success === false && replayRes.statusCode === 401, '6.1 Reusing revoked refreshToken fails with HTTP 401', JSON.stringify(replayRes));

  // TEST 7: Logout
  console.log('\n--- 7. LOGOUT & SESSION TERMINATION ---');
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: newRefreshToken }),
  }).then((r) => r.json());

  assert(logoutRes.success === true, '7.1 POST /auth/logout succeeds');

  // TEST 8: Refreshing after logout must fail
  const postLogoutRefresh = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: newRefreshToken }),
  }).then((r) => r.json());

  assert(postLogoutRefresh.success === false && postLogoutRefresh.statusCode === 401, '8.1 Refreshing with logged out token fails with HTTP 401', JSON.stringify(postLogoutRefresh));

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

// Start backend if not already running
async function main() {
  let backendProc = null;
  try {
    const check = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => null);

    if (!check) {
      console.log('Starting backend server for test run...');
      backendProc = spawn('node', ['dist/src/main'], {
        cwd: path.resolve(__dirname, '../backend'),
        stdio: 'inherit',
      });
      // Wait for server to come up
      for (let i = 0; i < 20; i++) {
        await sleep(1000);
        const alive = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(() => null);
        if (alive) {
          console.log('Backend is up!');
          break;
        }
      }
    }

    await runAuthTests();
  } finally {
    if (backendProc) {
      backendProc.kill();
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
