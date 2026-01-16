# Taboo - Online Word Guessing Game

A real-time multiplayer Taboo game built with Next.js, PartyKit, and Tailwind CSS.

## Features

- **Online Multiplayer**: Create rooms with shareable codes
- **Real-time Sync**: All game state synchronized via WebSocket
- **Two Teams**: Blue Team vs Red Team
- **200 Cards**: Curated word cards across various categories
- **Role-based Views**: Different UI for clue-giver, guesser, and opponent
- **Buzzer System**: Opponents can buzz when taboo words are used

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS
- **Real-time**: PartyKit (WebSocket server)
- **Deployment**: Vercel (frontend) + PartyKit (backend)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start both servers (in separate terminals):
```bash
# Terminal 1: PartyKit server
npm run dev:party

# Terminal 2: Next.js app
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

3. Open http://localhost:3000

## How to Play

1. **Create a Room**: Enter your name and click "Create Room"
2. **Share the Code**: Give the 5-letter room code to friends
3. **Join Teams**: Players select Blue Team or Red Team
4. **Start Game**: Host clicks "Start Game" (needs 1+ player per team)
5. **Play**:
   - Clue-giver describes the word without saying taboo words
   - Teammates guess the word
   - Opponents can BUZZ if a taboo word is used
6. **Score**: Points for each correct guess. Most points wins!

## Deployment

### 1. Deploy PartyKit Server

```bash
npx partykit deploy
```

Note the URL (e.g., `taboo-game.your-username.partykit.dev`)

### 2. Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variable:
   - `NEXT_PUBLIC_PARTYKIT_HOST` = `taboo-game.your-username.partykit.dev`
4. Deploy!

Or use Vercel CLI:
```bash
vercel --prod
```

## Project Structure

```
├── app/                    # Next.js pages
│   ├── page.tsx           # Home page (create/join)
│   └── room/[roomCode]/   # Game room page
├── party/                  # PartyKit server
│   └── index.ts           # Game logic
├── lib/
│   ├── game/              # Game utilities
│   └── hooks/             # React hooks (useRoom, useTimer)
├── types/                  # TypeScript types
└── data/
    └── cards.json         # 200 Taboo cards
```

## License

MIT
