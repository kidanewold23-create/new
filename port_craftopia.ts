const text = await Deno.readTextFile('supabase/functions/api/index.ts');

const newFunc = `async function generateCertificatePdf(name: string, regDate: string, finishDate: string, name2?: string): Promise<Uint8Array> {
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

  return new Promise((resolve) => {
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

    // Helper: auto-pick font based on whether text has Ethiopic chars
    const hasEthiopic = (text: string) => /[\\u1200-\\u137F]/.test(text || "");
    const ethFont  = (bold: boolean) => bold ? "Ethiopic-Bold" : "Ethiopic";
    const latFont  = (bold: boolean) => bold ? "Helvetica-Bold" : "Helvetica";
    const autoFont = (text: string, bold = false) => hasEthiopic(text) ? ethFont(bold) : latFont(bold);

    doc.registerFont("Ethiopic",      fontRegularBytes);
    doc.registerFont("Ethiopic-Bold", fontBoldBytes);

    // ── SECTION 2: Header and Logo (Side-by-Side) ──────────────────────────
    // Logo Emblem (Centred at 110, 95)
    const logoX = 110, logoY = 95;
    // Spark above green emblem
    doc.circle(logoX, logoY - 30, 4.5).fillColor(pureGold).fill();
    // Forest Green stylized glyph
    doc.circle(logoX, logoY, 19.5).fillColor(forestGreen).fill();
    doc.circle(logoX, logoY, 13.5).fillColor("#ffffff").fill();
    doc.circle(logoX, logoY, 6).fillColor(forestGreen).fill();

    // 1. Institution Name (Amharic)
    doc.fillColor(forestGreen).font(ethFont(true)).fontSize(31)
       .text("ፋውንደርስ አካዳሚ", 150, 30, { align: "center", width: 630 });

    // 3. Institution Name (English)
    doc.fillColor(forestGreen).font(latFont(true)).fontSize(25)
       .text("FOUNDERS ACADEMY", 150, 65, { align: "center", width: 630 });

    // 4. Certificate Title (Amharic)
    doc.fillColor(forestGreen).font(ethFont(true)).fontSize(24)
       .text("የአጭር ጊዜ ስልጠና የምስክር ወረቀት", 150, 95, { align: "center", width: 630 });

    // 5. Certificate Title (English)
    doc.fillColor(forestGreen).font(latFont(true)).fontSize(21)
       .text("CERTIFICATE OF SHORT TERM TRAINING", 150, 125, { align: "center", width: 630 });

    // ── Divider Lines (Double vertical lines in gold) ──────────────────────
    doc.lineWidth(1).strokeColor(antiqueGold);
    doc.moveTo(417.5, 192).lineTo(417.5, 435).stroke();
    doc.lineWidth(2).strokeColor(antiqueGold);
    doc.moveTo(421.5, 192).lineTo(421.5, 435).stroke();

    // Settings variables
    const programAm  = settings.cert_program_am  || "የ ቴሌግራም ቦት ክሬሽን ሙያ ስልጠና";
    const programEn  = settings.cert_program_en  || "TELEGRAM BOT CREATION";
    const durationAm = settings.cert_duration_am || "6";
    const durationEn = settings.cert_duration_en || "6";

    // ── SECTION 3: Main Body Text (Left-Side Column) ──────────────────────
    const lx = 65, lw = 320;
    // Line 1: ለ ________ (Name)
    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ለ", lx + 20, 212);
    doc.fillColor(forestGreen).font(autoFont(name, true)).fontSize(13)
       .text(name, lx + 40, 208, { width: lw - 40, align: "center" });
    doc.moveTo(lx + 35, 224).lineTo(lx + lw, 224).strokeColor(forestGreen).lineWidth(1).stroke();

    // Line 2: በፋውንደርስ አካዳሚ _____
    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("በፋውንደርስ አካዳሚ", lx, 246);
    doc.moveTo(lx + 215, 258).lineTo(lx + lw, 258).strokeColor(forestGreen).lineWidth(1).stroke();
    doc.fillColor(forestGreen).font(autoFont(durationAm, true)).fontSize(11)
       .text(durationAm, lx + 215, 244, { width: lw - 215, align: "center" });

    // Line 3: ሳምንት ለተሰጠው የ _____
    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ሳምንት ለተሰጠው የ", lx, 281);
    doc.moveTo(lx + 105, 293).lineTo(lx + lw, 293).strokeColor(forestGreen).lineWidth(1).stroke();
    doc.fillColor(forestGreen).font(autoFont(programAm, true)).fontSize(11)
       .text(programAm, lx + 105, 279, { width: lw - 105, align: "center" });

    // Line 4: ሙያ ስልጠና ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት ተሰጥቷቸዋል፡፡
    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11)
       .text("ሙያ ስልጠና ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት ተሰጥቷቸዋል፡፡", lx, 316, { width: lw, align: "justify", lineGap: 6 });

    // ── SECTION 4: Main Body Text (Right-Side Column) ─────────────────────
    const rx = 455, rw = 320;
    // Line 1: To ________ (Name)
    doc.fillColor(forestGreen).font(latFont(false)).fontSize(12).text("To", rx, 212);
    doc.fillColor(forestGreen).font(autoFont(actualName2, true)).fontSize(13)
       .text(actualName2, rx + 25, 208, { width: rw - 25, align: "center" });
    doc.moveTo(rx + 20, 224).lineTo(rx + rw, 224).strokeColor(forestGreen).lineWidth(1).stroke();

    // Line 2 & 3: THIS CERTIFICATE IS PROUDLY PRESENTED FOR / SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING
    doc.fillColor(forestGreen).font(latFont(false)).fontSize(10.5)
       .text("THIS CERTIFICATE IS PROUDLY PRESENTED FOR", rx, 246);
    doc.text("SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING", rx, 268);

    // Line 4: PROGRAM IN _______
    doc.text("PROGRAM IN", rx, 290);
    doc.moveTo(rx + 75, 302).lineTo(rx + rw, 302).strokeColor(forestGreen).lineWidth(1).stroke();
    doc.fillColor(forestGreen).font(autoFont(programEn, true)).fontSize(10.5)
       .text(programEn.toUpperCase(), rx + 75, 288, { width: rw - 75, align: "center" });

    // Line 5: AT FOUNDERS ACADEMY.
    doc.fillColor(forestGreen).font(latFont(false)).fontSize(10.5).text("AT FOUNDERS ACADEMY.", rx, 314);

    // Line 6: THE TRAINING WAS CONDUCTED FOR _____ WEEK.
    doc.text("THE TRAINING WAS CONDUCTED FOR", rx, 336);
    doc.moveTo(rx + 195, 348).lineTo(rx + 270, 348).strokeColor(forestGreen).lineWidth(1).stroke();
    doc.fillColor(forestGreen).font(autoFont(durationEn, true)).fontSize(10.5)
       .text(durationEn, rx + 195, 334, { width: 75, align: "center" });
    doc.fillColor(forestGreen).font(latFont(false)).text("WEEK.", rx + 275, 336);

    // ── SECTION 5: Signature and Date Fields ──────────────────────────────
    // Left Side (Amharic Footer)
    // Small gold circular/abstract sigil or symbol positioned to the left of "ቀን"
    doc.circle(lx + 10, 467, 3).fillColor(antiqueGold).fill();
    doc.circle(lx + 10, 467, 1.5).fillColor("#ffffff").fill();
    
    // "ቀን:" label
    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ቀን:", lx + 22, 461);
    
    // Gold dashed line for Ethiopian Date
    doc.save();
    doc.strokeColor(antiqueGold).lineWidth(1).dash(3, { space: 3 });
    doc.moveTo(lx + 50, 473).lineTo(lx + 200, 473).stroke();
    doc.restore();
    
    // "ዓ.ም" label
    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ዓ.ም", lx + 205, 461);
    // Dynamic Date value
    const ethFinishDate = gregorianToEthiopianString(finishDate);
    doc.fillColor(forestGreen).font(autoFont(ethFinishDate, true)).fontSize(11)
       .text(ethFinishDate, lx + 50, 458, { width: 150, align: "center" });

    // Right Side (English Footer)
    // A small gold decorative sigil matching the stylized "spark" from the logo in the center
    const sigilX = rx + 160, sigilY = 405;
    doc.save();
    doc.translate(sigilX, sigilY);
    doc.moveTo(0, -6).lineTo(2, -2).lineTo(6, -2).lineTo(3, 1).lineTo(5, 5).lineTo(0, 2).lineTo(-5, 5).lineTo(-3, 1).lineTo(-6, -2).lineTo(-2, -2).closePath().fillColor(antiqueGold).fill();
    doc.restore();

    // SIGNED line
    doc.fillColor(forestGreen).font(latFont(true)).fontSize(9).text("SIGNED:", rx, 461);
    doc.moveTo(rx + 45, 473).lineTo(rx + 180, 473).strokeColor(forestGreen).lineWidth(1).stroke();
    if (settings.signature_base64) {
      try {
        const b64 = settings.signature_base64.split(",")[1];
        const sigBuf = Buffer.from(b64, "base64");
        doc.image(sigBuf, rx + 50, 422, { fit: [120, 45] });
      } catch (sigErr: any) {
        console.error("Error drawing signature on PDF in Deno:", sigErr.message);
      }
    }

    if (settings.seal_base64) {
      try {
        const b64 = settings.seal_base64.split(",")[1];
        const sealBuf = Buffer.from(b64, "base64");
        doc.image(sealBuf, rx - 25, 320, { fit: [270, 270] });
      } catch (sealErr: any) {
        console.error("Error drawing seal on PDF in Deno:", sealErr.message);
      }
    }

    // DATE line
    doc.fillColor(forestGreen).font(latFont(true)).fontSize(9).text("DATE:", rx + 195, 461);
    doc.moveTo(rx + 228, 473).lineTo(rx + rw, 473).strokeColor(forestGreen).lineWidth(1).stroke();
    doc.fillColor(forestGreen).font(autoFont(finishDate, true)).fontSize(9)
       .text(finishDate, rx + 228, 459, { width: rw - 228, align: "center" });

    doc.end();
  });
}
`;

// Insert the import at the top
let newContent = text.replace(
  'import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";',
  'import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";\nimport PDFDocument from "npm:pdfkit@0.13.0";'
);

// Remove the pdf-lib imports that we don't need
newContent = newContent.replace("import { PDFDocument, rgb } from 'https://esm.sh/pdf-lib@1.17.1';", "");
newContent = newContent.replace("import * as fontkitLib from 'https://esm.sh/@pdf-lib/fontkit@1.1.1';", "");
newContent = newContent.replace("const fontkit = (fontkitLib as any).default || fontkitLib;", "");

// Replace the entire block
const startGen = newContent.indexOf('async function generateCertificatePdf(name: string, regDate: string, finishDate: string');
const endGen = newContent.indexOf('async function checkAndApplyReferralReward');
if (startGen > -1 && endGen > -1) {
  newContent = newContent.slice(0, startGen) + newFunc + newContent.slice(endGen);
} else {
  console.log("Failed to find start/end bounds.");
}

await Deno.writeTextFile('supabase/functions/api/index.ts', newContent);
console.log("Done");
