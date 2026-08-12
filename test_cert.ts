import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import PDFDocument from "npm:pdfkit@0.13.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yrelqbvkxwdkzaraydfz.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_KEY") || "sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedFontRegular: Uint8Array | null = null;
let cachedFontBold: Uint8Array | null = null;

async function getFontRegular(): Promise<Uint8Array> {
  if (cachedFontRegular) return cachedFontRegular;
  const res = await fetch("https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansEthiopic/NotoSansEthiopic-Regular.ttf");
  cachedFontRegular = new Uint8Array(await res.arrayBuffer());
  return cachedFontRegular;
}

async function getFontBold(): Promise<Uint8Array> {
  if (cachedFontBold) return cachedFontBold;
  const res = await fetch("https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansEthiopic/NotoSansEthiopic-Bold.ttf");
  cachedFontBold = new Uint8Array(await res.arrayBuffer());
  return cachedFontBold;
}

function gregorianToEthiopianString(gregDateStr: string): string {
  if (!gregDateStr) return "";
  try {
    const parts = gregDateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    const r = (jdn - 1723856) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);
    
    const ethYear = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
    const ethMonth = Math.floor(n / 30) + 1;
    const ethDay = (n % 30) + 1;
    
    return \`\${ethDay}/\${ethMonth}/\${ethYear}\`;
  } catch (_e) {
    return gregDateStr;
  }
}

async function generateCertificatePdf(name: string, regDate: string, finishDate: string, name2?: string): Promise<Uint8Array> {
  const actualName2 = name2 || name;
  let settings: any = {};
  try {
    const { data: adminRec } = await supabase
      .from("admins")
      .select("verification_code")
      .eq("username", "payment_settings")
      .maybeSingle();
    if (adminRec && adminRec.verification_code) {
      settings = JSON.parse(adminRec.verification_code);
    }
  } catch (err: any) {
    console.error("Deno cert fetch settings failed:", err.message);
  }

  const fontRegularBytes = await getFontRegular();
  const fontBoldBytes = await getFontBold();
  const bgBytes = await Deno.readFile(new URL("./supabase/functions/api/certificate_border.jpg", import.meta.url));

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
      const chunks: any[] = [];
      doc.on("data", (chunk: any) => chunks.push(chunk));
      doc.on("end", () => {
        const result = new Uint8Array(Buffer.concat(chunks));
        resolve(result);
      });

      const forestGreen = "#228B22";
      const antiqueGold = "#C5A032";
      const pureGold    = "#FFD700";

      const hasEthiopic = (text: string) => /[\\u1200-\\u137F]/.test(text || "");
      const ethFont  = (bold: boolean) => bold ? "Ethiopic-Bold" : "Ethiopic";
      const latFont  = (bold: boolean) => bold ? "Helvetica-Bold" : "Helvetica";
      const autoFont = (text: string, bold = false) => hasEthiopic(text) ? ethFont(bold) : latFont(bold);

      doc.registerFont("Ethiopic",      fontRegularBytes);
      doc.registerFont("Ethiopic-Bold", fontBoldBytes);

      doc.image(bgBytes, 0, 0, { width: 841.89, height: 595.28 });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function test() {
  try {
    const pdf = await generateCertificatePdf("Yonatan Test", "2023-01-01", "2023-01-01");
    console.log("Success! PDF generated. Length:", pdf.length);
  } catch (err) {
    console.error("Error generating PDF:", err);
  }
}
test();
