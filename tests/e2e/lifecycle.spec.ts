import fs from 'fs';
import { test, expect } from '@playwright/test';
import { query } from '../../src/db.js';
import { hashPassword } from '../../src/auth/passwords.js';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore if already loaded
  }
}

test.describe('Shopfront Full Lifecycle E2E Test (SPRINT-6.5)', () => {
  const ts = Date.now();
  const adminUsername = `admin_e2e_${ts}`.slice(0, 30);
  const adminPassword = 'AdminSecurePass123!';
  const ownerUsername = `owner_e2e_${ts}`.slice(0, 30);
  const ownerNewPassword = 'OwnerSecurePass123!';
  const shopName = `E2E Salon ${ts}`;
  const shopSlug = `e2e-salon-${ts}`.slice(0, 30);

  test.beforeAll(async () => {
    // Create an active admin user in the database
    const adminHash = await hashPassword(adminPassword);
    await query(
      `INSERT INTO users (username, password_hash, display_name, role, is_active, must_change_password)
       VALUES ($1, $2, 'E2E Admin User', 'admin', TRUE, FALSE);`,
      [adminUsername, adminHash]
    );
  });

  test.afterAll(async () => {
    // Clean up test shop and users
    await query(`DELETE FROM shops WHERE slug = $1;`, [shopSlug]);
    await query(`DELETE FROM users WHERE username IN ($1, $2);`, [adminUsername, ownerUsername]);
  });

  test('executes end-to-end admin setup -> owner onboarding -> customer discovery -> pause cycle', async ({
    page,
    context,
  }) => {
    test.setTimeout(90000);
    // Handle any confirm/alert dialogs automatically
    page.on('dialog', (dialog) => dialog.accept());

    // ----------------------------------------------------
    // Step 1: Admin logs in
    // ----------------------------------------------------
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Shopfront Sign In');
    await page.fill('input[name="username"]', adminUsername);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should redirect to admin portal
    await page.waitForURL('**/admin**');

    // ----------------------------------------------------
    // Step 2: Admin creates Owner account
    // ----------------------------------------------------
    await page.goto('/admin/owners/new');
    await page.fill('input[name="username"]', ownerUsername);
    await page.fill('input[name="display_name"]', 'E2E Salon Owner');
    await page.click('button[type="submit"]:has-text("Generate Owner Account")');

    // Grab one-time temporary password from <code> element
    const codeLocator = page.locator('code');
    await expect(codeLocator).toBeVisible();
    const temporaryPassword = (await codeLocator.innerText()).trim();
    expect(temporaryPassword.length).toBeGreaterThanOrEqual(8);

    // ----------------------------------------------------
    // Step 3: Admin creates Shop assigned to the Owner
    // ----------------------------------------------------
    await page.goto('/admin/shops/new');
    await page.fill('input[name="name"]', shopName);
    await page.fill('input[name="slug"]', shopSlug);
    await page.selectOption('select[name="category"]', 'salon_wellness');
    await page.fill(
      'textarea[name="description"]',
      'Premium modern grooming salon in Adyar providing executive haircuts.'
    );
    await page.fill('input[name="address"]', '15 Sardar Patel Road, Adyar, Chennai');
    await page.selectOption('select[name="locality_id"]', '1'); // Adyar
    await page.fill('input[name="phone"]', '+914424419999');
    await page.selectOption('select[name="action_mode"]', 'whatsapp');
    await page.fill('input[name="whatsapp"]', '+919840199999');

    // Select the newly created owner
    await page.selectOption('select[name="owner_id"]', {
      label: `E2E Salon Owner (${ownerUsername})`,
    });

    await page.click('button[type="submit"]:has-text("Create Shop")');
    await expect(page.locator('h1')).toContainText(`Manage Listing: ${shopName}`);

    // Confirm shop row exists in draft status
    await page.goto('/admin/shops');
    const shopRow = page.locator(`tr:has-text("${shopName}")`);
    await expect(shopRow).toBeVisible();
    await expect(shopRow).toContainText('DRAFT');

    // ----------------------------------------------------
    // Step 4: Owner logs in with temporary password & changes password
    // ----------------------------------------------------
    await context.clearCookies();
    await page.goto('/login');
    await page.fill('input[name="username"]', ownerUsername);
    await page.fill('input[name="password"]', temporaryPassword);
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Guard forces redirect to /owner/change-password
    await page.waitForURL('**/owner/change-password');
    await page.fill('input[name="new_password"]', ownerNewPassword);
    await page.fill('input[name="confirm_password"]', ownerNewPassword);
    await page.click('button[type="submit"]:has-text("Save Password")');

    // Password changed successfully; redirected to /owner
    await expect(page.locator('h1')).toContainText(shopName);

    // ----------------------------------------------------
    // Step 5: Owner adds catalog item and weekly hours
    // ----------------------------------------------------
    // 5a. Add Catalog Item
    await page.goto('/owner/menu');
    await page.click('button:has-text("+ Add New Item")');
    await page.fill('input[name="group_name"]', 'Haircuts');
    await page.fill('input[name="name"]', 'Deluxe Executive Haircut');
    await page.fill('input[name="price_inr"]', '450');
    await page.click('button[type="submit"]:has-text("Add Item")');

    // Item should appear in catalog list
    await expect(page.locator('text=Deluxe Executive Haircut')).toBeVisible();

    // 5b. Add Weekly Hours
    await page.goto('/owner/hours');
    // Click "+ Add Shift" on Monday
    const addShiftButtons = page.locator('button:has-text("+ Add Shift")');
    await addShiftButtons.first().click();
    await page.click('button:has-text("Save Weekly Hours")');
    await expect(page.locator('text=Weekly hours saved successfully')).toBeVisible();

    // ----------------------------------------------------
    // Step 6: Admin makes shop Live
    // ----------------------------------------------------
    await context.clearCookies();
    await page.goto('/login');
    await page.fill('input[name="username"]', adminUsername);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/admin**');

    await page.goto('/admin/shops');
    const liveShopRow = page.locator(`tr:has-text("${shopName}")`);
    await expect(liveShopRow).toBeVisible();
    await liveShopRow.locator('button:has-text("Make Live")').click();

    // Status changes to live
    await expect(liveShopRow).toContainText('LIVE');

    // ----------------------------------------------------
    // Step 7: Customer searches for shop on public web /
    // ----------------------------------------------------
    await context.clearCookies();
    await page.goto('/');

    // Select Adyar locality
    await page.selectOption('select#search-locality', 'Adyar');
    await page.fill('input#search-query', 'Deluxe Executive Haircut');
    await page.click('button[type="submit"]:has-text("Search")');

    // Search results should show the live shop
    const shopCard = page.locator(`div:has-text("${shopName}")`);
    await expect(shopCard.first()).toBeVisible();
    await expect(page.locator('text=₹450').first()).toBeVisible();

    // ----------------------------------------------------
    // Step 8: Customer visits public shop detail page /shop/[slug]
    // ----------------------------------------------------
    await page.goto(`/shop/${shopSlug}`);
    await expect(page.locator('h1')).toContainText(shopName);
    await expect(page.locator('text=15 Sardar Patel Road, Adyar')).toBeVisible();
    await expect(page.locator('text=Deluxe Executive Haircut')).toBeVisible();
    await expect(page.locator('text=₹450').first()).toBeVisible();
    await expect(page.locator('text=Opens direct enquiry with the business')).toBeVisible();
    await expect(page.locator('a:has-text("Chat on WhatsApp")')).toBeVisible();

    // ----------------------------------------------------
    // Step 9: Owner pauses listing
    // ----------------------------------------------------
    await context.clearCookies();
    await page.goto('/login');
    await page.fill('input[name="username"]', ownerUsername);
    await page.fill('input[name="password"]', ownerNewPassword);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/owner**');

    await page.goto('/owner/account');
    await page.click('button:has-text("Pause Listing")');
    await expect(page.locator('button:has-text("Resume Listing")')).toBeVisible();

    // ----------------------------------------------------
    // Step 10: Customer verifies shop is removed from search & returns 404
    // ----------------------------------------------------
    await context.clearCookies();
    await page.goto('/');
    await page.selectOption('select#search-locality', 'Adyar');
    await page.fill('input#search-query', 'Deluxe Executive Haircut');
    await page.click('button[type="submit"]:has-text("Search")');

    // Shop should NOT be found
    await expect(page.locator(`text=${shopName}`)).toHaveCount(0);

    // Navigating directly to /shop/[slug] should return 404
    const response = await page.goto(`/shop/${shopSlug}`);
    expect(response?.status()).toBe(404);
  });
});
