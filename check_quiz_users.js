const axios = require('axios');
const SUPABASE_URL = "https://yrelqbvkxwdkzaraydfz.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3";

async function checkQuizUsers() {
    try {
        const headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };
        
        // Get all quiz progress
        const progressUrl = SUPABASE_URL + '/rest/v1/user_quiz_progress';
        const progressResponse = await axios.get(progressUrl, { headers });
        const progress = progressResponse.data;

        if (!progress || progress.length === 0) {
            console.log("No users found in user_quiz_progress.");
            return;
        }

        // Get all registrations to match chat_id to name
        const regsUrl = SUPABASE_URL + '/rest/v1/registrations';
        const regsResponse = await axios.get(regsUrl, { headers });
        const regs = regsResponse.data;

        const regMap = {};
        for (const reg of regs) {
            regMap[reg.chat_id] = reg.name;
        }

        const day1Users = [];
        const day2Users = [];

        for (const p of progress) {
            const name = regMap[p.chat_id] || 'Unknown Name';
            if (p.current_day === 1) {
                day1Users.push(`${name} (Chat ID: ${p.chat_id})`);
            } else if (p.current_day === 2) {
                day2Users.push(`${name} (Chat ID: ${p.chat_id})`);
            } else {
                console.log(`User ${name} is on Day ${p.current_day}`);
            }
        }

        console.log("=== Users who received Day 1 Quiz ===");
        if (day1Users.length > 0) {
            day1Users.forEach(u => console.log("- " + u));
        } else {
            console.log("No users are currently on Day 1.");
        }

        console.log("\n=== Users who received Day 2 Quiz ===");
        if (day2Users.length > 0) {
            day2Users.forEach(u => console.log("- " + u));
        } else {
            console.log("No users are currently on Day 2.");
        }

    } catch(e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}

checkQuizUsers();
