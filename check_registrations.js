const axios = require('axios');
const SUPABASE_URL = "https://yrelqbvkxwdkzaraydfz.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3";

async function checkQuizProgress() {
    try {
        const url = SUPABASE_URL + '/rest/v1/user_quiz_progress';
        const headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };
        const response = await axios.get(url, { headers });
        console.log("Total users in quiz progress:", response.data.length);
        if (response.data.length > 0) {
            console.log("User quiz progress:");
            response.data.forEach(user => {
                console.log(`Chat ID: ${user.chat_id}, Current Day: ${user.current_day}, Current Q Index: ${user.current_question_index}, Last Completed At: ${user.last_completed_at}, Is Completed: ${user.is_completed}`);
            });
        } else {
            console.log("No users found in user_quiz_progress.");
        }
    } catch(e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}

checkQuizProgress();
