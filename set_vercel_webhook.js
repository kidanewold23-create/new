const https = require('https');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '8659500401:AAEUvDQTc0pniztDTiIQU65igbuiiM5ZXAc';
const WEBHOOK_URL = 'https://new-nu-umber.vercel.app/api/bot';

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
    console.log(`Setting webhook to Vercel domain (${WEBHOOK_URL})...`);
    const url = `https://api.telegram.org/bot${TOKEN}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}`;
    const res = await request(url);
    console.log(res);
}

run();
