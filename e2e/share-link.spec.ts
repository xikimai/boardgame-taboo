import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Share Link Feature', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;
  let roomCode: string;

  test.beforeAll(async ({ browser }) => {
    // Create isolated browser contexts (separate sessionStorage)
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
  });

  test.afterAll(async () => {
    await hostContext.close();
    await guestContext.close();
  });

  test('host creates room and share button works', async () => {
    await hostPage.goto('/');

    // Fill in name and create room
    await hostPage.fill('#createName', 'Alice');
    await hostPage.click('button:has-text("Create Room")');

    // Wait for lobby and extract room code from the URL
    await hostPage.waitForURL(/\/room\/[A-Z0-9]{5}/);
    const url = hostPage.url();
    roomCode = url.match(/\/room\/([A-Z0-9]{5})/)?.[1] || '';
    expect(roomCode).toMatch(/^[A-Z0-9]{5}$/);

    // Verify we're in the lobby
    await expect(hostPage.locator('text=Game Lobby')).toBeVisible();

    // Click share button and verify toast appears
    await hostPage.click('button:has-text("Share Invite Link")');
    await expect(hostPage.locator('text=Link copied')).toBeVisible({ timeout: 5000 });
  });

  test('guest joins via direct URL and sees name modal', async () => {
    // Navigate directly to join URL (simulating shared link)
    await guestPage.goto(`/join/${roomCode}`);

    // Should see join modal with name input
    await expect(guestPage.locator('text=Join Game')).toBeVisible();
    await expect(guestPage.locator('#playerName')).toBeVisible();
  });

  test('guest enters name and joins lobby', async () => {
    // Enter name and join
    await guestPage.fill('#playerName', 'Bob');
    await guestPage.click('button:has-text("Join Game")');

    // Should be in lobby
    await expect(guestPage.locator('text=Game Lobby')).toBeVisible();

    // Host should see Bob in the player list
    await expect(hostPage.locator('text=Bob')).toBeVisible({ timeout: 5000 });
  });
});
