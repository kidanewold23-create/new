const text = await Deno.readTextFile('supabase/functions/api/index.ts');
const lines = text.split('\n');

let insideSendNextQuizQuestion = false;
let regDeclCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function sendNextQuizQuestion(')) {
    insideSendNextQuizQuestion = true;
  }
  
  if (insideSendNextQuizQuestion && lines[i].startsWith('}')) {
    insideSendNextQuizQuestion = false;
  }

  if (insideSendNextQuizQuestion) {
    if (lines[i].includes('const { data: reg } = ')) {
      regDeclCount++;
      if (regDeclCount === 2) {
        lines[i] = lines[i].replace('const { data: reg } = ', 'const { data: regB } = ');
      } else if (regDeclCount === 3) {
        lines[i] = lines[i].replace('const { data: reg } = ', 'const { data: regC } = ');
      }
    }
    
    if (lines[i].includes('const [lang] = getLangAndStep(reg);')) {
      if (regDeclCount === 2) {
        lines[i] = lines[i].replace('const [lang] = getLangAndStep(reg);', 'const [langB] = getLangAndStep(regB);');
      } else if (regDeclCount === 3) {
        lines[i] = lines[i].replace('const [lang] = getLangAndStep(reg);', 'const [langC] = getLangAndStep(regC);');
      }
    }

    if (regDeclCount === 2) {
      lines[i] = lines[i].replace(/reg\?/g, 'regB?');
      lines[i] = lines[i].replace(/reg\./g, 'regB.');
      lines[i] = lines[i].replace('getMsg(lang,', 'getMsg(langB,');
    }

    if (regDeclCount === 3) {
      lines[i] = lines[i].replace(/lang ===/g, 'langC ===');
    }
  }
}

await Deno.writeTextFile('supabase/functions/api/index.ts', lines.join('\n'));
console.log("Done");
