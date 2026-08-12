const fs = require('fs');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

async function pushChanges() {
    const dir = __dirname;
    try {
        await git.add({ fs, dir, filepath: 'api/db.js' });
        await git.commit({
            fs,
            dir,
            author: {
                name: 'Antigravity',
                email: 'antigravity@gemini.com',
            },
            message: 'Fix registration approval when expires_at column is missing in DB'
        });
        
        await git.push({
            fs,
            http,
            dir,
            remote: 'origin',
            ref: 'main', // assuming default branch is main
            onAuth: () => ({
                // If it needs auth, we might have an issue, but let's hope git credential manager or PAT is there, or not needed.
            }),
        });
        console.log("Successfully pushed changes.");
    } catch (e) {
        console.error("Git push failed:", e);
    }
}

pushChanges();
