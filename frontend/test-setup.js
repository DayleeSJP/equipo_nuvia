// test-setup.js
// Sets CHROME_BIN to Puppeteer's bundled Chromium for CI/local environments
try {
  const puppeteer = require('puppeteer');
  process.env.CHROME_BIN = puppeteer.executablePath();
  console.log('CHROME_BIN set to', process.env.CHROME_BIN);
} catch (e) {
  console.warn('puppeteer not installed; tests may fail if Chrome is missing');
}
