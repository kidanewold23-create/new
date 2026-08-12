const text = await Deno.readTextFile('supabase/functions/api/index.ts');
let newText = text;

newText = newText.replace(
  /const \{ data: reg \} = await supabase\.from\("registrations"\)\.select\("\*"\)\.eq\("chat_id", chatId\)\.order\("created_at", \{ ascending: false \}\)\.limit\(1\)\.maybeSingle\(\);\s+const \[lang\] = getLangAndStep\(reg\);/,
  'const { data: reg2 } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();\n      const [lang2] = getLangAndStep(reg2);'
);

newText = newText.replace(
  /const msDiff = reg \? \(Date\.now\(\) - new Date\(reg\.created_at\)\.getTime\(\)\) : 0;\s+const daysSinceReg = reg \? \(isTest1Min \? Math\.floor\(msDiff \/ \(60 \* 1000\)\) \+ 1 : Math\.floor\(msDiff \/ \(24 \* 3600 \* 1000\)\) \+ 1\) : 1;/,
  'const msDiff = reg2 ? (Date.now() - new Date(reg2.created_at).getTime()) : 0;\n      const daysSinceReg = reg2 ? (isTest1Min ? Math.floor(msDiff / (60 * 1000)) + 1 : Math.floor(msDiff / (24 * 3600 * 1000)) + 1) : 1;'
);

newText = newText.replace(
  /const \[lang\] = getLangAndStep\(reg\);\s+const msg = getMsg\(lang, "day_completed_msg"\)/,
  'const [lang2] = getLangAndStep(reg2);\n        const msg = getMsg(lang2, "day_completed_msg")'
);

newText = newText.replace(
  /const \{ data: reg \} = await supabase\.from\("registrations"\)\.select\("\*"\)\.eq\("chat_id", chatId\)\.maybeSingle\(\);\s+const \[lang\] = getLangAndStep\(reg\);/,
  'const { data: reg3 } = await supabase.from("registrations").select("*").eq("chat_id", chatId).maybeSingle();\n  const [lang3] = getLangAndStep(reg3);'
);

newText = newText.replace(
  /if \(lang === "am"\) \{/,
  'if (lang3 === "am") {'
);

await Deno.writeTextFile('supabase/functions/api/index.ts', newText);
console.log("Done");
