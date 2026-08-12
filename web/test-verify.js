/* ==========================================================================
   VERIFY.ET INTEGRATION AUTOMATED TEST SUITE
   ========================================================================== */

import { verifyEt } from "./services/verifyEtService.js";
import { dbStore } from "./db/store.js";

async function runTests() {
  console.log("=================================================");
  console.log("🧪 STARTING VERIFY.ET BACKEND INTEGRATION TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Telebirr Sandbox Verification
  console.log("--- Test 1: Telebirr Verification ---");
  const telebirrRes = await verifyEt.verifyPayment({
    provider: "telebirr",
    referenceNumber: "TLB-99887711",
    expectedAmount: 10000
  });
  assert(telebirrRes.success === true, "Telebirr verification returned success = true");
  assert(telebirrRes.verified === true, "Telebirr payment verified status = true");
  assert(telebirrRes.amount === 10000, "Telebirr amount matches expected ETB 10,000");

  // TEST 2: CBE Verification (with Account Suffix)
  console.log("\n--- Test 2: CBE Verification ---");
  const cbeRes = await verifyEt.verifyPayment({
    provider: "cbe",
    referenceNumber: "FT24010ABC99",
    accountSuffix: "12345678",
    expectedAmount: 8500
  });
  assert(cbeRes.success === true, "CBE verification returned success = true");
  assert(cbeRes.verified === true, "CBE payment verified status = true");
  assert(cbeRes.provider === "cbe", "Provider correctly normalized to 'cbe'");

  // TEST 3: CBE Missing Account Suffix Rejection
  console.log("\n--- Test 3: CBE Missing Account Suffix Validation ---");
  const cbeNoSuffix = await verifyEt.verifyPayment({
    provider: "cbe",
    referenceNumber: "FT24010ABC99"
  });
  assert(cbeNoSuffix.verified === false, "CBE without suffix is correctly rejected");
  assert(cbeNoSuffix.code === "MISSING_ACCOUNT_SUFFIX", "Correct error code 'MISSING_ACCOUNT_SUFFIX'");

  // TEST 4: Underpayment / Amount Mismatch Detection
  console.log("\n--- Test 4: Fraud / Underpayment Detection ---");
  const fraudRes = await verifyEt.verifyPayment({
    provider: "telebirr",
    referenceNumber: "TLB-UNDERPAY-TEST",
    expectedAmount: 8500
  });
  assert(fraudRes.verified === false, "Underpayment marked as unverified");
  assert(fraudRes.fraudAlert === true, "Fraud alert flag triggered");

  // TEST 4b: Recipient Bank Account Mismatch Detection
  console.log("\n--- Test 4b: Recipient Bank Account Verification ---");
  const wrongAccRes = await verifyEt.verifyPayment({
    provider: "telebirr",
    referenceNumber: "TLB-WRONG_ACCOUNT-TEST",
    expectedAmount: 10000
  });
  assert(wrongAccRes.verified === false, "Unauthorized recipient bank account correctly rejected");
  assert(wrongAccRes.code === "ACCOUNT_MISMATCH", "Correct error code 'ACCOUNT_MISMATCH'");

  // TEST 5: Database Store Transaction & Auto-Enrollment
  console.log("\n--- Test 5: DB Store Ledger & Student Auto-Enrollment ---");
  const initialCourses = await dbStore.getCourses();
  const testCourse = initialCourses[0];
  const initialEnrolled = testCourse.enrolled_students;

  const enrollmentResult = await dbStore.enrollStudentAndGrantAccess({
    student: {
      name: "Verify.ET Test Student",
      phone: "+251 91 000 1122",
      email: "verifytest@example.com"
    },
    courseId: testCourse.id,
    txnId: "TXN-TEST-1234"
  });

  assert(enrollmentResult.accessGranted === true, "Access granted to student");
  assert(!!enrollmentResult.student.id, "Student ID generated");
  assert(!!enrollmentResult.telegramLinks.channel, "Telegram channel link provided");

  const updatedCourses = await dbStore.getCourses();
  const updatedCourse = updatedCourses.find(c => c.id === testCourse.id);
  assert(updatedCourse.enrolled_students === initialEnrolled + 1, "Enrolled students counter incremented");

  // TEST 6: Webhook HMAC Signature Validation
  console.log("\n--- Test 6: Webhook HMAC Signature Validation ---");
  import("crypto").then(({ default: crypto }) => {
    const payload = { referenceNumber: "TLB-99887711", status: "VERIFIED", amount: 10000 };
    const payloadStr = JSON.stringify(payload);
    const secret = "my_webhook_secret";
    const validSignature = crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");

    const isValid = verifyEt.verifyWebhookSignature(payload, validSignature, secret);
    assert(isValid === true, "HMAC-SHA256 signature verified as valid");

    const isInvalid = verifyEt.verifyWebhookSignature(payload, "bad_signature_hex", secret);
    assert(isInvalid === false, "Tampered signature correctly rejected");

    console.log("\n=================================================");
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
