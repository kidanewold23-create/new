const generatePdfkitCode = \`
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
  const { logoBase64 } = await import('./assets.ts');

  return new Promise((resolve) => {
    // 1050x740 size based on the HTML template
    const doc = new PDFDocument({ layout: "landscape", size: [1050, 740], margin: 0 });
    const chunks: any[] = [];
    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => {
      const result = new Uint8Array(Buffer.concat(chunks));
      resolve(result);
    });

    const forestGreen = "#008751";
    const darkGreen = "#005a36";

    // Helper: auto-pick font based on whether text has Ethiopic chars
    const hasEthiopic = (text: string) => /[\\u1200-\\u137F]/.test(text || "");
    const ethFont  = (bold: boolean) => bold ? "Ethiopic-Bold" : "Ethiopic";
    const latFont  = (bold: boolean) => bold ? "Helvetica-Bold" : "Helvetica";
    const autoFont = (text: string, bold = false) => hasEthiopic(text) ? ethFont(bold) : latFont(bold);

    doc.registerFont("Ethiopic",      fontRegularBytes);
    doc.registerFont("Ethiopic-Bold", fontBoldBytes);

    // NO BORDERS ARE DRAWN HERE AS REQUESTED.

    // Logo
    try {
      if (logoBase64) {
        const logoB64Data = logoBase64.split(",")[1] || logoBase64;
        const logoBuf = Buffer.from(logoB64Data, "base64");
        // Logo centered at top
        doc.image(logoBuf, 525 - 82, 35, { fit: [165, 165], align: "center" });
      }
    } catch (e) { console.error("Error drawing logo:", e); }

    // Titles
    let cy = 205;
    doc.fillColor(forestGreen).font(ethFont(true)).fontSize(35).text("ክራፍቶፒያ የእደጥበብ ሙያዎች ማሰልጠኛ ተቋም", 0, cy, { align: "center", width: 1050 });
    cy += 45;
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(24).text("CRAFTOPIA HANDCRAFTS SCHOOL", 0, cy, { align: "center", width: 1050 });
    cy += 35;
    doc.fillColor(forestGreen).font(ethFont(true)).fontSize(33).text("የአጭር ጊዜ ስልጠና የምስክር ወረቀት", 0, cy, { align: "center", width: 1050 });
    cy += 40;
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(22).text("CERTIFICATE OF SHORT TERM TRAINING", 0, cy, { align: "center", width: 1050 });

    cy += 70; // 395

    // Triple Pillar Divider
    doc.lineWidth(1.5).strokeColor(darkGreen);
    doc.moveTo(525 - 4, cy).lineTo(525 - 4, cy + 180).stroke();
    doc.lineWidth(1.5).strokeColor(darkGreen);
    doc.moveTo(525, cy - 10).lineTo(525, cy + 190).stroke();
    doc.lineWidth(1.5).strokeColor(darkGreen);
    doc.moveTo(525 + 4, cy).lineTo(525 + 4, cy + 180).stroke();

    // LEFT COLUMN (Amharic)
    const leftX = 85;
    const leftW = 400;
    
    // ለ _____
    doc.fillColor(darkGreen).font(ethFont(true)).fontSize(21).text("ለ", leftX, cy);
    const nameWidth = doc.font(ethFont(true)).fontSize(16).widthOfString(name);
    doc.text(name, leftX + 40 + (360/2) - (nameWidth/2), cy + 4);
    doc.lineWidth(1).moveTo(leftX + 30, cy + 22).lineTo(leftX + leftW, cy + 22).stroke();

    let lcy = cy + 45;
    const amhLine = (txt: string) => {
      doc.fillColor(darkGreen).font(ethFont(true)).fontSize(14).text(txt, leftX, lcy, { width: leftW, align: "center", lineGap: 10 });
      lcy += 32;
    };
    amhLine("በክራፍቶፒያ የእደጥበብ ማሰልጠኛ ተቋም");
    amhLine("በአጭር ጊዜ ስልጠና ፕሮግራም ለ 1 ሳምንት");
    amhLine("የተሰጠውን የ ኢፖክሲ ሙያ ስልጠና");
    amhLine("ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት");
    amhLine("ተሰጥቷቸዋል::");


    // RIGHT COLUMN (English)
    const rightX = 565;
    const rightW = 400;
    
    // To _____
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(21).text("To", rightX, cy);
    const name2Width = doc.font(latFont(true)).fontSize(16).widthOfString(actualName2);
    doc.text(actualName2, rightX + 40 + (360/2) - (name2Width/2), cy + 4);
    doc.lineWidth(1).moveTo(rightX + 40, cy + 22).lineTo(rightX + rightW, cy + 22).stroke();

    let rcy = cy + 45;
    const engLine = (txt: string) => {
      doc.fillColor(darkGreen).font(latFont(true)).fontSize(11).text(txt, rightX, rcy, { width: rightW, align: "center", lineGap: 10 });
      rcy += 32;
    };
    engLine("THIS CERTIFICATE IS PROUDLY PRESENTED FOR");
    engLine("SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING");
    engLine("PROGRAM IN EPOXY AT CRAFTOPIA.");
    engLine("THE TRAINING WAS CONDUCTED FOR 1 WEEK.");


    // FOOTER
    let fy = 650;
    
    // Date Left
    doc.fillColor(darkGreen).font(ethFont(true)).fontSize(13.5).text("ቀን", leftX, fy);
    const ethDate = gregorianToEthiopianString(finishDate);
    const ethDateW = doc.font(ethFont(true)).fontSize(13).widthOfString(ethDate);
    doc.text(ethDate, leftX + 40 + (140/2) - (ethDateW/2), fy);
    doc.lineWidth(1.5).moveTo(leftX + 35, fy + 16).lineTo(leftX + 175, fy + 16).stroke();
    doc.font(ethFont(true)).fontSize(13.5).text("ዓ.ም", leftX + 185, fy);

    // Date Right
    doc.font(latFont(true)).fontSize(11.5).text("DATE:", rightX + 170, fy + 2);
    const fDateW = doc.font(latFont(true)).fontSize(12).widthOfString(finishDate);
    doc.text(finishDate, rightX + 220 + (180/2) - (fDateW/2), fy + 2);
    doc.lineWidth(1.5).moveTo(rightX + 220, fy + 16).lineTo(rightX + 400, fy + 16).stroke();

    // Signature Center
    doc.font(latFont(true)).fontSize(12).text("SIGNED:", 525 - 100, fy);
    doc.lineWidth(1.5).moveTo(525 - 30, fy + 14).lineTo(525 + 100, fy + 14).stroke();

    // Signature and Seal Images
    if (settings.signature_base64) {
      try {
        const b64 = settings.signature_base64.split(",")[1] || settings.signature_base64;
        const sigBuf = Buffer.from(b64, "base64");
        doc.image(sigBuf, 525 - 25, fy - 25, { fit: [110, 40] });
      } catch (e: any) { console.error("Failed to embed sig:", e.message); }
    }

    if (settings.seal_base64) {
      try {
        const b64 = settings.seal_base64.split(",")[1] || settings.seal_base64;
        const sealBuf = Buffer.from(b64, "base64");
        doc.image(sealBuf, 525 - 110, fy - 140, { fit: [220, 220] });
      } catch (e: any) { console.error("Failed to embed seal:", e.message); }
    }

    doc.end();
  });
}
\`;

let indexCode = await Deno.readTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts');

indexCode = indexCode.replace(/import \{ PDFDocument, rgb \} from "npm:pdf-lib\@1\.17\.1";\\r?\\n/, '');
indexCode = indexCode.replace(/import fontkit from "npm:\@pdf-lib\\/fontkit\@1\.1\.1";\\r?\\n/, '');

if (!indexCode.includes('import PDFDocument from "npm:pdfkit')) {
  indexCode = 'import PDFDocument from "npm:pdfkit@0.13.0";\\n' + indexCode;
}
if (!indexCode.includes('import { Buffer }')) {
  indexCode = 'import { Buffer } from "node:buffer";\\n' + indexCode;
}

const startStr = 'async function generateCertificatePdf(name: string, regDate: string, finishDate: string, name2?: string): Promise<Uint8Array> {';
const startIdx = indexCode.indexOf(startStr);
if (startIdx === -1) {
  console.error("Could not find start of generateCertificatePdf in index.ts");
  Deno.exit(1);
}

const endStr = 'async function checkAndApplyReferralReward';
const endIdx = indexCode.indexOf(endStr);
if (endIdx === -1) {
  console.error("Could not find end of generateCertificatePdf in index.ts");
  Deno.exit(1);
}

indexCode = indexCode.slice(0, startIdx) + generatePdfkitCode + "\\n\\n" + indexCode.slice(endIdx);

await Deno.writeTextFile('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', indexCode);
console.log("Done generating PDFKit script without borders");
