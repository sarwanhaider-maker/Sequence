/**
 * Bot AI Controller for Sequence Game
 * 
 * Card ID ranges:
 *   1–100    : Board position cards (place chip on matching cell)
 *   101–104  : Two-eyed Jacks (JD, JC) — WILD, place anywhere empty
 *   105–108  : One-eyed Jacks (JS, JH) — remove opponent's chip (non-protected)
 * 
 * Board cell IDs: 1–100 (row * 10 + col + 1)
 * Corners (1, 10, 91, 100) are FREE wild cells — always count for any team.
 */

const CORNER_IDS = [1, 10, 91, 100];

/**
 * Returns true if a socket ID belongs to a bot player.
 */
function isBot(socketId) {
  return typeof socketId === "string" && socketId.startsWith("bot_");
}

/**
 * Get row/col for a board cell id (1-indexed).
 */
function getPos(id) {
  const row = Math.floor((id - 1) / 10);
  const col = (id - 1) % 10;
  return { row, col };
}

/**
 * Build a 10x10 board state from the cards array.
 * Returns: board[row][col] = { color: string|null, id: number, isFree: boolean }
 */
function buildBoard(boardCards) {
  const board = Array(10).fill(null).map(() => Array(10).fill(null));
  boardCards.forEach(card => {
    const { row, col } = getPos(card.id);
    const isFree = CORNER_IDS.includes(card.id);
    board[row][col] = {
      color: isFree ? "free" : (card.selected === "True" ? card.selectedby : null),
      id: card.id,
      isFree,
      isEmpty: !isFree && card.selected !== "True",
      isOccupied: !isFree && card.selected === "True",
    };
  });
  return board;
}

/**
 * Check how many chips of `color` exist in a line of cells, counting free corners.
 * Returns: { mine: count, opponent: count, empty: emptyIds[] }
 */
function analyzeLineFor(cells, myColor) {
  let mine = 0, opponent = 0;
  const emptyIds = [];
  for (const cell of cells) {
    if (!cell) continue;
    if (cell.isFree || cell.color === myColor) {
      mine++;
    } else if (cell.isEmpty) {
      emptyIds.push(cell.id);
    } else {
      opponent++;
    }
  }
  return { mine, opponent, empty: emptyIds };
}

/**
 * Get all lines of 5 on the board (rows, cols, diagonals).
 * Returns array of arrays, each containing 5 cell objects.
 */
function getAllLinesOfFive(board) {
  const lines = [];

  // Rows
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c <= 5; c++) {
      lines.push([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3], board[r][c+4]]);
    }
  }
  // Cols
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r <= 5; r++) {
      lines.push([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c], board[r+4][c]]);
    }
  }
  // Down-right diagonals
  for (let r = 0; r <= 5; r++) {
    for (let c = 0; c <= 5; c++) {
      lines.push([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3], board[r+4][c+4]]);
    }
  }
  // Up-right diagonals
  for (let r = 4; r < 10; r++) {
    for (let c = 0; c <= 5; c++) {
      lines.push([board[r][c], board[r-1][c+1], board[r-2][c+2], board[r-3][c+3], board[r-4][c+4]]);
    }
  }
  return lines;
}

/**
 * Score a specific board cell placement for `myColor`.
 * Higher = better move.
 */
function scorePlacement(cellId, board, myColor, protectedPatterns, allLines) {
  let score = 0;
  const protectedIds = new Set((protectedPatterns || []).flat());

  // Check each line containing this cell
  for (const line of allLines) {
    const ids = line.map(c => c?.id);
    if (!ids.includes(cellId)) continue;

    const { mine, opponent, empty } = analyzeLineFor(line, myColor);

    if (opponent > 0) continue; // line is blocked by opponent, skip

    // Simulate placing chip here
    const newMine = mine + 1;
    if (newMine >= 5) score += 10000; // WIN!
    else if (newMine === 4) score += 500;  // 1 away from winning
    else if (newMine === 3) score += 80;
    else if (newMine === 2) score += 20;
    else score += 5;
  }

  // Blocking: check opponent's best lines
  const opponentColors = ["blue", "red", "green"].filter(c => c !== myColor);
  for (const oppColor of opponentColors) {
    for (const line of allLines) {
      const ids = line.map(c => c?.id);
      if (!ids.includes(cellId)) continue;
      const { mine: oppMine, opponent: notOpp, empty } = analyzeLineFor(line, oppColor);
      const hasMyChip = line.some(c => c && c.color === myColor);
      if (hasMyChip) continue; // already blocked by us

      if (oppMine === 4) score += 400;  // MUST block
      else if (oppMine === 3) score += 60;
      else if (oppMine === 2) score += 10;
    }
  }

  // Avoid placing on a protected cell (shouldn't normally happen)
  if (protectedIds.has(cellId)) score -= 5000;

  return score;
}

/**
 * Find all valid placements for a regular (non-jack) hand card.
 * Returns array of board cell IDs the bot can play this card on.
 */
function getValidCellsForCard(handCard, boardCards, protectedPatterns) {
  const protectedIds = new Set((protectedPatterns || []).flat());
  const validCells = [];

  for (const cell of boardCards) {
    if (CORNER_IDS.includes(cell.id)) continue; // corners are free, not playable
    if (cell.selected === "True") continue; // already occupied
    if (protectedIds.has(cell.id)) continue; // protected

    // Regular card matches by code
    if (cell.code === handCard.code ||
        (handCard.matches && handCard.matches.includes(cell.id))) {
      validCells.push(cell.id);
    }
  }
  return validCells;
}

/**
 * Find valid cells for a two-eyed Jack (wild) — any empty, non-protected cell.
 */
function getWildCells(boardCards, protectedPatterns) {
  const protectedIds = new Set((protectedPatterns || []).flat());
  return boardCards
    .filter(c => !CORNER_IDS.includes(c.id) && c.selected !== "True" && !protectedIds.has(c.id))
    .map(c => c.id);
}

/**
 * Find valid removal targets for a one-eyed Jack — opponent's chips not in protected patterns.
 */
function getRemovalTargets(boardCards, myColor, protectedPatterns) {
  const protectedIds = new Set((protectedPatterns || []).flat());
  return boardCards
    .filter(c =>
      c.selected === "True" &&
      c.selectedby !== myColor &&
      c.selectedby !== "" &&
      !protectedIds.has(c.id) &&
      !CORNER_IDS.includes(c.id)
    )
    .map(c => c.id);
}

/**
 * Score a one-eyed Jack removal at cellId.
 * Higher score = more important to remove.
 */
function scoreRemoval(cellId, board, myColor, allLines) {
  let score = 0;
  const opponentColors = ["blue", "red", "green"].filter(c => c !== myColor);

  for (const oppColor of opponentColors) {
    for (const line of allLines) {
      const ids = line.map(c => c?.id);
      if (!ids.includes(cellId)) continue;
      const { mine: oppMine } = analyzeLineFor(line, oppColor);
      if (oppMine === 4) score += 1200; // break opponent's near-win
      else if (oppMine === 3) score += 150;
      else if (oppMine === 2) score += 30;
    }
  }
  return score;
}

/**
 * Main function: compute the bot's best move.
 * 
 * @param {Object} game - current game state from DB
 * @param {Array}  boardCards - current board cards array
 * @param {string} difficulty - "easy" | "medium" | "hard"
 * @param {string} botSocketId - the bot's socket ID
 * @returns {{ cardId: number, selectedCard: number }} - args for handleCardSelection
 */
function getBotMove(game, boardCards, difficulty, botSocketId) {
  const bot = game.players.find(p => p.socketId === botSocketId);
  if (!bot) return null;

  const myColor = bot.team;
  const hand = bot.hand;
  const protectedPatterns = game.protectedPatterns || [];

  const board = buildBoard(boardCards);
  const allLines = getAllLinesOfFive(board);

  // Easy mode: pick any random valid move
  if (difficulty === "easy") {
    return getRandomMove(hand, boardCards, myColor, protectedPatterns);
  }

  // Medium / Hard: score all possible moves
  const candidates = [];

  for (const handCard of hand) {
    const isTwoEyedJack = handCard.id >= 101 && handCard.id <= 104;
    const isOneEyedJack = handCard.id >= 105 && handCard.id <= 108;

    if (isTwoEyedJack) {
      const cells = getWildCells(boardCards, protectedPatterns);
      for (const cellId of cells) {
        let score = scorePlacement(cellId, board, myColor, protectedPatterns, allLines);
        score += 10; // slight bonus for having wild flexibility
        if (difficulty === "easy") score = Math.random() * 10;
        candidates.push({ cardId: cellId, selectedCard: handCard.id, score });
      }
    } else if (isOneEyedJack) {
      const removals = getRemovalTargets(boardCards, myColor, protectedPatterns);
      for (const cellId of removals) {
        let score = scoreRemoval(cellId, board, myColor, allLines);
        if (difficulty === "easy") score = Math.random() * 10;
        candidates.push({ cardId: cellId, selectedCard: handCard.id, score });
      }
    } else {
      const cells = getValidCellsForCard(handCard, boardCards, protectedPatterns);
      for (const cellId of cells) {
        let score = scorePlacement(cellId, board, myColor, protectedPatterns, allLines);
        if (difficulty === "easy") score = Math.random() * 10;
        candidates.push({ cardId: cellId, selectedCard: handCard.id, score });
      }
    }
  }

  if (candidates.length === 0) {
    // No valid move — pass turn by playing any card (failsafe)
    console.warn(`Bot ${botSocketId} has no valid moves. Forcing random fallback.`);
    return getRandomMove(hand, boardCards, myColor, protectedPatterns);
  }

  // Sort by score descending; add small noise for medium to avoid determinism
  if (difficulty === "medium") {
    candidates.forEach(c => { c.score += Math.random() * 15; });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  console.log(`Bot [${myColor}] plays card ${best.selectedCard} on cell ${best.cardId} (score: ${Math.round(best.score)})`);
  return { cardId: best.cardId, selectedCard: best.selectedCard };
}

/**
 * Fallback: pick a completely random valid move.
 */
function getRandomMove(hand, boardCards, myColor, protectedPatterns) {
  const shuffledHand = [...hand].sort(() => Math.random() - 0.5);

  for (const handCard of shuffledHand) {
    const isTwoEyedJack = handCard.id >= 101 && handCard.id <= 104;
    const isOneEyedJack = handCard.id >= 105 && handCard.id <= 108;

    let cells = [];
    if (isTwoEyedJack) {
      cells = getWildCells(boardCards, protectedPatterns);
    } else if (isOneEyedJack) {
      cells = getRemovalTargets(boardCards, myColor, protectedPatterns);
    } else {
      cells = getValidCellsForCard(handCard, boardCards, protectedPatterns);
    }

    if (cells.length > 0) {
      const cellId = cells[Math.floor(Math.random() * cells.length)];
      return { cardId: cellId, selectedCard: handCard.id };
    }
  }

  return null; // truly no moves
}

module.exports = { getBotMove, isBot };
