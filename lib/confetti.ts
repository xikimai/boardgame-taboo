import confetti from 'canvas-confetti';

/**
 * Fire a celebratory confetti burst for the winning team.
 * Multiple bursts create a dramatic celebration effect.
 */
export function fireWinConfetti(teamColor: string): void {
  // Center burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [teamColor, '#ffffff', '#ffd700'],
  });

  // Side bursts after a short delay
  setTimeout(() => {
    // Left side burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: [teamColor, '#ffffff'],
    });
    // Right side burst
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: [teamColor, '#ffffff'],
    });
  }, 250);
}

/**
 * Fire a gentle dual-color sparkle for tie games.
 * Both team colors mixed in a more subdued effect.
 */
export function fireTieConfetti(teamAColor: string, teamBColor: string): void {
  const colors = [teamAColor, teamBColor, '#ffffff', '#c0c0c0'];

  // Gentle center burst
  confetti({
    particleCount: 60,
    spread: 100,
    origin: { y: 0.5 },
    colors,
    gravity: 0.8,
  });

  // Slower side sparkles
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.5 },
      colors,
      gravity: 0.7,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.5 },
      colors,
      gravity: 0.7,
    });
  }, 300);
}
