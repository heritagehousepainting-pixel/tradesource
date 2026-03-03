import { test, expect } from '@playwright/test';

test.describe('TradeSource Page Tests', () => {
  
  test('Check all pages load without console errors', async ({ page }) => {
    const pages = [
      '/',
      '/feed',
      '/signin',
      '/contractor/signup',
      '/homeowner/signup',
    ];

    for (const path of pages) {
      console.log(`Testing ${path}...`);
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle');
      
      expect(errors).toHaveLength(0);
      console.log(`✓ ${path} - No console errors`);
    }
  });
});
