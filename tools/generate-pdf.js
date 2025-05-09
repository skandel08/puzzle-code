/**
 * Puppeteer script to export A&B.html to a PDF.
 *
 * Usage:  npm i puppeteer   # once
 *         node pdf-generator.js
 */
const path      = require('path');
const puppeteer = require('puppeteer');

(async ()=>{
  const browser = await puppeteer.launch({headless:true});
  const page    = await browser.newPage();
  const fileUrl = 'file://'+path.join(__dirname,'A&B.html');
  await page.goto(fileUrl,{waitUntil:'networkidle0'});

  // To produce an answer page, uncomment the next line
  // await page.click('#toggleSolutionsBtn');

  await page.pdf({
    path: 'apples-bananas.pdf',
    format: 'letter',
    printBackground: true,
    margin: {top:'0.5in',bottom:'0.5in',left:'0.5in',right:'0.5in'}
  });
  await browser.close();
  console.log('PDF saved as apples-bananas.pdf');
})();