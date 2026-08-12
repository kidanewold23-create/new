const axios = require('axios');
const SUPABASE_URL = "https://yrelqbvkxwdkzaraydfz.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3";
async function test() {
    try {
        const url = SUPABASE_URL + '/rest/v1/registrations?limit=1';
        const headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };
        const response = await axios.get(url, { headers });
        console.log(JSON.stringify(response.data[0], null, 2));
    } catch(e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}
test();
