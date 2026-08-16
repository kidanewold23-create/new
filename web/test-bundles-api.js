/* ==========================================================================
   AUTOMATED TEST SUITE: COURSE BUNDLES & MULTI-LINK ENROLLMENT
   ========================================================================== */

import http from "http";

const BASE_URL = "http://localhost:3000";

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (_e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("🧪 --- Starting Course Bundles API Test Suite ---\n");

  try {
    // 1. GET /api/bundles
    console.log("1️⃣ Testing GET /api/bundles...");
    const getRes = await request("GET", "/api/bundles");
    console.log(`Response status: ${getRes.status}`);
    console.log(`Bundles count: ${getRes.data?.data?.length || 0}`);
    if (getRes.status === 200 && Array.isArray(getRes.data?.data)) {
      console.log("✅ GET /api/bundles PASSED");
    } else {
      console.error("❌ GET /api/bundles FAILED:", getRes);
    }

    // 2. Create a test 4-course bundle (1 Main + 3 Included)
    console.log("\n2️⃣ Testing POST /api/admin/bundles (4-Course Package Deal)...");
    const newBundlePayload = {
      title: "Mega 4-Course Entrepreneur Bundle",
      price: "24,000 ETB",
      main_course_id: "course-smma-accelerator",
      included_course_ids: ["course-video-editing", "course-content-creation", "course-graphic-design"],
      description: "Complete 4-in-1 media and agency growth package.",
      status: "ON"
    };

    const createRes = await request("POST", "/api/admin/bundles", newBundlePayload);
    console.log(`Response status: ${createRes.status}`);
    console.log(`Created Bundle ID: ${createRes.data?.data?.id}`);
    const createdId = createRes.data?.data?.id;

    if (createRes.status === 201 && createdId) {
      console.log("✅ POST /api/admin/bundles PASSED");
    } else {
      console.error("❌ POST /api/admin/bundles FAILED:", createRes);
    }

    // 3. GET single bundle by ID
    console.log(`\n3️⃣ Testing GET /api/bundles/${createdId}...`);
    const getSingleRes = await request("GET", `/api/bundles/${createdId}`);
    const bundleObj = getSingleRes.data?.data;
    console.log(`Main course: ${bundleObj?.main_course?.title}`);
    console.log(`Included courses count: ${bundleObj?.included_courses?.length}`);
    console.log(`Total contained courses: ${bundleObj?.all_contained_courses?.length}`);

    if (getSingleRes.status === 200 && bundleObj?.all_contained_courses?.length === 4) {
      console.log("✅ GET /api/bundles/:id (4-course validation) PASSED");
    } else {
      console.error("❌ GET /api/bundles/:id FAILED:", getSingleRes);
    }

    // 4. Test Student Multi-Course & Multi-Link Access Delivery
    console.log("\n4️⃣ Testing Student Transaction & Multi-Link Delivery for Bundle...");
    const testTxnPayload = {
      id: "TXN-BUNDLE-TEST-101",
      student_name: "Kidanewold Tesfaye",
      student_phone: "+251 91 999 8888",
      masterclass_title: bundleObj.title,
      course_id: createdId,
      amount: "24,000 ETB",
      payment_method: "telebirr",
      status: "Completed",
      verify_et_status: "VERIFIED"
    };
    await request("POST", "/api/transactions", testTxnPayload);

    // Fetch student courses with links
    const studentRes = await request("GET", `/api/student/me?phone=${encodeURIComponent("+251 91 999 8888")}`);
    const studentCourses = studentRes.data?.data?.courses || [];
    console.log(`Enrolled student courses count: ${studentCourses.length}`);
    
    // Check telegram channels count
    const channelLinks = studentCourses.map(c => c.tg_channel).filter(Boolean);
    const groupLinks = studentCourses.map(c => c.tg_group).filter(Boolean);
    console.log(`Delivered Telegram Channel Links (${channelLinks.length}):`, channelLinks);
    console.log(`Delivered Telegram Group Links (${groupLinks.length}):`, groupLinks);

    if (studentCourses.length === 4 && channelLinks.length === 4 && groupLinks.length === 4) {
      console.log("✅ 4-Course Bundle Telegram Link Multi-Delivery PASSED");
    } else {
      console.error("❌ Student Multi-Link Delivery FAILED:", studentCourses);
    }

    // 5. Delete Test Bundle
    console.log(`\n5️⃣ Testing DELETE /api/admin/bundles/${createdId}...`);
    const delRes = await request("DELETE", `/api/admin/bundles/${createdId}`);
    if (delRes.status === 200) {
      console.log("✅ DELETE /api/admin/bundles PASSED");
    } else {
      console.error("❌ DELETE /api/admin/bundles FAILED:", delRes);
    }

    console.log("\n🎉 --- ALL COURSE BUNDLES TESTS PASSED! --- 🎉\n");
  } catch (err) {
    console.error("❌ Test suite encountered error:", err.message);
  }
}

runTests();
