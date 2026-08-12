require('dotenv').config();
const db = require('./api/db.js');

async function test() {
    const referrerChatId = 123456789;
    
    // Create referrer
    await db.upsertRegistration(referrerChatId, {
        step: "en|awaiting_payment",
        status: "pending",
        name: "Test Referrer",
        phone: "123456"
    });
    
    // Create 3 approved referrals
    for (let i = 1; i <= 3; i++) {
        const studentChatId = 123456789 + i;
        await db.upsertRegistration(studentChatId, {
            step: "en|completed",
            status: "approved",
            name: "Student " + i,
            phone: "00" + i,
            referred_by_chat_id: referrerChatId
        });
    }
    
    // Call the reward logic directly by copying it here, since we don't want to spin up express
    const referrals = await db.getReferrals(referrerChatId);
    const approvedReferrals = referrals.filter(r => r.status === "approved");
    console.log("Approved Referrals:", approvedReferrals.length);
    
    if (approvedReferrals.length >= 3) {
        console.log("Auto-approving referrer...");
        const referrerReg = await db.getRegistration(referrerChatId);
        console.log("Referrer before:", referrerReg.status);
        await db.updateRegistrationStatus(referrerReg.id, "approved", "dummy-link");
        const referrerRegAfter = await db.getRegistration(referrerChatId);
        console.log("Referrer after:", referrerRegAfter.status);
    }
}
test().catch(console.error);
