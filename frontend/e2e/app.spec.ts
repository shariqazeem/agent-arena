import { test, expect } from '@playwright/test';

test.describe('Agent Arena E2E Tests', () => {

  test('Dashboard page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agent Arena/);
    await expect(page.locator('h1:has-text("Agent Arena")')).toBeVisible();
  });

  test('Dashboard shows network badges', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Avalanche Fuji')).toBeVisible();
    await expect(page.locator('text=x402 Protocol')).toBeVisible();
    await expect(page.locator('text=USDC')).toBeVisible();
    await expect(page.locator('text=Chainlink')).toBeVisible();
  });

  test('Dashboard shows stat cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Active Agents')).toBeVisible();
    await expect(page.locator('text=Transactions')).toBeVisible();
    await expect(page.locator('text=USDC Volume')).toBeVisible();
    await expect(page.locator('text=Avg Reputation')).toBeVisible();
  });

  test('Dashboard shows orchestration flow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Orchestration Flow')).toBeVisible();
    await expect(page.locator('text=Run Orchestration')).toBeVisible();
  });

  test('Agents page loads with marketplace', async ({ page }) => {
    await page.goto('/agents');
    await expect(page.locator('h1:has-text("Agent Marketplace")')).toBeVisible();
    await expect(page.locator('text=All Agents')).toBeVisible();
  });

  test('Deploy page loads with form', async ({ page }) => {
    await page.goto('/deploy');
    await expect(page.locator('h1:has-text("Deploy an Agent")')).toBeVisible();
    await expect(page.locator('text=Agent Name')).toBeVisible();
    await expect(page.locator('text=Service Type')).toBeVisible();
  });

  test('Activity page loads', async ({ page }) => {
    await page.goto('/activity');
    await expect(page.locator('h1:has-text("Activity Feed")')).toBeVisible();
  });

  test('Header navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav >> text=Agents').first().click();
    await expect(page).toHaveURL('/agents');
    await page.locator('nav >> text=Deploy').first().click();
    await expect(page).toHaveURL('/deploy');
    await page.locator('nav >> text=Activity').first().click();
    await expect(page).toHaveURL('/activity');
    await page.locator('nav >> text=Dashboard').first().click();
    await expect(page).toHaveURL('/');
  });

  test('Connect Wallet button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Connect Wallet')).toBeVisible();
  });

  test('Mobile bottom navigation is visible on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const bottomNav = page.locator('nav.fixed');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.locator('text=Dashboard')).toBeVisible();
    await expect(bottomNav.locator('text=Agents')).toBeVisible();
    await expect(bottomNav.locator('text=Deploy')).toBeVisible();
    await expect(bottomNav.locator('text=Activity')).toBeVisible();
  });

  test('Agent detail page loads for agent 0', async ({ page }) => {
    await page.goto('/agents/0');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('h1').count() > 0;
    const hasSkeleton = await page.locator('.shimmer').count() > 0;
    expect(hasContent || hasSkeleton).toBeTruthy();
  });
});
