const axios = require('axios');

async function testToken() {
    const token = "8906068445:AAGc5L08H9a1Lc0oYIDL9o4ZqjJbLVMII4Y";
    try {
        const res = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        console.log(res.data);
    } catch (err) {
        console.log("Error:", err.response ? err.response.data : err.message);
    }
}

testToken();
