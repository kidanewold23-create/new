require('dotenv').config();
const db = require('./api/db.js');

async function test() {
    const [regs] = await db.getRegistrationsPaginated(1, 10, "all");
    const testReg = regs.find(r => r.receipt_image_url);
    console.log(testReg ? testReg.receipt_image_url : "No receipt_image_url found in top 10");
}
test().catch(console.error);
