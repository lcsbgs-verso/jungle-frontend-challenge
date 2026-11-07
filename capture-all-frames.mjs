import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('/opt/cursor/artifacts/screenshots', { recursive: true });

const browser = await chromium.launch();

// 1. Desktop Home 1440×900 fullpage
console.log('Capturing Desktop Home (1440×900 fullpage)...');
const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktopPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await desktopPage.waitForTimeout(2000);
await desktopPage.screenshot({ 
  path: '/opt/cursor/artifacts/screenshots/desktop-home-1440.png',
  fullPage: true 
});
console.log('✓ Desktop Home captured');

// 2. Mobile Home 414×896
console.log('Capturing Mobile Home (414×896)...');
const mobilePage = await browser.newPage({ viewport: { width: 414, height: 896 } });
await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(2000);
await mobilePage.screenshot({ 
  path: '/opt/cursor/artifacts/screenshots/mobile-home-414.png',
  fullPage: true 
});
console.log('✓ Mobile Home captured');

// 3. Desktop Login Modal (need to trigger modal)
console.log('Capturing Desktop Login Modal...');
await desktopPage.goto('http://localhost:5173/entrar?next=%2F', { waitUntil: 'networkidle' });
await desktopPage.waitForTimeout(1000);
await desktopPage.screenshot({ 
  path: '/opt/cursor/artifacts/screenshots/desktop-login-modal.png'
});
console.log('✓ Desktop Login Modal captured');

// 4. Desktop Register Modal
console.log('Capturing Desktop Register Modal...');
await desktopPage.goto('http://localhost:5173/cadastro?next=%2F', { waitUntil: 'networkidle' });
await desktopPage.waitForTimeout(1000);
await desktopPage.screenshot({ 
  path: '/opt/cursor/artifacts/screenshots/desktop-register-modal.png'
});
console.log('✓ Desktop Register Modal captured');

// 5. Mobile Login Page 414×896
console.log('Capturing Mobile Login (414×896)...');
await mobilePage.goto('http://localhost:5173/entrar?next=%2F', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(1000);
await mobilePage.screenshot({ 
  path: '/opt/cursor/artifacts/screenshots/mobile-login-414.png',
  fullPage: true 
});
console.log('✓ Mobile Login captured');

// 6. Mobile Register Page 414×896
console.log('Capturing Mobile Register (414×896)...');
await mobilePage.goto('http://localhost:5173/cadastro?next=%2F', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(1000);
await mobilePage.screenshot({ 
  path: '/opt/cursor/artifacts/screenshots/mobile-register-414.png',
  fullPage: true 
});
console.log('✓ Mobile Register captured');

await browser.close();

console.log('\n✓ All screenshots captured in /opt/cursor/artifacts/screenshots/');
console.log('Files:');
console.log('  - desktop-home-1440.png');
console.log('  - mobile-home-414.png');
console.log('  - desktop-login-modal.png');
console.log('  - desktop-register-modal.png');
console.log('  - mobile-login-414.png');
console.log('  - mobile-register-414.png');
