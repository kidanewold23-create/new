const axios = require('axios');

async function testBot() {
    const url = 'https://yonatandi.vercel.app/api/bot';
    const payload = {
        update_id: 12345,
        message: {
            message_id: 1,
            from: { id: 111111, is_bot: false, first_name: "Test" },
            chat: { id: 111111, type: "private" },
            date: Math.floor(Date.now() / 1000),
            text: "/start"
        }
    };

    try {
        console.log("Sending POST to", url);
        const res = await axios.post(url, payload);
        console.log("Status:", res.status);
        console.log("Data:", res.data);
    } catch (err) {
        console.log("Error:", err.response ? err.response.status : err.message);
        console.log("Error Data:", err.response ? err.response.data : err.message);
    }
}

testBot();
