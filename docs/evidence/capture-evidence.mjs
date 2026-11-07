/* global document */
import { chromium } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

const execAsync = promisify(exec);

const browser = await chromium.launch();
const SHA = (await execAsync('git rev-parse HEAD')).stdout.trim().slice(0,7);

console.log(`\n=== Evidence Capture (SHA: ${SHA}) ===\n`);

const results = { sha: SHA, screenshots: [], imageLoads: {}, keyboard: [] };

// Desktop screenshots
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
console.log('📸 Desktop Home 1440×900...');
await desktop.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await desktop.waitForTimeout(2000);
await desktop.screenshot({ path: `/opt/cursor/artifacts/screenshots/desktop-home-1440-${SHA}.png` });
await desktop.screenshot({ path: `/opt/cursor/artifacts/screenshots/desktop-home-fullpage-${SHA}.png`, fullPage: true });

console.log('📸 Desktop Login...');
await desktop.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await desktop.waitForTimeout(1000);
await desktop.screenshot({ path: `/opt/cursor/artifacts/screenshots/desktop-login-${SHA}.png` });

console.log('📸 Desktop Register...');
await desktop.goto('http://localhost:5173/cadastro', { waitUntil: 'networkidle' });
await desktop.waitForTimeout(1000);
await desktop.screenshot({ path: `/opt/cursor/artifacts/screenshots/desktop-register-${SHA}.png` });
results.screenshots.push('desktop-home-1440', 'desktop-home-fullpage', 'desktop-login', 'desktop-register');

// Mobile 414×896
const mobile414 = await browser.newPage({ viewport: { width: 414, height: 896 } });
console.log('📸 Mobile 414×896 (Home, Login, Register)...');
await mobile414.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await mobile414.waitForTimeout(2000);
await mobile414.screenshot({ path: `/opt/cursor/artifacts/screenshots/mobile-home-414-${SHA}.png` });
await mobile414.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await mobile414.waitForTimeout(1000);
await mobile414.screenshot({ path: `/opt/cursor/artifacts/screenshots/mobile-login-414-${SHA}.png` });
await mobile414.goto('http://localhost:5173/cadastro', { waitUntil: 'networkidle' });
await mobile414.waitForTimeout(1000);
await mobile414.screenshot({ path: `/opt/cursor/artifacts/screenshots/mobile-register-414-${SHA}.png` });
results.screenshots.push('mobile-home-414', 'mobile-login-414', 'mobile-register-414');

// Mobile 390×900
const mobile390 = await browser.newPage({ viewport: { width: 390, height: 900 } });
console.log('📸 Mobile 390×900...');
await mobile390.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await mobile390.waitForTimeout(2000);
await mobile390.screenshot({ path: `/opt/cursor/artifacts/screenshots/mobile-home-390-${SHA}.png` });
results.screenshots.push('mobile-home-390');

// Mobile 768×900
const mobile768 = await browser.newPage({ viewport: { width: 768, height: 900 } });
console.log('📸 Mobile 768×900...');
await mobile768.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await mobile768.waitForTimeout(2000);
await mobile768.screenshot({ path: `/opt/cursor/artifacts/screenshots/mobile-home-768-${SHA}.png` });
results.screenshots.push('mobile-home-768');

// Image load verification
console.log('🖼️  Verifying image loads...');
await desktop.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const images = await desktop.evaluate(() => {
  return Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src.split('/').pop(),
    complete: img.complete,
    width: img.naturalWidth,
  }));
});
const failed = images.filter(i => !i.complete || i.width === 0);
results.imageLoads = { total: images.length, failed: failed.length, failedList: failed };

// Keyboard navigation
console.log('⌨️  Testing keyboard navigation...');
await desktop.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
await desktop.keyboard.press('Tab');
await desktop.waitForTimeout(100);
const focus1 = await desktop.evaluate(() => document.activeElement?.className);
await desktop.keyboard.press('Tab');
await desktop.waitForTimeout(100);
const focus2 = await desktop.evaluate(() => document.activeElement?.className);
results.keyboard = { firstTab: focus1, secondTab: focus2 };

await browser.close();

await writeFile(`/opt/cursor/artifacts/evidence-${SHA}.json`, JSON.stringify(results, null, 2));

console.log(`\n✅ Complete!`);
console.log(`   Screenshots: ${results.screenshots.length}`);
console.log(`   Images: ${results.imageLoads.total} total, ${results.imageLoads.failed} failed`);
console.log(`   Keyboard: Tab sequence captured`);
console.log(`\nEvidence: /opt/cursor/artifacts/evidence-${SHA}.json\n`);
