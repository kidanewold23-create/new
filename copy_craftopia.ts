const craftopiaText = await Deno.readTextFile('C:/Users/Administrator/Desktop/Projects/craftopia/supabase/functions/api/index.ts');
const yonatanText = await Deno.readTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts');

const cStartGen = craftopiaText.indexOf('async function generateCertificatePdf(name: string, regDate: string, finishDate: string');
const cEndGen = craftopiaText.indexOf('async function checkAndApplyReferralReward');
if (cStartGen === -1 || cEndGen === -1) throw new Error("Could not find craftopia func");
const newFunc = craftopiaText.slice(cStartGen, cEndGen);

const yStartGen = yonatanText.indexOf('async function generateCertificatePdf(name: string, regDate: string, finishDate: string');
const yEndGen = yonatanText.indexOf('async function checkAndApplyReferralReward');
if (yStartGen === -1 || yEndGen === -1) throw new Error("Could not find yonatan func bounds");

let newContent = yonatanText.slice(0, yStartGen) + newFunc + yonatanText.slice(yEndGen);

await Deno.writeTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', newContent);
console.log("Done");
