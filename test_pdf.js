const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
async function test() {
    const form = new FormData();
    form.append('files', fs.createReadStream('api/IMG_6757.html'), { filename: 'index.html' });
    const res = await axios.post('https://demo.gotenberg.dev/forms/chromium/convert/html', form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer'
    });
    fs.writeFileSync('test_output.pdf', res.data);
    console.log('done, bytes:', res.data.length);
}
test().catch(console.error);
