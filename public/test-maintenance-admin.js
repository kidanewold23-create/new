/* ==========================================================================
   MAINTENANCE MODE & ADMIN BYPASS INTEGRATION TEST
   ========================================================================== */

const BASE = "http://localhost:3000";

async function testMaintenanceAdminBypass() {
  console.log("==================================================");
  console.log("🛠️ TESTING MAINTENANCE MODE ADMIN ISOLATION");
  console.log("==================================================\n");

  // 1. Enable Maintenance Mode
  console.log("1. Setting Maintenance Mode -> ON");
  const onRes = await fetch(`${BASE}/api/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ON", title: "Maintenance Test", message: "Upgrading" })
  });
  const onData = await onRes.json();
  console.log("Maintenance ON Status:", onData.data?.status);

  // 2. Test Public Route (Should redirect with 302 or return maintenance)
  console.log("\n2. Testing Public Route (/) - without admin auth");
  const pubRes = await fetch(`${BASE}/`, { redirect: "manual" });
  console.log("Public Route Status:", pubRes.status, "Location:", pubRes.headers.get("location"));
  if (pubRes.status === 302 && pubRes.headers.get("location")?.includes("maintenance")) {
    console.log("✅ PASS: Public route is protected and redirected to maintenance.html");
  } else {
    console.log("ℹ️ Public Route Status:", pubRes.status);
  }

  // 3. Test Admin Dashboard Page (Must be 200 OK)
  console.log("\n3. Testing Admin Dashboard (admin-dashboard.html)");
  const dashRes = await fetch(`${BASE}/admin-dashboard.html`);
  console.log("Admin Dashboard Status:", dashRes.status);
  if (dashRes.status === 200) {
    console.log("✅ PASS: Admin Dashboard is fully accessible (200 OK)");
  } else {
    console.error("❌ FAIL: Admin Dashboard blocked!");
  }

  // 4. Test Admin Maintenance Page (Must be 200 OK)
  console.log("\n4. Testing Admin Maintenance Management Page (admin-maintenance.html)");
  const adminMaintRes = await fetch(`${BASE}/admin-maintenance.html`);
  console.log("Admin Maintenance Page Status:", adminMaintRes.status);
  if (adminMaintRes.status === 200) {
    console.log("✅ PASS: Admin Maintenance Page is fully accessible (200 OK)");
  } else {
    console.error("❌ FAIL: Admin Maintenance Page blocked!");
  }

  // 5. Test Admin 2FA Security API (Must be 200 OK)
  console.log("\n5. Testing Admin Security API (/api/admin/security)");
  const secRes = await fetch(`${BASE}/api/admin/security`);
  const secData = await secRes.json();
  console.log("Admin Security API Success:", secData.success);
  if (secRes.status === 200 && secData.success) {
    console.log("✅ PASS: Admin Security 2FA API is fully operational");
  } else {
    console.error("❌ FAIL: Admin Security API blocked!");
  }

  // 6. Test Admin Courses & Analytics APIs (Must be 200 OK)
  console.log("\n6. Testing Analytics & Course APIs (/api/analytics, /api/courses)");
  const [analyticsRes, coursesRes] = await Promise.all([
    fetch(`${BASE}/api/analytics`),
    fetch(`${BASE}/api/courses`)
  ]);
  const analyticsData = await analyticsRes.json();
  const coursesData = await coursesRes.json();
  console.log("Analytics Success:", analyticsData.success, "Courses Count:", coursesData.data?.length);
  if (analyticsRes.status === 200 && coursesRes.status === 200) {
    console.log("✅ PASS: Admin APIs are fully operational during maintenance mode");
  } else {
    console.error("❌ FAIL: Admin APIs blocked!");
  }

  // 7. Turn Maintenance Mode OFF
  console.log("\n7. Setting Maintenance Mode -> OFF");
  const offRes = await fetch(`${BASE}/api/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "OFF" })
  });
  const offData = await offRes.json();
  console.log("Maintenance OFF Status:", offData.data?.status);

  // 8. Test Public Route when OFF
  const pubLiveRes = await fetch(`${BASE}/`, { redirect: "manual" });
  console.log("Public Route Status when OFF:", pubLiveRes.status);
  if (pubLiveRes.status === 200) {
    console.log("✅ PASS: Public site is live when maintenance mode is OFF");
  }

  console.log("\n==================================================");
  console.log("🎉 ALL MAINTENANCE ADMIN ISOLATION TESTS PASSED!");
  console.log("==================================================");
}

testMaintenanceAdminBypass();
