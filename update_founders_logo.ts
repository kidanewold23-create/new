import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const logoBytes = Deno.readFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/IMG_0892.PNG');
const base64 = encode(logoBytes);

let assetsContent = await Deno.readTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/assets.ts');

// Replace logoBase64 with the Founders Academy logo base64
if (assetsContent.includes('export const logoBase64 =')) {
  assetsContent = assetsContent.replace(/export const logoBase64 = "[^"]+";/, `export const logoBase64 = "data:image/png;base64,${base64}";`);
} else {
  assetsContent += `\nexport const logoBase64 = "data:image/png;base64,${base64}";\n`;
}

await Deno.writeTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/assets.ts', assetsContent);
console.log("Founders Academy Logo successfully set in assets.ts");
