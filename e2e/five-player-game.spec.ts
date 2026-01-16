import { test, expect, BrowserContext, Page } from '@playwright/test';

interface Player {
  context: BrowserContext;
  page: Page;
  name: string;
}

test.describe.serial('5-Player Game Flow', () => {
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
    await alice.page.click('[data-testid="create-room-button"]');

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
    const alice = players[0];

    // Team A (Blue Team): Alice, Bob
    await alice.page.click('button:has-text("Join Blue Team")');
    await players[1].page.click('button:has-text("Join Blue Team")');

    // Team B (Red Team): Charlie, Diana, Eve
    await players[2].page.click('button:has-text("Join Red Team")');
    await players[3].page.click('button:has-text("Join Red Team")');
    await players[4].page.click('button:has-text("Join Red Team")');

    // Verify from Alice's (host) perspective that both teams have players
    // When both teams have players, the button text changes from
    // "Each team needs at least 1 player" to "Start Game"
    await expect(
      alice.page.locator('button:has-text("Start Game"):not(:has-text("needs"))')
    ).toBeVisible({ timeout: 10000 });
  });

  test('host configures game settings', async () => {
    const alice = players[0];

    // Wait for Game Settings section to be visible (only shown to host)
    await expect(alice.page.locator('text=Game Settings')).toBeVisible({ timeout: 10000 });

    // Set 10-second turns and 4 rounds for fast test execution (~80 seconds total)
    await alice.page.click('[data-testid="duration-10"]');
    await alice.page.click('[data-testid="rounds-4"]');

    // Verify settings are applied by checking buttons have the selected class
    // The selected button has bg-violet-500 class
    await expect(alice.page.locator('[data-testid="duration-10"]')).toHaveClass(/bg-violet-500/, { timeout: 5000 });
    await expect(alice.page.locator('[data-testid="rounds-4"]')).toHaveClass(/bg-violet-500/, { timeout: 5000 });
  });

  test('host starts game', async () => {
    const alice = players[0];

    // Wait for the start button to be enabled (both teams need players synced via WebSocket)
    const startButton = alice.page.locator('button:has-text("Start Game")');
    await expect(startButton).toBeEnabled({ timeout: 10000 });

    // Click start game (force: true to bypass animation stability check)
    await startButton.click({ force: true });

    // Verify game started for all players by checking Round indicator appears
    for (const p of players) {
      await expect(p.page.locator('text=/Round \\d+/')).toBeVisible({ timeout: 10000 });
    }
  });

  // Play through game until completion
  test('play through 4 rounds to game completion', async () => {
    test.setTimeout(300000); // 5 minutes

    // Give WebSocket time to sync game state after game starts
    await players[0].page.waitForTimeout(3000);

    // Play turns until game ends (max 20 turns to prevent infinite loop)
    for (let turn = 1; turn <= 20; turn++) {
      // Check if game is over
      await players[0].page.bringToFront();
      const gameOver = await players[0].page.locator('text=/Wins!|Tie/').isVisible().catch(() => false);
      if (gameOver) {
        break;
      }

      // Find clue giver by parsing game state
      await players[0].page.waitForTimeout(500);
      const clueGiverText = await players[0].page.locator('p:has-text("is giving clues")').textContent({ timeout: 10000 }).catch(() => null);

      if (!clueGiverText) {
        // Game might be transitioning, wait and check for game over
        await players[0].page.waitForTimeout(2000);
        const gameOverCheck = await players[0].page.locator('text=/Wins!|Tie/').isVisible().catch(() => false);
        if (gameOverCheck) {
          break;
        }
        throw new Error(`Could not find clue giver text for turn ${turn}`);
      }

      const clueGiverName = clueGiverText.replace(' is giving clues', '').trim();
      const clueGiverPlayer = players.find(p => p.name === clueGiverName);

      if (!clueGiverPlayer) {
        throw new Error(`Unknown clue giver "${clueGiverName}" for turn ${turn}`);
      }

      // Switch to the clue giver's page and click Start Turn
      await clueGiverPlayer.page.bringToFront();
      await clueGiverPlayer.page.waitForTimeout(1000);
      const clueGiver = clueGiverPlayer.page;

      // Start the turn
      const startBtn = clueGiver.getByRole('button', { name: 'Start Turn' });
      await startBtn.waitFor({ state: 'visible', timeout: 5000 });
      await startBtn.click({ force: true });

      // Verify turn started - "Got It!" button should appear
      const gotItBtn = clueGiver.locator('button:has-text("Got It!")');
      await gotItBtn.waitFor({ state: 'visible', timeout: 5000 });

      // Play some cards - score 1-2 points per turn
      for (let card = 0; card < 2; card++) {
        if (await gotItBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await gotItBtn.click({ force: true });
          await clueGiver.waitForTimeout(300);
        }
      }

      // Wait for turn to end (timer expires after 10s)
      await players[0].page.waitForTimeout(12000);
    }

    // Verify game over screen appears
    await players[0].page.bringToFront();
    await expect(players[0].page.locator('text=/Wins!|Tie/')).toBeVisible({ timeout: 15000 });
  });

  test('game over shows final scores and winner', async () => {
    const alice = players[0];

    // Verify game over screen elements
    await expect(alice.page.locator('text=/Blue Team Wins|Red Team Wins|Tie/')).toBeVisible();
    await expect(alice.page.locator('text=Turns Played')).toBeVisible();
    await expect(alice.page.locator('text=Cards Guessed')).toBeVisible();

    // Host should see "Play Again" button
    await expect(alice.page.locator('button:has-text("Play Again")')).toBeVisible();
  });
});
