import { chromium } from '@playwright/test';

const EXPECTED = {
  'mobile-login': {
    logo: { y: 137, height: 56 },
    title: { y: 257, height: 16 },
    button: { y: 492, height: 60 },
  },
  'mobile-home': {
    bottomNav: { y: 820, height: 76 },
  },
};

async function measureCoords() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  
  console.log('\n=== MOBILE LOGIN 16:1022 ===');
  await page.goto('http://localhost:5173/entrar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const logo = await page.evaluate(() => {
    const el = document.querySelector('.mobile-auth-logo-big');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { y: Math.round(rect.top), height: Math.round(rect.height) };
  });
  
  const title = await page.evaluate(() => {
    const el = document.querySelector('.mobile-auth-title-big');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { y: Math.round(rect.top), height: Math.round(rect.height) };
  });
  
  const button = await page.evaluate(() => {
    const el = document.querySelector('.mobile-auth-btn-exact');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { y: Math.round(rect.top), height: Math.round(rect.height) };
  });
  
  console.log(`Logo: y=${logo?.y} h=${logo?.height} (expect y≈137, h≈56)`);
  console.log(`Title: y=${title?.y} h=${title?.height} (expect y≈257, h≈16)`);
  console.log(`Button: y=${button?.y} h=${button?.height} (expect y≈492, h=60)`);
  
  console.log('\n=== MOBILE HOME 14:5226 ===');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const bottomNav = await page.evaluate(() => {
    const el = document.querySelector('.mobile-nav-bar');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { y: Math.round(rect.top), height: Math.round(rect.height) };
  });
  
  console.log(`Bottom Nav: y=${bottomNav?.y} h=${bottomNav?.height} (expect y≈820, h=76)`);
  if (bottomNav?.y > 896) console.log('⚠️  BOTTOM NAV IS BELOW VIEWPORT!');
  
  await browser.close();
}

measureCoords().catch(console.error);
