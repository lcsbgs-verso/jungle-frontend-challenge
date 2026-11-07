import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Capture all network and console
page.on('response', r => {
  if (r.url().includes('/auth/login')) {
    console.log('Login response:', r.status(), r.statusText());
    r.json().then(data => console.log('Response body:', data)).catch(() => {});
  }
});

page.on('console', msg => console.log('Console:', msg.text()));

await page.goto('http://localhost:4173/entrar');
await page.waitForTimeout(1000);

const dialog = page.locator('[role="dialog"]');
await dialog.locator('input[aria-label="E-mail"]').fill('alice@kurio.test');
await dialog.locator('input[aria-label="Senha"]').first().fill('WrongPassword123');
await dialog.locator('button[type="submit"]').click();

await page.waitForTimeout(3000);

// Check for error element
const errorEl = await dialog.locator('.auth-exact-error').count();
console.log('Error element count:', errorEl);

if (errorEl > 0) {
  const errorText = await dialog.locator('.auth-exact-error').textContent();
  console.log('Error text:', errorText);
}

const screenshot = await page.screenshot({ path: '/opt/cursor/artifacts/auth-error-debug.png' });
console.log('Screenshot saved');

await page.waitForTimeout(2000);
await browser.close();
