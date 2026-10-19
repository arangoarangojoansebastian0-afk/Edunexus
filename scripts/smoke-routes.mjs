const base = process.env.EDUNEXUS_BASE_URL || 'http://localhost:2000';
const routes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
let failures = 0;
for (const route of routes) {
  try {
    const response = await fetch(base + route, { redirect: 'manual' });
    if (response.status >= 500) { console.error(`FAIL ${route}: ${response.status}`); failures++; }
    else console.log(`OK   ${route}: ${response.status}`);
  } catch (error) { console.error(`FAIL ${route}: ${error.message}`); failures++; }
}
process.exitCode = failures ? 1 : 0;
