const puppeteer = require('puppeteer');
const path = require('path');
const db = require('./api/db.js');

/**
 * Generate a Certificate PDF from template \api\a.html with dynamic database data.
 * @param {Object} options
 * @param {string} [options.chatId] - Telegram chat_id or regId to fetch user from DB
 * @param {string} [options.studentName] - Explicit student name override
 * @param {string} [options.courseTitle] - Explicit course title override
 * @param {string} [options.date] - Explicit date override
 * @param {string} [options.templatePath] - Path to HTML template (default: \api\a.html)
 * @param {string} [options.outputPath] - PDF output destination (default: certificate.pdf)
 */
async function generateCertificatePdf(options = {}) {
  let studentName = options.studentName || 'Melese Kebede';
  let courseTitle = options.courseTitle || 'FACEBOOK ADS TRAINING PROGRAM';
  let date = options.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const templatePath = options.templatePath || path.resolve(__dirname, 'api', 'a.html');
  const outputPath = options.outputPath || 'certificate.pdf';

  try {
    if (options.chatId) {
      const reg = await db.getRegistration(options.chatId) || await db.getRegistrationById(options.chatId);
      if (reg) {
        if (reg.name) studentName = reg.name;
        if (reg.created_at) {
          const d = new Date(reg.created_at);
          date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      }
    } else if (!options.studentName) {
      const [regs] = await db.getRegistrationsPaginated(1, 10, 'approved');
      if (regs && regs.length > 0) {
        const userReg = regs.find(r => r.name) || regs[0];
        if (userReg && userReg.name) studentName = userReg.name;
        if (userReg && userReg.created_at) {
          const d = new Date(userReg.created_at);
          date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      }
    }

    if (!options.courseTitle) {
      const settings = await db.getPaymentSettings();
      if (settings && settings.cert_program_en) {
        courseTitle = settings.cert_program_en;
      }
    }
  } catch (err) {
    console.warn('Database lookup note:', err.message);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve(templatePath).replace(/\\/g, '/');

  await page.goto(fileUrl, {
    waitUntil: 'networkidle0'
  });

  await page.evaluate(({ studentName, courseTitle, date }) => {
    if (typeof updateCertificateData === 'function') {
      updateCertificateData({
        studentName: studentName,
        courseTitle: courseTitle,
        date: date
      });
    } else {
      const studentEl = document.getElementById('student-name');
      if (studentEl) studentEl.innerText = studentName;

      const courseEl = document.getElementById('course-title');
      if (courseEl) courseEl.innerText = courseTitle;

      const dateEl = document.getElementById('completion-date');
      if (dateEl) dateEl.innerText = date;
    }
  }, { studentName, courseTitle, date });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: true
  });

  await browser.close();
  return outputPath;
}

module.exports = { generateCertificatePdf };
