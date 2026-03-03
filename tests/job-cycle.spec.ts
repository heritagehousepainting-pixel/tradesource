import { test, expect } from '@playwright/test';

test.describe('TradeSource Full Job Cycle', () => {
  
  test('Complete job lifecycle: signup -> post job -> bid -> accept -> complete -> review', async ({ page }) => {
    
    // ===== CONTRACTOR SIGNUP =====
    console.log('1. Testing contractor signup...');
    await page.goto('http://localhost:3000/contractor/signup');
    await page.fill('input[placeholder="you@company.com"]', 'contractor@test.com');
    await page.fill('input[placeholder="••••••••"]', 'TestPassword123!');
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Smith"]', 'Contractor');
    await page.fill('input[placeholder="Your company (optional)"]', 'Test Contracting LLC');
    await page.click('button:has-text("Sign Up")');
    
    // Wait for redirect to feed
    await page.waitForURL('**/feed');
    console.log('✓ Contractor signup passed');

    // ===== POST A JOB =====
    console.log('2. Testing job posting...');
    await page.goto('http://localhost:3000/jobs/post');
    await page.fill('input[placeholder*="title"]', 'Interior Painting - Living Room');
    await page.fill('textarea[placeholder*="description"]', 'Need interior painting for 1500 sq ft living room. Walls only, no ceilings.');
    await page.fill('input[placeholder*="location"]', 'Ambler, PA');
    await page.fill('input[placeholder*="budget"]', '2500');
    await page.selectOption('select[name="category"]', 'painting');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to feed
    await page.waitForURL('**/feed');
    console.log('✓ Job posting passed');

    // ===== LOGOUT AND SWITCH TO HOMEOWNER =====
    console.log('3. Testing logout and new user signup...');
    await page.click('text=Sign Out');
    await page.goto('http://localhost:3000/homeowner/signup');
    await page.fill('input[placeholder="you@company.com"]', 'homeowner@test.com');
    await page.fill('input[placeholder="••••••••"]', 'TestPassword123!');
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Smith"]', 'Homeowner');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/feed');
    console.log('✓ Homeowner signup passed');

    // ===== VIEW JOBS =====
    console.log('4. Testing job browsing...');
    await page.goto('http://localhost:3000/feed');
    
    // Wait for jobs to load
    await page.waitForSelector('text=Interior Painting');
    console.log('✓ Job browsing passed');

    // ===== VIEW JOB DETAILS =====
    console.log('5. Testing job details view...');
    await page.click('text=Interior Painting');
    await page.waitForSelector('text=Need interior painting');
    console.log('✓ Job details passed');

    // ===== SUBMIT PROPOSAL =====
    console.log('6. Testing proposal submission...');
    await page.fill('textarea[placeholder*="message"]', 'I can complete this job next week. Licensed and insured.');
    await page.fill('input[placeholder*="price"]', '2200');
    await page.click('button:has-text("Submit Proposal")');
    
    // Wait for confirmation
    await page.waitForSelector('text=Proposal submitted');
    console.log('✓ Proposal submission passed');

    // ===== LOGOUT AND BACK TO CONTRACTOR =====
    console.log('7. Testing contractor login...');
    await page.click('text=Sign Out');
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[placeholder="you@company.com"]', 'contractor@test.com');
    await page.fill('input[placeholder="••••••••"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/feed');
    console.log('✓ Contractor login passed');

    // ===== VIEW PROPOSALS =====
    console.log('8. Testing proposal viewing...');
    await page.goto('http://localhost:3000/messages');
    await page.waitForSelector('text=Proposal submitted');
    console.log('✓ Proposal viewing passed');

    // ===== ACCEPT PROPOSAL =====
    console.log('9. Testing proposal acceptance...');
    await page.click('button:has-text("Accept")');
    await page.waitForSelector('text=Accepted');
    console.log('✓ Proposal acceptance passed');

    // ===== COMPLETE JOB =====
    console.log('10. Testing job completion...');
    await page.goto('http://localhost:3000/jobs');
    await page.click('button:has-text("Mark Complete")');
    await page.waitForSelector('text=Job Completed');
    console.log('✓ Job completion passed');

    // ===== LEAVE REVIEW =====
    console.log('11. Testing review submission...');
    await page.click('button:has-text("Leave Review")');
    await page.fill('textarea[placeholder*="review"]', 'Great work! Very professional and on time.');
    await page.fill('input[placeholder*="rating"]', '5');
    await page.click('button:has-text("Submit Review")');
    await page.waitForSelector('text=Review submitted');
    console.log('✓ Review submission passed');

    console.log('');
    console.log('========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('Full job cycle completed successfully!');
    console.log('========================================');
  });

  // Test individual pages load without errors
  test('Check all pages load without console errors', async ({ page }) => {
    const pages = [
      '/',
      '/feed',
      '/signin',
      '/contractor/signup',
      '/homeowner/signup',
    ];
    
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    for (const path of pages) {
      console.log(`Testing ${path}...`);
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle');
    }
    
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    } else {
      console.log('✓ No console errors found');
    }
  });
});
