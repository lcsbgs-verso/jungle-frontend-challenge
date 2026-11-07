/* global document */
import { chromium } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import axe from 'axe-core';

const execAsync = promisify(exec);
const SHA = (await execAsync('git rev-parse HEAD')).stdout.trim().slice(0,7);
const DIR = `/opt/cursor/artifacts/final-${SHA}`;

await mkdir(DIR, { recursive: true });
await mkdir(`${DIR}/screenshots`, { recursive: true });

console.log(`\n=== FINAL COMPREHENSIVE EVIDENCE (SHA: ${SHA}) ===\n`);

const evidence = {
  sha: SHA,
  timestamp: new Date().toISOString(),
  font: 'Roboto Mono',
  screenshots: {},
  accessibility: {},
  keyboard: {},
  assertions: {}
};

const browser = await chromium.launch();
const axeSource = axe.source;

// Desktop Home
console.log('📸 Desktop Home...');
const dHome = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await dHome.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await dHome.waitForTimeout(2000);
await dHome.screenshot({ path: `${DIR}/screenshots/desktop-home-1440.png` });
await dHome.screenshot({ path: `${DIR}/screenshots/desktop-home-fullpage.png`, fullPage: true });
evidence.screenshots.desktopHome = ['desktop-home-1440.png', 'desktop-home-fullpage.png'];

// Desktop Login
console.log('📸 Desktop Login...');
const dLogin = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await dLogin.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await dLogin.waitForTimeout(1500);
await dLogin.screenshot({ path: `${DIR}/screenshots/desktop-login.png` });
evidence.screenshots.desktopLogin = 'desktop-login.png';

// Axe - Desktop Login
console.log('♿ Axe: Desktop Login...');
await dLogin.addScriptTag({ content: axeSource });
const axeLogin = await dLogin.evaluate(() => {
  return new Promise((resolve) => {
    // @ts-expect-error - Playwright page.evaluate context
    axe.run((err, results) => {
      if (err) resolve({ error: err.message });
      resolve({ violations: results.violations.length, details: results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    });
  });
});
evidence.accessibility.desktopLogin = axeLogin;

// Keyboard - Desktop Login
console.log('⌨️  Keyboard: Desktop Login...');
const loginKb = [];
await dLogin.keyboard.press('Tab');
await dLogin.waitForTimeout(100);
const f1 = await dLogin.evaluate(() => ({ tag: document.activeElement?.tagName, type: document.activeElement?.getAttribute?.('type'), id: document.activeElement?.id }));
loginKb.push({ action: 'Tab1', focus: f1 });

await dLogin.keyboard.press('Tab');
await dLogin.waitForTimeout(100);
const f2 = await dLogin.evaluate(() => ({ tag: document.activeElement?.tagName, type: document.activeElement?.getAttribute?.('type') }));
loginKb.push({ action: 'Tab2', focus: f2 });

// Password toggle
const pwdInput = await dLogin.$('input[type="password"]');
if (pwdInput) {
  await pwdInput.type('test');
  const toggle = await dLogin.$('.auth-exact-toggle');
  if (toggle) {
    await toggle.click();
    await dLogin.waitForTimeout(200);
    const revealed = await dLogin.evaluate(() => document.querySelector('.auth-exact-password input')?.getAttribute('type') === 'text');
    loginKb.push({ action: 'PasswordToggle', result: revealed ? 'SUCCESS-text-visible' : 'FAILED' });
  }
}

// Escape
await dLogin.keyboard.press('Escape');
await dLogin.waitForTimeout(500);
const modalGone = await dLogin.evaluate(() => !document.querySelector('.desktop-auth-exact'));
loginKb.push({ action: 'Escape', result: modalGone ? 'SUCCESS-closed' : 'FAILED-still-open' });

evidence.keyboard.desktopLogin = loginKb;
await dLogin.close();

// Desktop Register
console.log('📸 Desktop Register...');
const dReg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await dReg.goto('http://localhost:5173/cadastro', { waitUntil: 'networkidle' });
await dReg.waitForTimeout(1500);
await dReg.screenshot({ path: `${DIR}/screenshots/desktop-register.png` });
evidence.screenshots.desktopRegister = 'desktop-register.png';

// Axe - Desktop Register
console.log('♿ Axe: Desktop Register...');
await dReg.addScriptTag({ content: axeSource });
const axeReg = await dReg.evaluate(() => {
  return new Promise((resolve) => {
    // @ts-expect-error - Playwright page.evaluate context
    axe.run((err, results) => {
      if (err) resolve({ error: err.message });
      resolve({ violations: results.violations.length, details: results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    });
  });
});
evidence.accessibility.desktopRegister = axeReg;
await dReg.close();

// Mobile 414×896
console.log('📸 Mobile 414×896...');
const m414 = await browser.newPage({ viewport: { width: 414, height: 896 } });
await m414.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await m414.waitForTimeout(2000);
await m414.screenshot({ path: `${DIR}/screenshots/mobile-home-414.png` });

await m414.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await m414.waitForTimeout(1500);
await m414.screenshot({ path: `${DIR}/screenshots/mobile-login-414.png` });

// Axe - Mobile Login
console.log('♿ Axe: Mobile Login...');
await m414.addScriptTag({ content: axeSource });
const axeMLogin = await m414.evaluate(() => {
  return new Promise((resolve) => {
    // @ts-expect-error - Playwright page.evaluate context
    axe.run((err, results) => {
      if (err) resolve({ error: err.message });
      resolve({ violations: results.violations.length, details: results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    });
  });
});
evidence.accessibility.mobileLogin = axeMLogin;

await m414.goto('http://localhost:5173/cadastro', { waitUntil: 'networkidle' });
await m414.waitForTimeout(1500);
await m414.screenshot({ path: `${DIR}/screenshots/mobile-register-414.png` });

// Axe - Mobile Register
console.log('♿ Axe: Mobile Register...');
await m414.addScriptTag({ content: axeSource });
const axeMReg = await m414.evaluate(() => {
  return new Promise((resolve) => {
    // @ts-expect-error - Playwright page.evaluate context
    axe.run((err, results) => {
      if (err) resolve({ error: err.message });
      resolve({ violations: results.violations.length, details: results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    });
  });
});
evidence.accessibility.mobileRegister = axeMReg;

// Image loads
const imgs = await m414.evaluate(() => {
  return Array.from(document.querySelectorAll('img')).map(i => ({
    src: i.src.split('/').pop(),
    loaded: i.complete && i.naturalWidth > 0
  }));
});
evidence.assertions.imageLoads = { total: imgs.length, loaded: imgs.filter(i => i.loaded).length, failed: imgs.filter(i => !i.loaded).map(i => i.src) };

await m414.close();

// Official viewports
const m390 = await browser.newPage({ viewport: { width: 390, height: 900 } });
await m390.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await m390.waitForTimeout(2000);
await m390.screenshot({ path: `${DIR}/screenshots/mobile-home-390.png` });
await m390.close();

const m768 = await browser.newPage({ viewport: { width: 768, height: 900 } });
await m768.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await m768.waitForTimeout(2000);
await m768.screenshot({ path: `${DIR}/screenshots/mobile-home-768.png` });
await m768.close();

evidence.screenshots.mobileHome = ['mobile-home-414.png', 'mobile-home-390.png', 'mobile-home-768.png'];
evidence.screenshots.mobileLogin = 'mobile-login-414.png';
evidence.screenshots.mobileRegister = 'mobile-register-414.png';

await browser.close();

await writeFile(`${DIR}/EVIDENCE.json`, JSON.stringify(evidence, null, 2));

console.log(`\n✅ FINAL EVIDENCE COMPLETE`);
console.log(`\nLocation: ${DIR}/`);
console.log(`\n♿ Axe Results:`);
console.log(`   Desktop Login: ${evidence.accessibility.desktopLogin.violations} violations`);
console.log(`   Desktop Register: ${evidence.accessibility.desktopRegister.violations} violations`);
console.log(`   Mobile Login: ${evidence.accessibility.mobileLogin.violations} violations`);
console.log(`   Mobile Register: ${evidence.accessibility.mobileRegister.violations} violations`);
console.log(`\n⌨️  Keyboard: ${evidence.keyboard.desktopLogin.length} interactions`);
console.log(`\n🖼️  Images: ${evidence.assertions.imageLoads.loaded}/${evidence.assertions.imageLoads.total} loaded`);
console.log(`\nEvidence JSON: ${DIR}/EVIDENCE.json\n`);
