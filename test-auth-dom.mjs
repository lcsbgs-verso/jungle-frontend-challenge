import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:4173/entrar?next=/perfil');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

const dialog = page.locator('[role="dialog"]');
const dialogCount = await dialog.count();
console.log('Dialog count:', dialogCount);

if (dialogCount > 0) {
  const ariaLabel = await dialog.first().getAttribute('aria-label');
  console.log('Dialog aria-label:', ariaLabel);
  
  const emailInput = dialog.locator('input[aria-label="E-mail"]');
  const emailCount = await emailInput.count();
  console.log('Email input count:', emailCount);
  
  const senhaInput = dialog.locator('input[aria-label="Senha"]');
  const senhaCount = await senhaInput.count();
  console.log('Senha input count:', senhaCount);
  
  await page.screenshot({ path: '/opt/cursor/artifacts/auth-dom-608aad7.png' });
  console.log('Screenshot saved');
}

await browser.close();
