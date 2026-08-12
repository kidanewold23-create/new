const fs = require('fs');
const content = fs.readFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', 'utf8');

let newContent = content.replace(
  '.text("ክራፍቶፒያ የእደጥበብ ሙያዎች ማሰልጠኛ ተቋም", 150, 30, { align: "center", width: 630 });',
  '.text("ክራፍቶፒያ የእደጥበብ ሙያዎች ማሰልጠኛ ተቋም", 150, 45, { align: "center", width: 630 });'
);

newContent = newContent.replace(
  '.text("CRAFTOPIA HANDCRAFTS SCHOOL", 150, 65, { align: "center", width: 630 });',
  '.text("CRAFTOPIA HANDCRAFTS SCHOOL", 150, 85, { align: "center", width: 630 });'
);

newContent = newContent.replace(
  '.text("የአጭር ጊዜ ስልጠና የምስክር ወረቀት", 150, 95, { align: "center", width: 630 });',
  '.text("የአጭር ጊዜ ስልጠና የምስክር ወረቀት", 150, 130, { align: "center", width: 630 });'
);

newContent = newContent.replace(
  '.text("CERTIFICATE OF SHORT TERM TRAINING", 150, 125, { align: "center", width: 630 });',
  '.text("CERTIFICATE OF SHORT TERM TRAINING", 150, 165, { align: "center", width: 630 });'
);

// Remove the hardcoded border lines (they were in Craftopia's old PDF generation)
newContent = newContent.replace(
  '// ── Divider Lines (Double vertical lines in gold) ──────────────────────\n    doc.lineWidth(1).strokeColor(antiqueGold);\n    doc.moveTo(417.5, 192).lineTo(417.5, 435).stroke();\n    doc.lineWidth(2).strokeColor(antiqueGold);\n    doc.moveTo(421.5, 192).lineTo(421.5, 435).stroke();',
  '// No divider lines'
);
newContent = newContent.replace(
  '// ── Divider Lines (Double vertical lines in gold) ──────────────────────\r\n    doc.lineWidth(1).strokeColor(antiqueGold);\r\n    doc.moveTo(417.5, 192).lineTo(417.5, 435).stroke();\r\n    doc.lineWidth(2).strokeColor(antiqueGold);\r\n    doc.moveTo(421.5, 192).lineTo(421.5, 435).stroke();',
  '// No divider lines'
);


// Move the main body down slightly
newContent = newContent.replace(
  'const lx = 65, lw = 320;\n    // Line 1: ለ ________ (Name)\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ለ", lx + 20, 212);',
  'const lx = 65, lw = 320;\n    // Line 1: ለ ________ (Name)\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(16).text("ለ", lx - 30, 260);'
);
newContent = newContent.replace(
  'const lx = 65, lw = 320;\r\n    // Line 1: ለ ________ (Name)\r\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ለ", lx + 20, 212);',
  'const lx = 65, lw = 320;\n    // Line 1: ለ ________ (Name)\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(16).text("ለ", lx - 30, 260);'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(name, true)).fontSize(13)\n       .text(name, lx + 40, 208, { width: lw - 40, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(name, true)).fontSize(15)\n       .text(name, lx - 10, 260, { width: lw + 30, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(name, true)).fontSize(13)\r\n       .text(name, lx + 40, 208, { width: lw - 40, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(name, true)).fontSize(15)\n       .text(name, lx - 10, 260, { width: lw + 30, align: "center" });'
);

newContent = newContent.replace(
  'doc.moveTo(lx + 35, 224).lineTo(lx + lw, 224).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(lx - 10, 275).lineTo(lx + lw + 20, 275).strokeColor(forestGreen).lineWidth(1.5).stroke();'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("በክራፍቶፒያ የእደጥበብ ማሰልጠኛ ተቋም", lx, 246);',
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("በክራፍቶፒያ የእደጥበብ ማሰልጠኛ ተቋም", lx + 10, 305);'
);
newContent = newContent.replace(
  'doc.moveTo(lx + 215, 258).lineTo(lx + lw, 258).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(lx + 10, 355).lineTo(lx + 105, 355).strokeColor(forestGreen).lineWidth(1).stroke();'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(durationAm, true)).fontSize(11)\n       .text(durationAm, lx + 215, 244, { width: lw - 215, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(durationAm, true)).fontSize(12)\n       .text(durationAm, lx + 10, 340, { width: 95, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(durationAm, true)).fontSize(11)\r\n       .text(durationAm, lx + 215, 244, { width: lw - 215, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(durationAm, true)).fontSize(12)\n       .text(durationAm, lx + 10, 340, { width: 95, align: "center" });'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ሳምንት ለተሰጠው የ", lx, 281);',
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ሳምንት ለተሰጠው የ", lx + 115, 340);'
);
newContent = newContent.replace(
  'doc.moveTo(lx + 105, 293).lineTo(lx + lw, 293).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(lx - 20, 395).lineTo(lx + 150, 395).strokeColor(forestGreen).lineWidth(1).stroke();'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(programAm, true)).fontSize(11)\n       .text(programAm, lx + 105, 279, { width: lw - 105, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(programAm, true)).fontSize(13)\n       .text(programAm, lx - 20, 377, { width: 170, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(programAm, true)).fontSize(11)\r\n       .text(programAm, lx + 105, 279, { width: lw - 105, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(programAm, true)).fontSize(13)\n       .text(programAm, lx - 20, 377, { width: 170, align: "center" });'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11)\n       .text("ሙያ ስልጠና ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት ተሰጥቷቸዋል፡፡", lx, 316, { width: lw, align: "justify", lineGap: 6 });',
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ሙያ ስልጠና", lx + 160, 377);\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት", lx - 10, 415);\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ተሰጥቷቸዋል::", lx + 80, 455);'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11)\r\n       .text("ሙያ ስልጠና ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት ተሰጥቷቸዋል፡፡", lx, 316, { width: lw, align: "justify", lineGap: 6 });',
  'doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ሙያ ስልጠና", lx + 160, 377);\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት", lx - 10, 415);\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(12).text("ተሰጥቷቸዋል::", lx + 80, 455);'
);


// English Side Modifications
newContent = newContent.replace(
  'const rx = 455, rw = 320;\n    // Line 1: To ________ (Name)\n    doc.fillColor(forestGreen).font(latFont(false)).fontSize(12).text("To", rx, 212);',
  'const rx = 455, rw = 320;\n    // Line 1: To ________ (Name)\n    doc.fillColor(forestGreen).font(latFont(false)).fontSize(16).text("To", rx + 20, 260);'
);
newContent = newContent.replace(
  'const rx = 455, rw = 320;\r\n    // Line 1: To ________ (Name)\r\n    doc.fillColor(forestGreen).font(latFont(false)).fontSize(12).text("To", rx, 212);',
  'const rx = 455, rw = 320;\n    // Line 1: To ________ (Name)\n    doc.fillColor(forestGreen).font(latFont(false)).fontSize(16).text("To", rx + 20, 260);'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(actualName2, true)).fontSize(13)\n       .text(actualName2, rx + 25, 208, { width: rw - 25, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(actualName2, true)).fontSize(13)\n       .text(actualName2, rx + 55, 260, { width: rw - 55, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(actualName2, true)).fontSize(13)\r\n       .text(actualName2, rx + 25, 208, { width: rw - 25, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(actualName2, true)).fontSize(13)\n       .text(actualName2, rx + 55, 260, { width: rw - 55, align: "center" });'
);

newContent = newContent.replace(
  'doc.moveTo(rx + 20, 224).lineTo(rx + rw, 224).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(rx + 50, 275).lineTo(rx + rw + 20, 275).strokeColor(forestGreen).lineWidth(1.5).stroke();'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(latFont(false)).fontSize(10.5)\n       .text("THIS CERTIFICATE IS PROUDLY PRESENTED FOR", rx, 246);',
  'doc.fillColor(forestGreen).font(latFont(false)).fontSize(10)\n       .text("THIS CERTIFICATE IS PROUDLY PRESENTED FOR", rx + 75, 305);'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(latFont(false)).fontSize(10.5)\r\n       .text("THIS CERTIFICATE IS PROUDLY PRESENTED FOR", rx, 246);',
  'doc.fillColor(forestGreen).font(latFont(false)).fontSize(10)\n       .text("THIS CERTIFICATE IS PROUDLY PRESENTED FOR", rx + 75, 305);'
);

newContent = newContent.replace(
  'doc.text("SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING", rx, 268);',
  'doc.text("SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING", rx + 55, 340);'
);

newContent = newContent.replace(
  'doc.text("PROGRAM IN", rx, 290);',
  'doc.text("PROGRAM IN", rx + 30, 377);'
);

newContent = newContent.replace(
  'doc.moveTo(rx + 75, 302).lineTo(rx + rw, 302).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(rx + 115, 387).lineTo(rx + rw - 70, 387).strokeColor(forestGreen).lineWidth(1).stroke();'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(programEn, true)).fontSize(10.5)\n       .text(programEn.toUpperCase(), rx + 75, 288, { width: rw - 75, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(programEn, true)).fontSize(10)\n       .text(programEn.toUpperCase(), rx + 115, 376, { width: rw - 185, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(programEn, true)).fontSize(10.5)\r\n       .text(programEn.toUpperCase(), rx + 75, 288, { width: rw - 75, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(programEn, true)).fontSize(10)\n       .text(programEn.toUpperCase(), rx + 115, 376, { width: rw - 185, align: "center" });'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(latFont(false)).fontSize(10.5).text("AT CRAFTOPIA.", rx, 314);',
  'doc.fillColor(forestGreen).font(latFont(false)).fontSize(10).text("AT CRAFTOPIA.", rx + 255, 377);'
);

newContent = newContent.replace(
  'doc.text("THE TRAINING WAS CONDUCTED FOR", rx, 336);',
  'doc.text("THE TRAINING WAS CONDUCTED FOR", rx + 40, 415);'
);
newContent = newContent.replace(
  'doc.moveTo(rx + 195, 348).lineTo(rx + 270, 348).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(rx + 235, 425).lineTo(rx + 270, 425).strokeColor(forestGreen).lineWidth(1).stroke();'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(durationEn, true)).fontSize(10.5)\n       .text(durationEn, rx + 195, 334, { width: 75, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(durationEn, true)).fontSize(10)\n       .text(durationEn, rx + 235, 414, { width: 35, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(durationEn, true)).fontSize(10.5)\r\n       .text(durationEn, rx + 195, 334, { width: 75, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(durationEn, true)).fontSize(10)\n       .text(durationEn, rx + 235, 414, { width: 35, align: "center" });'
);

newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(latFont(false)).text("WEEK.", rx + 275, 336);',
  'doc.fillColor(forestGreen).font(latFont(false)).text("WEEK.", rx + 275, 415);'
);

// Fix date coordinates
newContent = newContent.replace(
  '// Small gold circular/abstract sigil or symbol positioned to the left of "ቀን"\n    doc.circle(lx + 10, 467, 3).fillColor(antiqueGold).fill();',
  '// No sigil here'
);
newContent = newContent.replace(
  '// Small gold circular/abstract sigil or symbol positioned to the left of "ቀን"\r\n    doc.circle(lx + 10, 467, 3).fillColor(antiqueGold).fill();',
  '// No sigil here'
);

newContent = newContent.replace(
  'doc.circle(lx + 10, 467, 1.5).fillColor("#ffffff").fill();',
  ''
);

newContent = newContent.replace(
  '// "ቀን:" label\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ቀን:", lx + 22, 461);',
  '// "ቀን:" label\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ቀን", lx - 30, 520);'
);
newContent = newContent.replace(
  '// "ቀን:" label\r\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ቀን:", lx + 22, 461);',
  '// "ቀን:" label\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ቀን", lx - 30, 520);'
);

newContent = newContent.replace(
  '// Gold dashed line for Ethiopian Date\n    doc.save();\n    doc.strokeColor(antiqueGold).lineWidth(1).dash(3, { space: 3 });\n    doc.moveTo(lx + 50, 473).lineTo(lx + 200, 473).stroke();\n    doc.restore();',
  '// Dashed line\n    doc.save();\n    doc.strokeColor(forestGreen).lineWidth(1).dash(3, { space: 3 });\n    doc.moveTo(lx - 5, 532).lineTo(lx + 125, 532).stroke();\n    doc.restore();'
);
newContent = newContent.replace(
  '// Gold dashed line for Ethiopian Date\r\n    doc.save();\r\n    doc.strokeColor(antiqueGold).lineWidth(1).dash(3, { space: 3 });\r\n    doc.moveTo(lx + 50, 473).lineTo(lx + 200, 473).stroke();\r\n    doc.restore();',
  '// Dashed line\n    doc.save();\n    doc.strokeColor(forestGreen).lineWidth(1).dash(3, { space: 3 });\n    doc.moveTo(lx - 5, 532).lineTo(lx + 125, 532).stroke();\n    doc.restore();'
);


newContent = newContent.replace(
  '// "ዓ.ም" label\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ዓ.ም", lx + 205, 461);',
  '// "ዓ.ም" label\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ዓ.ም", lx + 130, 520);'
);
newContent = newContent.replace(
  '// "ዓ.ም" label\r\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ዓ.ም", lx + 205, 461);',
  '// "ዓ.ም" label\n    doc.fillColor(forestGreen).font(ethFont(false)).fontSize(11).text("ዓ.ም", lx + 130, 520);'
);

newContent = newContent.replace(
  'const ethFinishDate = gregorianToEthiopianString(finishDate);\n    doc.fillColor(forestGreen).font(autoFont(ethFinishDate, true)).fontSize(11)\n       .text(ethFinishDate, lx + 50, 458, { width: 150, align: "center" });',
  'const ethFinishDate = gregorianToEthiopianString(finishDate);\n    doc.fillColor(forestGreen).font(autoFont(ethFinishDate, true)).fontSize(11)\n       .text(ethFinishDate, lx - 5, 519, { width: 130, align: "center" });'
);
newContent = newContent.replace(
  'const ethFinishDate = gregorianToEthiopianString(finishDate);\r\n    doc.fillColor(forestGreen).font(autoFont(ethFinishDate, true)).fontSize(11)\r\n       .text(ethFinishDate, lx + 50, 458, { width: 150, align: "center" });',
  'const ethFinishDate = gregorianToEthiopianString(finishDate);\n    doc.fillColor(forestGreen).font(autoFont(ethFinishDate, true)).fontSize(11)\n       .text(ethFinishDate, lx - 5, 519, { width: 130, align: "center" });'
);


newContent = newContent.replace(
  'const sigilX = rx + 160, sigilY = 405;\n    doc.save();\n    doc.translate(sigilX, sigilY);\n    doc.moveTo(0, -6).lineTo(2, -2).lineTo(6, -2).lineTo(3, 1).lineTo(5, 5).lineTo(0, 2).lineTo(-5, 5).lineTo(-3, 1).lineTo(-6, -2).lineTo(-2, -2).closePath().fillColor(antiqueGold).fill();\n    doc.restore();',
  ''
);
newContent = newContent.replace(
  'const sigilX = rx + 160, sigilY = 405;\r\n    doc.save();\r\n    doc.translate(sigilX, sigilY);\r\n    doc.moveTo(0, -6).lineTo(2, -2).lineTo(6, -2).lineTo(3, 1).lineTo(5, 5).lineTo(0, 2).lineTo(-5, 5).lineTo(-3, 1).lineTo(-6, -2).lineTo(-2, -2).closePath().fillColor(antiqueGold).fill();\r\n    doc.restore();',
  ''
);

newContent = newContent.replace(
  '// SIGNED line\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(9).text("SIGNED:", rx, 461);',
  '// SIGNED line\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(11).text("SIGNED:", rx - 100, 520);'
);
newContent = newContent.replace(
  '// SIGNED line\r\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(9).text("SIGNED:", rx, 461);',
  '// SIGNED line\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(11).text("SIGNED:", rx - 100, 520);'
);

newContent = newContent.replace(
  'doc.moveTo(rx + 45, 473).lineTo(rx + 180, 473).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(rx - 45, 532).lineTo(rx + 90, 532).strokeColor(forestGreen).lineWidth(1).stroke();'
);

newContent = newContent.replace(
  'doc.image(sigBuf, rx + 50, 422, { fit: [120, 45] });',
  'doc.image(sigBuf, rx - 40, 481, { fit: [120, 45] });'
);

newContent = newContent.replace(
  'doc.image(sealBuf, rx - 25, 320, { fit: [270, 270] });',
  'doc.image(sealBuf, rx - 130, 420, { fit: [200, 200] });' // Stamp positioning tweak
);


newContent = newContent.replace(
  '// DATE line\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(9).text("DATE:", rx + 195, 461);',
  '// DATE line\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(11).text("DATE:", rx + 160, 520);'
);
newContent = newContent.replace(
  '// DATE line\r\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(9).text("DATE:", rx + 195, 461);',
  '// DATE line\n    doc.fillColor(forestGreen).font(latFont(true)).fontSize(11).text("DATE:", rx + 160, 520);'
);


newContent = newContent.replace(
  'doc.moveTo(rx + 228, 473).lineTo(rx + rw, 473).strokeColor(forestGreen).lineWidth(1).stroke();',
  'doc.moveTo(rx + 200, 532).lineTo(rx + rw + 20, 532).strokeColor(forestGreen).lineWidth(1).stroke();'
);


newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(finishDate, true)).fontSize(9)\n       .text(finishDate, rx + 228, 459, { width: rw - 228, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(finishDate, true)).fontSize(11)\n       .text(finishDate, rx + 200, 519, { width: rw - 180, align: "center" });'
);
newContent = newContent.replace(
  'doc.fillColor(forestGreen).font(autoFont(finishDate, true)).fontSize(9)\r\n       .text(finishDate, rx + 228, 459, { width: rw - 228, align: "center" });',
  'doc.fillColor(forestGreen).font(autoFont(finishDate, true)).fontSize(11)\n       .text(finishDate, rx + 200, 519, { width: rw - 180, align: "center" });'
);


// And fix double vertical lines (the actual divider logic)
newContent = newContent.replace(
  'doc.image(bgBytes, 0, 0, { width: 841.89, height: 595.28 });\n\n\n\n    // ── SECTION 2: Header and Logo (Side-by-Side) ──────────────────────────',
  `doc.image(bgBytes, 0, 0, { width: 841.89, height: 595.28 });
    
    // Create the vertical divider exactly like the PDF
    doc.lineWidth(1).strokeColor(forestGreen);
    doc.moveTo(418, 225).lineTo(418, 440).stroke();
    doc.lineWidth(2).strokeColor(forestGreen);
    doc.moveTo(422, 225).lineTo(422, 440).stroke();

    // ── SECTION 2: Header and Logo (Side-by-Side) ──────────────────────────`
);
newContent = newContent.replace(
  'doc.image(bgBytes, 0, 0, { width: 841.89, height: 595.28 });\r\n\r\n\r\n\r\n    // ── SECTION 2: Header and Logo (Side-by-Side) ──────────────────────────',
  `doc.image(bgBytes, 0, 0, { width: 841.89, height: 595.28 });
    
    // Create the vertical divider exactly like the PDF
    doc.lineWidth(1).strokeColor(forestGreen);
    doc.moveTo(418, 225).lineTo(418, 440).stroke();
    doc.lineWidth(2).strokeColor(forestGreen);
    doc.moveTo(422, 225).lineTo(422, 440).stroke();

    // ── SECTION 2: Header and Logo (Side-by-Side) ──────────────────────────`
);


fs.writeFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', newContent);
console.log("Done");
