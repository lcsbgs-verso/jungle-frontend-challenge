/* global window, document */
import { chromium } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const SHA = (await execAsync('git rev-parse HEAD')).stdout.trim().slice(0,7);
const ARTIFACT_DIR = `/opt/cursor/artifacts/milestone2-${SHA}`;

await mkdir(ARTIFACT_DIR, { recursive: true });
await mkdir(`${ARTIFACT_DIR}/screenshots`, { recursive: true });

console.log(`\n=== COMPREHENSIVE EVIDENCE CAPTURE ===`);
console.log(`SHA: ${SHA}`);
console.log(`Output: ${ARTIFACT_DIR}\n`);

const evidence = {
  sha: SHA,
  timestamp: new Date().toISOString(),
  font: 'Roboto Mono',
  screenshots: {},
  accessibility: {},
  keyboard: {},
  assertions: { overflow: {}, imageLoads: {} }
};

const browser = await chromium.launch();

// Desktop Home 1440x900
console.log('📸 Desktop Home 1440×900 (viewport + fullpage)...');
const dHome = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await dHome.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await dHome.waitForTimeout(2000);
await dHome.screenshot({ path: `${ARTIFACT_DIR}/screenshots/desktop-home-1440.png` });
await dHome.screenshot({ path: `${ARTIFACT_DIR}/screenshots/desktop-home-fullpage.png`, fullPage: true });
evidence.screenshots.desktopHome = { viewport: '1440x900', files: ['desktop-home-1440.png', 'desktop-home-fullpage.png'] };

// Image load verification on home
const homeImages = await dHome.evaluate(() => {
  return Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src.substring(img.src.lastIndexOf('/') + 1),
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight
  }));
});
evidence.assertions.imageLoads.home = {
  total: homeImages.length,
  loaded: homeImages.filter(i => i.complete && i.naturalWidth > 0).length,
  failed: homeImages.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
};

// Overflow check
const homeOverflow = await dHome.evaluate(() => ({
  horizontal: document.documentElement.scrollWidth > window.innerWidth,
  vertical: document.documentElement.scrollHeight > window.innerHeight,
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight
}));
evidence.assertions.overflow.desktopHome = homeOverflow;

await dHome.close();

// Desktop Login Modal
console.log('📸 Desktop Login Modal 1440×900...');
const dLogin = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await dLogin.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await dLogin.waitForTimeout(1500);
await dLogin.screenshot({ path: `${ARTIFACT_DIR}/screenshots/desktop-login.png` });
evidence.screenshots.desktopLogin = { viewport: '1440x900', file: 'desktop-login.png' };

// Keyboard navigation - login
console.log('⌨️  Keyboard: Desktop Login...');
const loginKeyboard = [];
await dLogin.keyboard.press('Tab');
await dLogin.waitForTimeout(100);
loginKeyboard.push({ action: 'Tab 1', element: await dLogin.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.type) });
await dLogin.keyboard.press('Tab');
await dLogin.waitForTimeout(100);
loginKeyboard.push({ action: 'Tab 2', element: await dLogin.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.type) });
await dLogin.keyboard.press('Tab');
await dLogin.waitForTimeout(100);
loginKeyboard.push({ action: 'Tab 3 (password)', element: await dLogin.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.type) });

// Password toggle test
const passwordField = await dLogin.$('input[type="password"]');
if (passwordField) {
  await passwordField.type('test123');
  const toggleBtn = await dLogin.$('.auth-exact-toggle');
  if (toggleBtn) {
    await toggleBtn.click();
    await dLogin.waitForTimeout(200);
    const isVisible = await dLogin.evaluate(() => document.querySelector('.auth-exact-field input')?.type === 'text');
    loginKeyboard.push({ action: 'Password toggle', result: isVisible ? 'text visible' : 'failed' });
  }
}

// Tab to submit
await dLogin.keyboard.press('Tab');
await dLogin.waitForTimeout(100);
loginKeyboard.push({ action: 'Tab 4 (submit)', element: await dLogin.evaluate(() => document.activeElement?.tagName) });

// Close button
await dLogin.keyboard.press('Escape');
await dLogin.waitForTimeout(300);
const modalClosed = await dLogin.evaluate(() => !document.querySelector('.desktop-auth-exact'));
loginKeyboard.push({ action: 'Escape close', result: modalClosed ? 'closed' : 'still open' });

evidence.keyboard.desktopLogin = loginKeyboard;
await dLogin.close();

// Desktop Register Modal
console.log('📸 Desktop Register Modal 1440×900...');
const dRegister = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await dRegister.goto('http://localhost:5173/cadastro', { waitUntil: 'networkidle' });
await dRegister.waitForTimeout(1500);
await dRegister.screenshot({ path: `${ARTIFACT_DIR}/screenshots/desktop-register.png` });
evidence.screenshots.desktopRegister = { viewport: '1440x900', file: 'desktop-register.png' };

// Verify confirm password field exists
const confirmField = await dRegister.evaluate(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
  return {
    total: inputs.length,
    placeholders: inputs.map(i => i.placeholder)
  };
});
evidence.assertions.desktopRegisterConfirmPassword = confirmField;

await dRegister.close();

// Mobile 414×896
console.log('📸 Mobile 414×896 (Home, Login, Register)...');
const m414 = await browser.newPage({ viewport: { width: 414, height: 896 } });
await m414.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await m414.waitForTimeout(2000);
await m414.screenshot({ path: `${ARTIFACT_DIR}/screenshots/mobile-home-414.png` });
evidence.screenshots.mobileHome414 = { viewport: '414x896', file: 'mobile-home-414.png' };

await m414.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await m414.waitForTimeout(1500);
await m414.screenshot({ path: `${ARTIFACT_DIR}/screenshots/mobile-login-414.png` });
evidence.screenshots.mobileLogin414 = { viewport: '414x896', file: 'mobile-login-414.png' };

await m414.goto('http://localhost:5173/cadastro', { waitUntil: 'networkidle' });
await m414.waitForTimeout(1500);
await m414.screenshot({ path: `${ARTIFACT_DIR}/screenshots/mobile-register-414.png` });
evidence.screenshots.mobileRegister414 = { viewport: '414x896', file: 'mobile-register-414.png' };

const m414Overflow = await m414.evaluate(() => ({
  horizontal: document.documentElement.scrollWidth > window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth
}));
evidence.assertions.overflow.mobile414 = m414Overflow;

await m414.close();

// Mobile 390×900
console.log('📸 Mobile 390×900...');
const m390 = await browser.newPage({ viewport: { width: 390, height: 900 } });
await m390.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await m390.waitForTimeout(2000);
await m390.screenshot({ path: `${ARTIFACT_DIR}/screenshots/mobile-home-390.png` });
evidence.screenshots.mobileHome390 = { viewport: '390x900', file: 'mobile-home-390.png' };
await m390.close();

// Mobile 768×900
console.log('📸 Mobile 768×900...');
const m768 = await browser.newPage({ viewport: { width: 768, height: 900 } });
await m768.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await m768.waitForTimeout(2000);
await m768.screenshot({ path: `${ARTIFACT_DIR}/screenshots/mobile-home-768.png` });
evidence.screenshots.mobileHome768 = { viewport: '768x900', file: 'mobile-home-768.png' };
await m768.close();

await browser.close();

// Write evidence JSON
await writeFile(`${ARTIFACT_DIR}/EVIDENCE.json`, JSON.stringify(evidence, null, 2));

console.log(`\n✅ COMPREHENSIVE EVIDENCE COMPLETE`);
console.log(`\nLocation: ${ARTIFACT_DIR}/`);
console.log(`\n📸 Screenshots: 9 PNG files`);
console.log(`   - desktop-home-1440.png, desktop-home-fullpage.png`);
console.log(`   - desktop-login.png, desktop-register.png`);
console.log(`   - mobile-home-414.png, mobile-login-414.png, mobile-register-414.png`);
console.log(`   - mobile-home-390.png, mobile-home-768.png`);
console.log(`\n🖼️  Image Loads: ${evidence.assertions.imageLoads.home.loaded}/${evidence.assertions.imageLoads.home.total} loaded`);
console.log(`\n⌨️  Keyboard: ${evidence.keyboard.desktopLogin.length} interactions tested`);
console.log(`\n📊 Overflow: Desktop H=${homeOverflow.horizontal} V=${homeOverflow.vertical}, Mobile H=${m414Overflow.horizontal}`);
console.log(`\n📄 Evidence: ${ARTIFACT_DIR}/EVIDENCE.json\n`);
