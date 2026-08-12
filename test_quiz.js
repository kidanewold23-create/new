const db = require('./api/db.js');
const index = require('./api/index.js'); // Actually, sendNextQuizQuestion is not exported from index.js

// Let's just mock what sendNextQuizQuestion does:
const axios = require('axios');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7247731707:AAFKlE7iTjX1jZ0L1X0g1a3G1O-WjO988vA";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramRequest(method, payload) {
    try {
        const url = `${TELEGRAM_API_URL}/${method}`;
        console.log(`Sending to ${url}`, payload);
        const response = await axios.post(url, payload);
        return response.data;
    } catch (e) {
        console.error(`Telegram API error (${method}):`, e.response ? e.response.data : e.message);
        throw e;
    }
}

async function test(chatId) {
    try {
        const prog = await db.getUserQuizProgress(chatId);
        console.log("Prog:", prog);
        
        const day = prog.current_day || 1;
        const qIndex = prog.current_question_index || 0;
        
        const questions = await db.getQuestionsByDay(day);
        console.log(`Found ${questions.length} questions for day ${day}`);
        
        if (questions.length > 0 && qIndex < questions.length) {
            const q = questions[qIndex];
            const options = q.options || [];
            const kb = { inline_keyboard: [] };
            options.forEach((opt, i) => {
                kb.inline_keyboard.push([{ text: String(opt), callback_data: `ans:${q.id}:${i}` }]);
            });
            
            const msg = `🎓 **Day ${day} - Question ${qIndex + 1}/${questions.length}**\n\n${q.question_text}`;
            console.log("Sending msg:", msg, kb);
            
            await sendTelegramRequest("sendMessage", { 
                chat_id: chatId, 
                text: msg, 
                parse_mode: "Markdown", 
                reply_markup: kb 
            });
            console.log("Success!");
        }
    } catch (err) {
        console.error("Failed:", err);
    }
}

test(6241860023);
