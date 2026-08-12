const puppeteer = require('puppeteer');
const path = require('path');
const db = require('./api/db.js');

(async () => {
  // 1. Fetch dynamic data from database
  let studentName = 'Melese Kebede';
  let courseTitle = 'FACEBOOK ADS TRAINING PROGRAM';
  let date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    // Fetch latest completed/approved user registration from DB
    const [regs] = await db.getRegistrationsPaginated(1, 10, 'approved');
    if (regs && regs.length > 0) {
      const userReg = regs.find(r => r.name) || regs[0];
      if (userReg && userReg.name) {
        studentName = userReg.name;
      }
      if (userReg && userReg.created_at) {
        const d = new Date(userReg.created_at);
        date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }

    // Fetch dynamic course title from payment/course settings in DB
    const settings = await db.getPaymentSettings();
    if (settings && settings.cert_program_en) {
      courseTitle = settings.cert_program_en;
    }
  } catch (err) {
    console.log('Database fetch info:', err.message);
  }

  console.log(`Generating Certificate PDF:`);
  console.log(`- Student Name: ${studentName}`);
  console.log(`- Course Title: ${courseTitle}`);
  console.log(`- Date: ${date}`);

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 3. Open certificate template at path \api\a.html
  const templatePath = path.resolve(__dirname, 'api', 'a.html');
  const fileUrl = 'file:///' + templatePath.replace(/\\/g, '/');

  await page.goto(fileUrl, {
    waitUntil: 'networkidle0'
  });

  // 4. Dynamically populate student name, course title, and date from database
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

  // 5. Export to PDF
  await page.pdf({
    path: 'certificate.pdf',
    format: 'A4',
    landscape: true,
    printBackground: true
  });

  await browser.close();
  console.log('Certificate PDF generated successfully: certificate.pdf');
})();
