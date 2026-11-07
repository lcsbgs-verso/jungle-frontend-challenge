import { chromium } from '@playwright/test';

const browser = await chromium.launch();

// Measure Mobile Home
console.log('=== MOBILE HOME (414×896) ===');
const mobilePage = await browser.newPage({ viewport: { width: 414, height: 896 } });
await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(2000);

const mobileMetrics = await mobilePage.evaluate(() => ({
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  documentWidth: document.documentElement.scrollWidth,
  documentHeight: document.documentElement.scrollHeight,
  bodyWidth: document.body.scrollWidth,
  bodyHeight: document.body.scrollHeight,
  hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  hasVerticalOverflow: document.documentElement.scrollHeight > window.innerHeight,
}));

console.log('Viewport:', mobileMetrics.viewportWidth, '×', mobileMetrics.viewportHeight);
console.log('Document:', mobileMetrics.documentWidth, '×', mobileMetrics.documentHeight);
console.log('Body:', mobileMetrics.bodyWidth, '×', mobileMetrics.bodyHeight);
console.log('Horizontal overflow:', mobileMetrics.hasHorizontalOverflow ? '⚠️  YES' : '✓ NO');
console.log('Vertical overflow:', mobileMetrics.hasVerticalOverflow ? '✓ YES (scrollable)' : 'NO');

// Measure Mobile Login
console.log('\n=== MOBILE LOGIN (414×896) ===');
await mobilePage.goto('http://localhost:5173/entrar?next=%2F', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(1000);

const loginMetrics = await mobilePage.evaluate(() => ({
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  documentWidth: document.documentElement.scrollWidth,
  documentHeight: document.documentElement.scrollHeight,
  hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  hasVerticalOverflow: document.documentElement.scrollHeight > window.innerHeight,
}));

console.log('Viewport:', loginMetrics.viewportWidth, '×', loginMetrics.viewportHeight);
console.log('Document:', loginMetrics.documentWidth, '×', loginMetrics.documentHeight);
console.log('Horizontal overflow:', loginMetrics.hasHorizontalOverflow ? '⚠️  YES' : '✓ NO');
console.log('Vertical overflow:', loginMetrics.hasVerticalOverflow ? '✓ YES (scrollable)' : 'NO');

await browser.close();
