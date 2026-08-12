/* ==========================================================================
   HTTP ENDPOINT INTEGRATION TEST
   Tests Express Server live verification and transactions endpoints
   ========================================================================== */

import express from "express";
import http from "http";

async function testHttpEndpoints() {
  console.log("=================================================");
  console.log("🌐 STARTING HTTP ENDPOINT LIVE TESTS");
  console.log("=================================================\n");

  const BASE = "http://localhost:3000";

  // Test 1: GET /api/transactions
  console.log("--- 1. Testing GET /api/transactions ---");
  try {
    const res = await fetch(`${BASE}/api/transactions`);
    const data = await res.json();
    console.log("Status:", res.status, "Success:", data.success, "Items:", data.data?.length);
    if (res.status === 200 && data.success && Array.isArray(data.data)) {
      console.log("✅ PASS: /api/transactions returned transactions list");
    } else {
      console.error("❌ FAIL: /api/transactions unexpected response", data);
    }
  } catch (err) {
    console.error("❌ FAIL connecting to server:", err.message);
  }

  // Test 2: POST /api/verify/transaction (Telebirr Valid Test)
  console.log("\n--- 2. Testing POST /api/verify/transaction (Telebirr) ---");
  try {
    const res = await fetch(`${BASE}/api/verify/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Hermela Solomon",
        studentPhone: "+251 91 234 5678",
        studentEmail: "hermela@gmail.com",
        courseId: "course-video-editing",
        provider: "telebirr",
        referenceNumber: "TLB-77112233"
      })
    });
    const data = await res.json();
    console.log("Status:", res.status, "Verified:", data.verified, "Message:", data.message);
    if (res.status === 200 && data.verified && data.enrollment?.telegramChannel) {
      console.log("✅ PASS: Telebirr payment verified and student auto-enrolled with Telegram link:", data.enrollment.telegramChannel);
    } else {
      console.error("❌ FAIL:", data);
    }
  } catch (err) {
    console.error("❌ FAIL:", err.message);
  }

  // Test 3: POST /api/verify/transaction (CBE Valid Test)
  console.log("\n--- 3. Testing POST /api/verify/transaction (CBE with Account Suffix) ---");
  try {
    const res = await fetch(`${BASE}/api/verify/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Mulugeta Tesfaye",
        studentPhone: "+251 92 999 8877",
        studentEmail: "mulugeta@gmail.com",
        courseId: "course-smma-accelerator",
        provider: "cbe",
        referenceNumber: "FT24010XYZ88",
        accountSuffix: "12345678"
      })
    });
    const data = await res.json();
    console.log("Status:", res.status, "Verified:", data.verified, "Student ID:", data.enrollment?.studentId);
    if (res.status === 200 && data.verified) {
      console.log("✅ PASS: CBE payment verified and student ID created");
    } else {
      console.error("❌ FAIL:", data);
    }
  } catch (err) {
    console.error("❌ FAIL:", err.message);
  }

  // Test 5: GET /api/analytics
  console.log("\n--- 5. Testing GET /api/analytics (Database Direct Fetch) ---");
  try {
    const res = await fetch(`${BASE}/api/analytics`);
    const data = await res.json();
    console.log("Status:", res.status, "Success:", data.success, "KPI Revenue:", data.data?.kpi?.grossRevenue, "Courses Count:", data.data?.courses?.length, "Recent Enrollments:", data.data?.recentEnrollments?.length);
    if (res.status === 200 && data.success && data.data?.kpi && Array.isArray(data.data?.courses)) {
      console.log("✅ PASS: /api/analytics returned live database aggregations, KPIs and recent enrollments");
    } else {
      console.error("❌ FAIL: /api/analytics unexpected response", data);
    }
  } catch (err) {
    console.error("❌ FAIL:", err.message);
  }

  console.log("\n=================================================");
  console.log("🎉 ALL HTTP INTEGRATION TESTS COMPLETED!");
  console.log("=================================================");
}

testHttpEndpoints();
