import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";

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
  // The actual code to fetch from DB will be preserved from the existing index.ts context
  // This script will just define the generation logic as a string to inject

  const fontRegularBytes = await getFontRegular();
  const fontBoldBytes = await getFontBold();
  
  // We will dynamically import assets.ts from the real file
  // const { logoBase64 } = await import('./assets.ts');

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  const customFont = await pdfDoc.embedFont(fontRegularBytes);
  const customFontBold = await pdfDoc.embedFont(fontBoldBytes);
  
  const page = pdfDoc.addPage([1050, 740]);
  const { width, height } = page.getSize();

  const darkGreen = rgb(0/255, 90/255, 54/255);
  const forestGreen = rgb(0/255, 135/255, 81/255);
  const antiqueGold = rgb(229/255, 184/255, 66/255);
  const darkGold = rgb(204/255, 156/255, 37/255);
  const white = rgb(1, 1, 1);

  page.drawRectangle({ x: 0, y: 0, width, height, color: white });

  // Gold Borders
  page.drawRectangle({ x: 115, y: height - 50, width: width - 230, height: 16, color: antiqueGold });
  page.drawRectangle({ x: 115, y: 34, width: width - 230, height: 16, color: antiqueGold });
  page.drawRectangle({ x: 45, y: 115, width: 16, height: height - 230, color: antiqueGold });
  page.drawRectangle({ x: width - 61, y: 115, width: 16, height: height - 230, color: antiqueGold });

  const drawCorner = (cx: number, cy: number) => {
    page.drawCircle({ x: cx, y: cy, size: 55, color: white, borderColor: darkGold, borderWidth: 3 });
    page.drawText("✿", { x: cx - 18, y: cy - 13, font: customFontBold, size: 48, color: darkGold });
  };
  drawCorner(85, height - 85);
  drawCorner(width - 85, height - 85);
  drawCorner(85, 85);
  drawCorner(width - 85, 85);

  // We assume logoBase64 is available
  try {
    const { logoBase64 } = await import('./assets.ts');
    const logoImage = logoBase64.startsWith('/') || logoBase64.startsWith('iVB') ? await pdfDoc.embedPng(logoBase64) : await pdfDoc.embedJpg(logoBase64);
    page.drawImage(logoImage, { x: width / 2 - 82, y: height - 195, width: 165, height: 165 });
  } catch (e) { console.error("Failed to embed logo:", e); }

  const centerText = (txt: string, size: number, y: number, font: any, color: any) => {
    const textWidth = font.widthOfTextAtSize(txt, size);
    page.drawText(txt, { x: width / 2 - textWidth / 2, y, font, size, color });
  };

  let cy = height - 230;
  centerText("ክራፍቶፒያ የእደጥበብ ሙያዎች ማሰልጠኛ ተቋም", 35, cy, customFontBold, forestGreen);
  cy -= 35;
  centerText("CRAFTOPIA HANDCRAFTS SCHOOL", 24, cy, customFontBold, darkGreen);
  cy -= 45;
  centerText("የአጭር ጊዜ ስልጠና የምስክር ወረቀት", 33, cy, customFontBold, forestGreen);
  cy -= 30;
  centerText("CERTIFICATE OF SHORT TERM TRAINING", 22, cy, customFontBold, darkGreen);

  cy -= 70;

  // Middle Pillar
  page.drawLine({ start: { x: width/2 - 4, y: cy + 10 }, end: { x: width/2 - 4, y: cy - 160 }, thickness: 1.5, color: darkGreen });
  page.drawLine({ start: { x: width/2, y: cy + 20 }, end: { x: width/2, y: cy - 170 }, thickness: 1.5, color: darkGreen });
  page.drawLine({ start: { x: width/2 + 4, y: cy + 10 }, end: { x: width/2 + 4, y: cy - 160 }, thickness: 1.5, color: darkGreen });

  const leftX = 110;
  const lxEnd = width/2 - 60;
  page.drawText("ለ", { x: leftX, y: cy, font: customFontBold, size: 21, color: darkGreen });
  page.drawLine({ start: { x: leftX + 25, y: cy }, end: { x: lxEnd, y: cy }, thickness: 1, color: darkGreen });
  
  const nameAmh = name;
  const nameAmhWidth = customFontBold.widthOfTextAtSize(nameAmh, 18);
  page.drawText(nameAmh, { x: leftX + 25 + (lxEnd - leftX - 25)/2 - nameAmhWidth/2, y: cy + 2, font: customFontBold, size: 18, color: darkGreen });

  cy -= 40;
  const drawColText = (txt: string, y: number, startX: number, endX: number, size: number) => {
    const tw = customFontBold.widthOfTextAtSize(txt, size);
    page.drawText(txt, { x: startX + (endX - startX)/2 - tw/2, y, font: customFontBold, size, color: darkGreen });
  };
  
  drawColText("በክራፍቶፒያ የእደጥበብ ማሰልጠኛ ተቋም", cy, leftX, lxEnd, 14);
  cy -= 30;
  drawColText("በአጭር ጊዜ ስልጠና ፕሮግራም ለ 1 ሳምንት", cy, leftX, lxEnd, 14);
  cy -= 30;
  drawColText("የተሰጠውን የ ኢፖክሲ ሙያ ስልጠና", cy, leftX, lxEnd, 14);
  cy -= 30;
  drawColText("ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት", cy, leftX, lxEnd, 14);
  cy -= 30;
  drawColText("ተሰጥቷቸዋል::", cy, leftX, lxEnd, 14);

  const rightX = width/2 + 60;
  const rxEnd = width - 110;
  let ry = height - 230 - 35 - 45 - 30 - 70;
  page.drawText("To", { x: rightX, y: ry, font: customFontBold, size: 21, color: darkGreen });
  page.drawLine({ start: { x: rightX + 35, y: ry }, end: { x: rxEnd, y: ry }, thickness: 1, color: darkGreen });
  
  const nameEng = actualName2;
  const nameEngWidth = customFontBold.widthOfTextAtSize(nameEng, 18);
  page.drawText(nameEng, { x: rightX + 35 + (rxEnd - rightX - 35)/2 - nameEngWidth/2, y: ry + 2, font: customFontBold, size: 18, color: darkGreen });

  ry -= 40;
  drawColText("THIS CERTIFICATE IS PROUDLY PRESENTED FOR", ry, rightX, rxEnd, 11);
  ry -= 30;
  drawColText("SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING", ry, rightX, rxEnd, 11);
  ry -= 30;
  drawColText("PROGRAM IN EPOXY AT CRAFTOPIA.", ry, rightX, rxEnd, 11);
  ry -= 30;
  drawColText("THE TRAINING WAS CONDUCTED FOR 1 WEEK.", ry, rightX, rxEnd, 11);

  let fy = 90;
  page.drawText("ቀን", { x: leftX, y: fy, font: customFontBold, size: 13.5, color: darkGreen });
  page.drawLine({ start: { x: leftX + 30, y: fy }, end: { x: leftX + 160, y: fy }, thickness: 1.5, color: darkGreen });
  page.drawText("ዓ.ም", { x: leftX + 170, y: fy, font: customFontBold, size: 13.5, color: darkGreen });
  const ethDate = gregorianToEthiopianString(finishDate);
  const ethDateW = customFontBold.widthOfTextAtSize(ethDate, 12);
  page.drawText(ethDate, { x: leftX + 30 + 65 - ethDateW/2, y: fy + 3, font: customFontBold, size: 12, color: darkGreen });

  page.drawText("DATE:", { x: rxEnd - 180, y: fy, font: customFontBold, size: 11.5, color: darkGreen });
  page.drawLine({ start: { x: rxEnd - 130, y: fy }, end: { x: rxEnd, y: fy }, thickness: 1.5, color: darkGreen });
  const fDateW = customFontBold.widthOfTextAtSize(finishDate, 12);
  page.drawText(finishDate, { x: rxEnd - 130 + 65 - fDateW/2, y: fy + 3, font: customFontBold, size: 12, color: darkGreen });

  page.drawText("SIGNED:", { x: width/2 - 80, y: fy, font: customFontBold, size: 12, color: darkGreen });
  page.drawLine({ start: { x: width/2 - 20, y: fy }, end: { x: width/2 + 100, y: fy }, thickness: 1.5, color: darkGreen });

  if (settings.signature_base64) {
    try {
      const b64 = settings.signature_base64.split(",")[1];
      const sigBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const sigImg = settings.signature_base64.includes("png") ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
      page.drawImage(sigImg, { x: width/2 - 15, y: fy + 5, width: 110, height: 40 });
    } catch (e: any) { console.error("Failed to embed sig:", e); }
  }

  if (settings.seal_base64) {
    try {
      const b64 = settings.seal_base64.split(",")[1];
      const sealBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const sealImg = settings.seal_base64.includes("png") ? await pdfDoc.embedPng(sealBytes) : await pdfDoc.embedJpg(sealBytes);
      page.drawImage(sealImg, { x: width/2 - 110, y: fy - 40, width: 220, height: 220 });
    } catch (e: any) { console.error("Failed to embed seal:", e); }
  }

  return await pdfDoc.save();
}
