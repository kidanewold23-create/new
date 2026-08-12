const text = await Deno.readTextFile('supabase/functions/api/index.ts');
let newText = text;

// Fix 1
newText = newText.replace(
  'const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();\n      const msDiff = reg ? (Date.now() - new Date(reg.created_at).getTime()) : 0;\n      const daysSinceReg = reg ? (isTest1Min ? Math.floor(msDiff / (60 * 1000)) + 1 : Math.floor(msDiff / (24 * 3600 * 1000)) + 1) : 1;',
  'const { data: reg2 } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();\n      const msDiff = reg2 ? (Date.now() - new Date(reg2.created_at).getTime()) : 0;\n      const daysSinceReg = reg2 ? (isTest1Min ? Math.floor(msDiff / (60 * 1000)) + 1 : Math.floor(msDiff / (24 * 3600 * 1000)) + 1) : 1;'
);

// Fix 2
newText = newText.replace(
  'const [lang] = getLangAndStep(reg);\n        const msg = getMsg(lang, "day_completed_msg").replace("{day}", String(day));',
  'const [lang2] = getLangAndStep(reg2);\n        const msg = getMsg(lang2, "day_completed_msg").replace("{day}", String(day));'
);

// Fix 3
newText = newText.replace(
  '  const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).maybeSingle();\n  const [lang] = getLangAndStep(reg);\n\n  let msg = `🎓 **Day ${day} - Question ${qIndex + 1}/${questions.length}**\\n\\n`;\n  if (qIndex === 0) {\n    if (lang === "am") {',
  '  const { data: reg3 } = await supabase.from("registrations").select("*").eq("chat_id", chatId).maybeSingle();\n  const [lang3] = getLangAndStep(reg3);\n\n  let msg = `🎓 **Day ${day} - Question ${qIndex + 1}/${questions.length}**\\n\\n`;\n  if (qIndex === 0) {\n    if (lang3 === "am") {'
);

await Deno.writeTextFile('supabase/functions/api/index.ts', newText);
console.log("Done");
