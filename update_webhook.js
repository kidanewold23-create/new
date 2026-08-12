const https = require('https');

const oldToken = '8864741035:AAF5BMri8NIWEhJfwUq7DGmkiwQ86zB5o8o';
const newToken = '8906068445:AAGc5L08H9a1Lc0oYIDL9o4ZqjJbLVMII4Y';

function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function run() {
    console.log("Deleting old webhook...");
    const oldRes = await request(`https://api.telegram.org/bot${oldToken}/deleteWebhook`);
    console.log(oldRes);
    
    console.log("Deleting new webhook (to enable local polling)...");
    const newRes = await request(`https://api.telegram.org/bot${newToken}/deleteWebhook`);
    console.log(newRes);
    
    console.log("Done. If you are hosting on Vercel, you need to hit /api/bot/setup on your deployed URL to set it.");
}

run();
