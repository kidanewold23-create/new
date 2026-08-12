import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const borderBytes = Deno.readFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/certificate_border.jpg');
const base64 = encode(borderBytes);

let assetsContent = await Deno.readTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/assets.ts');
if (!assetsContent.includes('borderBase64')) {
  assetsContent += "\nexport const borderBase64 = \"" + base64 + "\";\n";
  await Deno.writeTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/assets.ts', assetsContent);
}

let indexContent = await Deno.readTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts');

if (!indexContent.includes('borderBase64')) {
  indexContent = indexContent.replace(
    'import { Buffer }', 
    'import { borderBase64 } from "./assets.ts";\nimport { Buffer }'
  );
}

indexContent = indexContent.replace(
  'const bgBytes = await Deno.readFile(new URL("./certificate_border.jpg", import.meta.url));',
  'const bgBytes = Buffer.from(borderBase64, "base64");'
);

await Deno.writeTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', indexContent);
console.log("Done");


