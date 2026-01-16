/**
 * Test script to simulate a Taboo game with multiple players
 * Run with: npx tsx scripts/test-game.ts
 */

import PartySocket from 'partysocket';

const PARTYKIT_HOST = 'localhost:1999';
const ROOM_CODE = 'TEST' + Math.random().toString(36).substring(2, 5).toUpperCase();

interface Player {
  name: string;
  team: 'A' | 'B';
  socket: PartySocket;
  id?: string;
}

interface GameInfo {
  activeTeam?: 'A' | 'B';
  clueGiverId?: string;
}

const gameInfo: GameInfo = {};

const players: Player[] = [
  { name: 'Alice', team: 'A', socket: null as any },
  { name: 'Bob', team: 'A', socket: null as any },   // Should be guesser when Team A active
  { name: 'Charlie', team: 'B', socket: null as any },
];

function log(player: string, message: string) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${player.padEnd(10)} | ${message}`);
}

function createSocket(roomCode: string): PartySocket {
  return new PartySocket({
    host: PARTYKIT_HOST,
    room: roomCode,
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('\n========================================');
  console.log(`  TABOO GAME TEST - Room: ${ROOM_CODE}`);
  console.log('========================================\n');

  // Connect all players
  console.log('--- Connecting and joining room ---\n');

  for (const player of players) {
    player.socket = createSocket(ROOM_CODE);

    player.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'ROOM_STATE') {
        player.id = msg.payload.playerId;
        log(player.name, `Connected (ID: ${player.id?.substring(0, 8)})`);
      } else if (msg.type === 'GAME_STARTED') {
        gameInfo.activeTeam = msg.payload.game.currentTurn.activeTeam;
        gameInfo.clueGiverId = msg.payload.game.currentTurn.clueGiverId;
        const clueGiver = players.find(p => p.id === gameInfo.clueGiverId);
        log(player.name, `Game started! Active team: ${gameInfo.activeTeam}, Clue giver: ${clueGiver?.name}`);
      } else if (msg.type === 'CARD_CHANGED') {
        const role = getRole(player);
        if (msg.payload.card) {
          log(player.name, `[${role}] SEES CARD: "${msg.payload.card.targetWord}"`);
        } else {
          log(player.name, `[${role}] Does NOT see card (null) ✓`);
        }
      } else if (msg.type === 'TURN_STARTED') {
        const role = getRole(player);
        if (msg.payload.card) {
          log(player.name, `[${role}] Turn started - SEES: "${msg.payload.card.targetWord}"`);
        } else {
          log(player.name, `[${role}] Turn started - NO card visible ✓`);
        }
      }
    };

    await sleep(100);
  }

  await sleep(500);

  // Join room
  for (const player of players) {
    player.socket.send(JSON.stringify({
      type: 'JOIN_ROOM',
      payload: { playerName: player.name }
    }));
    await sleep(200);
  }

  await sleep(500);

  // Select teams
  console.log('\n--- Selecting teams ---\n');

  for (const player of players) {
    player.socket.send(JSON.stringify({
      type: 'SELECT_TEAM',
      payload: { team: player.team }
    }));
    log(player.name, `Joined Team ${player.team}`);
    await sleep(200);
  }

  await sleep(500);

  // Start game
  console.log('\n--- Starting game ---\n');

  players[0].socket.send(JSON.stringify({ type: 'START_GAME' }));

  await sleep(1000);

  // Find who should start the turn
  const clueGiver = players.find(p => p.id === gameInfo.clueGiverId);

  console.log('\n--- Starting turn ---\n');
  console.log(`Active Team: ${gameInfo.activeTeam}`);
  console.log(`Clue Giver: ${clueGiver?.name} (Team ${clueGiver?.team})`);
  console.log('');

  if (clueGiver) {
    clueGiver.socket.send(JSON.stringify({ type: 'START_TURN' }));
  }

  await sleep(1000);

  // Summary
  console.log('\n========================================');
  console.log('  TEST RESULTS');
  console.log('========================================\n');

  if (gameInfo.activeTeam === 'A') {
    console.log('Team A is active:');
    console.log('  - Alice (Team A) = Clue Giver → Should SEE card');
    console.log('  - Bob (Team A) = GUESSER → Should NOT see card');
    console.log('  - Charlie (Team B) = Opponent → Should SEE card');
  } else {
    console.log('Team B is active:');
    console.log('  - Charlie (Team B) = Clue Giver → Should SEE card');
    console.log('  - Alice (Team A) = Opponent → Should SEE card');
    console.log('  - Bob (Team A) = Opponent → Should SEE card');
  }

  console.log('\nCheck logs above to verify card visibility matches expectations.\n');

  // Cleanup
  await sleep(500);
  for (const player of players) {
    player.socket.close();
  }

  process.exit(0);
}

function getRole(player: Player): string {
  if (!gameInfo.activeTeam) return 'unknown';

  if (player.id === gameInfo.clueGiverId) {
    return 'CLUE-GIVER';
  } else if (player.team === gameInfo.activeTeam) {
    return 'GUESSER';
  } else {
    return 'OPPONENT';
  }
}

runTest().catch(console.error);
