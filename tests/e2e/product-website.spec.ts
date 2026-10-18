import { test, expect } from '@playwright/test';
import { query } from '../../src/db.js';

test.describe('Commercial Product Website User Journeys (SPRINT-8.6)', () => {
  const testPhone = '+919988112233';
  const testWhatsapp = '+919988112233';
  let createdShopId: string | null = null;

  test.afterAll(async () => {
    if (createdShopId) {
      await query('DELETE FROM audit_log WHERE entity_id = $1', [createdShopId]);
      await query('DELETE FROM shops WHERE id = $1', [createdShopId]);
    }
    await query('DELETE FROM audit_log WHERE entity_id IN (SELECT id::text FROM shops WHERE phone = $1)', [testPhone]);
    await query('DELETE FROM shops WHERE phone = $1', [testPhone]);
  });

  test('1. Landing page loads with navigation, localities and search bar', async ({ page }) => {
    await page.goto('/');

    // Verify brand and navigation links
    await expect(page.locator('text=Shopfront').first()).toBeVisible();
    await expect(page.locator('a:has-text("Discover Shops")').first()).toBeVisible();
    await expect(page.locator('a:has-text("For Merchants")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Developers & MCP")').first()).toBeVisible();

    // Verify Hero headline
    await expect(page.locator('h1:has-text("Find Trusted Local Shops in Chennai")')).toBeVisible();

    // Verify Locality dropdown and query input exist
    await expect(page.locator('select#search-locality')).toBeVisible();
    await expect(page.locator('input#search-query')).toBeVisible();

    // Verify 32 localities section
    await expect(page.locator('h2:has-text("Explore All 32 Chennai Localities")')).toBeVisible();
    await expect(page.locator('button:has-text("Adyar")').first()).toBeVisible();
    await expect(page.locator('button:has-text("T. Nagar")').first()).toBeVisible();
  });

  test('2. Developer portal provides interactive MCP playground and copyable configs', async ({ page }) => {
    await page.goto('/developers');

    // Verify 301 redirect to /connect and headline
    await expect(page).toHaveURL(/.*\/connect/);
    await expect(page.locator('h1:has-text("Connect")')).toBeVisible();
    await expect(page.locator('text=claude_desktop_config.json').first()).toBeVisible();

    // Verify playground
    await expect(page.locator('text=Interactive MCP Tool Playground')).toBeVisible();

    // Switch tool to get_shop_info
    const getShopInfoBtn = page.locator('button:has-text("get_shop_info()")');
    await expect(getShopInfoBtn).toBeVisible();
    await getShopInfoBtn.click();

    // Click execute
    const executeBtn = page.locator('button:has-text("Call get_shop_info")');
    await expect(executeBtn).toBeVisible();
    await executeBtn.click();

    // Wait for response viewer to display shop details
    await expect(page.locator('pre:has-text("Adyar Mac & iPhone Care")')).toBeVisible({ timeout: 10000 });
  });

  test('3. Merchant onboarding allows business application submission', async ({ page }) => {
    await page.goto('/for-merchants');

    // Verify comparison table
    await expect(page.locator('h1:has-text("Stop Paying 30% Commissions")')).toBeVisible();
    await expect(page.locator('text=0% Commission').first()).toBeVisible();

    // Fill application form
    await page.fill('input[placeholder="e.g. Adyar Mac & iPhone Care"]', 'Besant Nagar Coffee House');
    await page.fill('input[placeholder="e.g. Shop 4, Gandhi Nagar 2nd Main Road, Adyar, Chennai 600020"]', '42 Beach Road, Besant Nagar, Chennai 600090');
    await page.fill('textarea[placeholder*="Tell customers what you specialize in"]', 'Authentic filter coffee and artisanal South Indian tiffin items freshly prepared.');
    await page.fill('input[placeholder="e.g. Suresh Kumar"]', 'Venkatesh Iyer');
    await page.fill('input[placeholder="+914424410112"]', testPhone);
    await page.fill('input[placeholder="+919840110112"]', testWhatsapp);

    // Check consent
    await page.check('input[type="checkbox"][required]');

    // Submit form
    await page.click('button[type="submit"]:has-text("Submit Merchant Application")');

    // Verify confirmation view
    await expect(page.locator('text=Welcome to the Shopfront Merchant Network!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Besant Nagar Coffee House')).toBeVisible();

    // Check DB
    const res = await query<{ id: string; status: string }>(
      'SELECT id, status FROM shops WHERE phone = $1',
      [testPhone]
    );
    expect(res.rows.length).toBe(1);
    expect(res.rows[0]?.status).toBe('draft');
    createdShopId = res.rows[0]?.id || null;
  });
});
