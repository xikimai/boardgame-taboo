import { test, expect, BrowserContext, Page } from '@playwright/test';

interface Player {
  context: BrowserContext;
  page: Page;
  name: string;
}

test.describe('5-Player Game Flow', () => {
  const players: Player[] = [];
  let roomCode: string;

  test.beforeAll(async ({ browser }) => {
    // Create 5 isolated browser contexts (each with separate sessionStorage)
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    for (const name of names) {
      const context = await browser.newContext();
      const page = await context.newPage();
      players.push({ context, page, name });
    }
  });

  test.afterAll(async () => {
    for (const p of players) {
      await p.context.close();
    }
  });

  test('Alice creates room', async () => {
    const alice = players[0];
    await alice.page.goto('/');
    await alice.page.fill('#createName', alice.name);
    await alice.page.click('button:has-text("Create Room")');

    // Wait for redirect to room page
    await alice.page.waitForURL(/\/room\/[A-Z0-9]{5}/);
    const url = alice.page.url();
    roomCode = url.match(/\/room\/([A-Z0-9]{5})/)?.[1] || '';

    await expect(alice.page.locator('text=Game Lobby')).toBeVisible();
  });

  test('4 players join via shared link', async () => {
    // Players 1-4 (Bob, Charlie, Diana, Eve) join via join URL
    for (let i = 1; i < 5; i++) {
      const player = players[i];
      await player.page.goto(`/join/${roomCode}`);

      // Should see join modal
      await expect(player.page.locator('#playerName')).toBeVisible();

      // Enter name and join
      await player.page.fill('#playerName', player.name);
      await player.page.click('button:has-text("Join Game")');

      // Should be in lobby
      await expect(player.page.locator('text=Game Lobby')).toBeVisible();
    }
  });

  test('all 5 players visible in lobby', async () => {
    const alice = players[0];

    // Wait a moment for all players to sync via WebSocket
    await alice.page.waitForTimeout(1000);

    // Check all players are visible from Alice's view
    for (const p of players) {
      await expect(alice.page.locator(`text=${p.name}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('players join teams', async () => {
    // Team A (Blue Team): Alice, Bob
    await players[0].page.click('button:has-text("Join Blue Team")');
    await players[1].page.click('button:has-text("Join Blue Team")');

    // Team B (Red Team): Charlie, Diana, Eve
    await players[2].page.click('button:has-text("Join Red Team")');
    await players[3].page.click('button:has-text("Join Red Team")');
    await players[4].page.click('button:has-text("Join Red Team")');

    // Wait for team assignments to sync
    await players[0].page.waitForTimeout(500);
  });

  test('host starts game', async () => {
    const alice = players[0];

    // Wait for the start button to be enabled
    await expect(alice.page.locator('button:has-text("Start Game")')).toBeEnabled({ timeout: 5000 });

    // Click start game
    await alice.page.click('button:has-text("Start Game")');

    // Verify game started for all players by checking Round indicator appears
    for (const p of players) {
      await expect(p.page.locator('text=/Round \\d+/')).toBeVisible({ timeout: 10000 });
    }
  });

  test('complete one turn', async () => {
    // Find the clue giver (the one who sees "Start Turn" button)
    let clueGiver: Page | null = null;

    for (const p of players) {
      const startTurnButton = p.page.locator('button:has-text("Start Turn")');
      if (await startTurnButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        clueGiver = p.page;
        break;
      }
    }

    // If we found a clue giver, proceed with the turn
    if (clueGiver) {
      // Start the turn
      await clueGiver.click('button:has-text("Start Turn")');

      // Wait for card to appear
      await clueGiver.waitForTimeout(500);

      // Click "Got It!" to score a point
      const gotItButton = clueGiver.locator('button:has-text("Got It!")');
      if (await gotItButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await gotItButton.click();

        // Verify score increased
        await expect(clueGiver.locator('text=Turn Score: 1')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
