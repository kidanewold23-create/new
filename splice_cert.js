const fs = require('fs');

const indexCode = fs.readFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', 'utf8');
const newGenCode = fs.readFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/generate_from_html.ts', 'utf8');

// The new generator code has imports at the top:
// import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
// import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
// We need to inject these at the top of index.ts if not present

let finalIndexCode = indexCode;

if (!finalIndexCode.includes('npm:pdf-lib')) {
  finalIndexCode = 'import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";\nimport fontkit from "npm:@pdf-lib/fontkit@1.1.1";\n' + finalIndexCode;
}

// Remove pdfkit import
finalIndexCode = finalIndexCode.replace(/import PDFDocument from "npm:pdfkit@0\.13\.0";\r?\n/, '');
finalIndexCode = finalIndexCode.replace(/import PDFDocument from "npm:pdfkit@0\.13\.0";/, '');

// Find the boundaries of the old generateCertificatePdf
const startStr = 'async function generateCertificatePdf(name: string, regDate: string, finishDate: string, name2?: string): Promise<Uint8Array> {';
const startIdx = finalIndexCode.indexOf(startStr);
if (startIdx === -1) {
  console.error("Could not find start of generateCertificatePdf in index.ts");
  process.exit(1);
}

const endStr = 'async function checkAndApplyReferralReward';
const endIdx = finalIndexCode.indexOf(endStr);
if (endIdx === -1) {
  console.error("Could not find end of generateCertificatePdf in index.ts");
  process.exit(1);
}

// In the new generator code, find the start of generateCertificatePdf
const newStartIdx = newGenCode.indexOf(startStr);
const newFuncCode = newGenCode.slice(newStartIdx);

finalIndexCode = finalIndexCode.slice(0, startIdx) + newFuncCode + "\n\n" + finalIndexCode.slice(endIdx);

fs.writeFileSync('C:/Users/Administrator/Desktop/Projects/yonatan/supabase/functions/api/index.ts', finalIndexCode);
console.log("Done splicing!");
