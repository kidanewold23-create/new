const axios = require('axios');
const SUPABASE_URL = "https://yrelqbvkxwdkzaraydfz.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3";

async function checkDetailedUsers() {
    try {
        const headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };
        
        const progressUrl = SUPABASE_URL + '/rest/v1/user_quiz_progress';
        const progressResponse = await axios.get(progressUrl, { headers });
        const progress = progressResponse.data;

        const regsUrl = SUPABASE_URL + '/rest/v1/registrations';
        const regsResponse = await axios.get(regsUrl, { headers });
        const regs = regsResponse.data;

        const regMap = {};
        for (const reg of regs) {
            regMap[reg.chat_id] = reg.name;
        }

        console.log("=== Detailed User Progress ===");
        let found = false;
        for (const p of progress) {
            const name = regMap[p.chat_id] || 'Unknown Name';
            console.log(`Name: ${name}`);
            console.log(`  Chat ID: ${p.chat_id}`);
            console.log(`  Current Day: ${p.current_day}`);
            console.log(`  Question Index: ${p.current_question_index}`);
            console.log(`  Is Completed: ${p.is_completed}`);
            console.log(`  Last Completed At: ${p.last_completed_at}`);
            console.log("------------------------");
            
            // "took both day 1 and 2 quiz" means they either finished day 2, or they are on day 3
            if (p.current_day > 2 || (p.current_day === 2 && p.is_completed)) {
                found = true;
            }
        }
        
    } catch(e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}

checkDetailedUsers();
