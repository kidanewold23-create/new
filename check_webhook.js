const https = require('https');
https.get('https://api.telegram.org/bot8906068445:AAGc5L08H9a1Lc0oYIDL9o4ZqjJbLVMII4Y/getWebhookInfo', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
