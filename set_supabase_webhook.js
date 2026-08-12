const https = require('https');

const TOKEN = '8906068445:AAGc5L08H9a1Lc0oYIDL9o4ZqjJbLVMII4Y';
const WEBHOOK_URL = 'https://yrelqbvkxwdkzaraydfz.supabase.co/functions/v1/api/bot';

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
    console.log("Setting webhook to Supabase Edge Function...");
    const url = `https://api.telegram.org/bot${TOKEN}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}`;
    const res = await request(url);
    console.log(res);
}

run();
