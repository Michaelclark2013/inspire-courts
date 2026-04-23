/**
 * Tournament bracket generation, scheduling, and advancement engine.
 * Pure functions — no DB calls. All inputs/outputs are plain objects.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type TournamentFormat =
  | "single_elim"
  | "double_elim"
  | "round_robin"
  | "pool_play";

export interface TeamEntry {
  id?: number;
  teamName: string;
  seed: number;
  division?: string;
  poolGroup?: string;
}

export interface GameSlot {
  bracketPosition: number;
  round: string;
  homeTeam: string;
  awayTeam: string;
  court: string;
  scheduledTime: string; // ISO string
  poolGroup?: string;
  winnerAdvancesTo: number | null; // bracketPosition of next game
  loserDropsTo: number | null; // for double-elim
  isBye?: boolean;
}

export interface ScheduleConfig {
  startTime: string; // ISO string
  courts: string[];
  gameLength: number; // minutes
  breakLength: number; // minutes
  division?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

/**
 * Standard seeding order for a bracket of size N (power of 2).
 * Returns pairs like [[1,8],[4,5],[2,7],[3,6]] for N=8.
 */
function seededPairings(size: number): [number, number][] {
  if (size === 1) return [[1, 1]];
  if (size === 2) return [[1, 2]];

  const pairs: [number, number][] = [];
  // Standard bracket seeding: 1vN, N/2+1 v N/2, etc.
  function buildBracket(round: [number, number][]): [number, number][] {
    if (round.length === size / 2) return round;
    const next: [number, number][] = [];
    for (const [a, b] of round) {
      const sum = a + b;
      next.push([a, sum - a]); // Keep a
      next.push([sum - b, b]); // Keep b
    }
    return buildBracket(next);
  }

  // Start with 1 vs 2, expand to proper seeding
  const initial: [number, number][] = [[1, 2]];
  const expanded = buildBracket(initial);

  // Re-pair: top half vs bottom half
  for (let i = 0; i < expanded.length; i++) {
    pairs.push(expanded[i]);
  }
  return pairs;
}

function getRoundLabel(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return "F";
  if (fromFinal === 1) return "SF";
  if (fromFinal === 2) return "QF";
  return `R${round}`;
}

// ── Single Elimination ──────────────────────────────────────────────────────

export function generateSingleElimBracket(
  teams: TeamEntry[],
  config: ScheduleConfig
): GameSlot[] {
  const n = teams.length;
  if (n < 2) return [];

  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);
  // NOTE: byeCount = bracketSize - n is implicit in `sorted.slice()` + the
  // `null` fill used by seededPairings when a slot has no team.
  // If you ever need it explicitly, compute as `bracketSize - n`.

  // Sort by seed
  const sorted = [...teams].sort((a, b) => a.seed - b.seed);

  // Build seeded pairings
  const pairings = seededPairings(bracketSize);
  const slots: GameSlot[] = [];
  let posCounter = 1;

  // First round — may include byes
  const firstRoundGames: { pos: number; home: string; away: string; isBye: boolean }[] = [];

  for (const [seedA, seedB] of pairings) {
    const teamA = seedA <= sorted.length ? sorted[seedA - 1].teamName : "BYE";
    const teamB = seedB <= sorted.length ? sorted[seedB - 1].teamName : "BYE";
    const isBye = teamA === "BYE" || teamB === "BYE";
    firstRoundGames.push({
      pos: posCounter++,
      home: teamA === "BYE" ? teamB : teamA,
      away: teamA === "BYE" ? "" : teamB === "BYE" ? "" : teamB,
      isBye,
    });
  }

  // Build all rounds
  const rounds: { pos: number; home: string; away: string; isBye: boolean; round: number }[][] = [];
  rounds.push(
    firstRoundGames.map((g) => ({ ...g, round: 1 }))
  );

  for (let r = 2; r <= totalRounds; r++) {
    const prevRound = rounds[r - 2];
    const thisRound: typeof rounds[0] = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      const game1 = prevRound[i];
      const game2 = prevRound[i + 1];
      // If both are byes, this is also a bye (shouldn't happen with proper seeding)
      const home = game1.isBye ? game1.home : "TBD";
      const away = game2?.isBye ? game2.home : "TBD";
      thisRound.push({
        pos: posCounter++,
        home,
        away,
        isBye: false,
        round: r,
      });
    }
    rounds.push(thisRound);
  }

  // Flatten and assign advancement links
  const allGames = rounds.flat();
  // gamesByPos index omitted — advancement lookups below use position math
  // directly. Restore `new Map(allGames.map(g => [g.pos, g]))` if you need
  // to resolve by pos in future edits.

  // Build advancement: each game's winner goes to the next round
  const advancementMap = new Map<number, number>(); // pos → next pos
  for (let r = 0; r < rounds.length - 1; r++) {
    const thisRound = rounds[r];
    const nextRound = rounds[r + 1];
    for (let i = 0; i < thisRound.length; i++) {
      const nextGameIdx = Math.floor(i / 2);
      if (nextRound[nextGameIdx]) {
        advancementMap.set(thisRound[i].pos, nextRound[nextGameIdx].pos);
      }
    }
  }

  // Assign courts and times
  const scheduled = assignCourtsAndTimes(
    allGames.filter((g) => !g.isBye),
    config
  );

  // Build final GameSlot array
  for (const game of allGames) {
    const schedule = scheduled.find((s) => s.pos === game.pos);
    slots.push({
      bracketPosition: game.pos,
      round: getRoundLabel(game.round, totalRounds),
      homeTeam: game.home,
      awayTeam: game.away || "",
      court: schedule?.court || config.courts[0] || "Court 1",
      scheduledTime: schedule?.time || config.startTime,
      winnerAdvancesTo: advancementMap.get(game.pos) ?? null,
      loserDropsTo: null,
      isBye: game.isBye,
    });
  }

  return slots;
}

// ── Round Robin ─────────────────────────────────────────────────────────────

export function generateRoundRobinSchedule(
  teams: TeamEntry[],
  config: ScheduleConfig
): GameSlot[] {
  const n = teams.length;
  if (n < 2) return [];

  // Generate all pairings using circle method
  const teamList = [...teams];
  if (teamList.length % 2 !== 0) {
    teamList.push({ teamName: "BYE", seed: 999 });
  }

  const numRounds = teamList.length - 1;
  const gamesPerRound = teamList.length / 2;
  const allPairings: { home: string; away: string; roundNum: number }[] = [];

  // Circle method: fix first team, rotate the rest
  const fixed = teamList[0];
  const rotating = teamList.slice(1);

  for (let r = 0; r < numRounds; r++) {
    const currentOrder = [fixed, ...rotating];
    for (let i = 0; i < gamesPerRound; i++) {
      const home = currentOrder[i];
      const away = currentOrder[currentOrder.length - 1 - i];
      if (home.teamName !== "BYE" && away.teamName !== "BYE") {
        allPairings.push({
          home: home.teamName,
          away: away.teamName,
          roundNum: r + 1,
        });
      }
    }
    // Rotate: move last to second position
    rotating.unshift(rotating.pop()!);
  }

  // Assign courts and times
  const scheduled = assignCourtsAndTimes(
    allPairings.map((p, i) => ({ pos: i + 1, ...p, isBye: false, round: p.roundNum })),
    config
  );

  return allPairings.map((p, i) => {
    const schedule = scheduled.find((s) => s.pos === i + 1);
    return {
      bracketPosition: i + 1,
      round: `R${p.roundNum}`,
      homeTeam: p.home,
      awayTeam: p.away,
      court: schedule?.court || config.courts[0] || "Court 1",
      scheduledTime: schedule?.time || config.startTime,
      winnerAdvancesTo: null,
      loserDropsTo: null,
    };
  });
}

// ── Pool Play ───────────────────────────────────────────────────────────────

export function generatePoolPlaySchedule(
  teams: TeamEntry[],
  config: ScheduleConfig
): GameSlot[] {
  // Group teams by poolGroup
  const pools = new Map<string, TeamEntry[]>();
  for (const team of teams) {
    const group = team.poolGroup || "A";
    if (!pools.has(group)) pools.set(group, []);
    pools.get(group)!.push(team);
  }

  const allSlots: GameSlot[] = [];
  let posCounter = 1;

  // Round-robin within each pool
  for (const [poolName, poolTeams] of pools) {
    const rrSlots = generateRoundRobinSchedule(poolTeams, config);
    for (const slot of rrSlots) {
      allSlots.push({
        ...slot,
        bracketPosition: posCounter++,
        poolGroup: poolName,
        round: `Pool ${poolName}`,
      });
    }
  }

  // Re-assign courts/times across all pool games to avoid conflicts
  const reScheduled = assignCourtsAndTimes(
    allSlots.map((s) => ({
      pos: s.bracketPosition,
      home: s.homeTeam,
      away: s.awayTeam,
      isBye: false,
      round: 1,
    })),
    config
  );

  for (const slot of allSlots) {
    const sched = reScheduled.find((s) => s.pos === slot.bracketPosition);
    if (sched) {
      slot.court = sched.court;
      slot.scheduledTime = sched.time;
    }
  }

  return allSlots;
}

// ── Double Elimination ──────────────────────────────────────────────────────

export function generateDoubleElimBracket(
  teams: TeamEntry[],
  config: ScheduleConfig
): GameSlot[] {
  // Winners bracket = single elim
  const winnersBracket = generateSingleElimBracket(teams, config);

  // For double elim, we add a losers bracket.
  // Losers bracket has roughly 2*(totalRounds-1) rounds.
  const n = teams.length;
  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);

  let posCounter = winnersBracket.length + 1;
  const losersSlots: GameSlot[] = [];

  // Losers bracket rounds: each winners round feeds losers into a new round
  // Round L1: losers from WR1 play each other
  // Round L2: winners of L1 play losers from WR2
  // Continue until losers bracket final
  const winnersRounds = new Map<string, GameSlot[]>();
  for (const g of winnersBracket) {
    if (!winnersRounds.has(g.round)) winnersRounds.set(g.round, []);
    winnersRounds.get(g.round)!.push(g);
  }

  // Simplified losers bracket: create placeholder games
  const losersRoundCount = Math.max(1, (totalRounds - 1) * 2);
  let prevLosersGames: GameSlot[] = [];

  for (let lr = 1; lr <= losersRoundCount; lr++) {
    const gamesInRound = Math.max(1, Math.floor(bracketSize / Math.pow(2, Math.ceil(lr / 2) + 1)));
    const roundGames: GameSlot[] = [];

    for (let g = 0; g < gamesInRound; g++) {
      const slot: GameSlot = {
        bracketPosition: posCounter++,
        round: `L${lr}`,
        homeTeam: "TBD",
        awayTeam: "TBD",
        court: config.courts[g % config.courts.length] || "Court 1",
        scheduledTime: config.startTime,
        poolGroup: undefined,
        winnerAdvancesTo: null,
        loserDropsTo: null,
      };
      roundGames.push(slot);
    }

    // Link previous losers round → this round
    for (let i = 0; i < prevLosersGames.length; i++) {
      const nextIdx = Math.floor(i / 2);
      if (roundGames[nextIdx]) {
        prevLosersGames[i].winnerAdvancesTo = roundGames[nextIdx].bracketPosition;
      }
    }

    losersSlots.push(...roundGames);
    prevLosersGames = roundGames;
  }

  // Grand final: winners bracket winner vs losers bracket winner
  const grandFinal: GameSlot = {
    bracketPosition: posCounter++,
    round: "GF",
    homeTeam: "TBD",
    awayTeam: "TBD",
    court: config.courts[0] || "Court 1",
    scheduledTime: config.startTime,
    winnerAdvancesTo: null,
    loserDropsTo: null,
  };

  // Link winners final → grand final
  const winnersFinal = winnersBracket.find((g) => g.round === "F");
  if (winnersFinal) {
    winnersFinal.winnerAdvancesTo = grandFinal.bracketPosition;
  }

  // Link losers final → grand final
  if (prevLosersGames.length > 0) {
    prevLosersGames[0].winnerAdvancesTo = grandFinal.bracketPosition;
  }

  // Link winners bracket losers → losers bracket
  const winnersNonBye = winnersBracket.filter((g) => !g.isBye);
  for (let i = 0; i < Math.min(winnersNonBye.length, losersSlots.length); i++) {
    winnersNonBye[i].loserDropsTo = losersSlots[i]?.bracketPosition ?? null;
  }

  // Re-schedule all losers + grand final
  const allLosers = [...losersSlots, grandFinal];
  const lastWinnersTime = winnersBracket.reduce((max, g) => {
    return g.scheduledTime > max ? g.scheduledTime : max;
  }, config.startTime);

  const losersConfig = {
    ...config,
    startTime: addMinutes(lastWinnersTime, config.gameLength + config.breakLength),
  };
  const losersScheduled = assignCourtsAndTimes(
    allLosers.map((s) => ({ pos: s.bracketPosition, home: s.homeTeam, away: s.awayTeam, isBye: false, round: 1 })),
    losersConfig
  );
  for (const slot of allLosers) {
    const sched = losersScheduled.find((s) => s.pos === slot.bracketPosition);
    if (sched) {
      slot.court = sched.court;
      slot.scheduledTime = sched.time;
    }
  }

  return [...winnersBracket, ...losersSlots, grandFinal];
}

// ── Court & Time Assignment ─────────────────────────────────────────────────

interface SchedulableGame {
  pos: number;
  home: string;
  away: string;
  isBye: boolean;
  round: number;
}

interface ScheduledResult {
  pos: number;
  court: string;
  time: string;
}

function assignCourtsAndTimes(
  games: SchedulableGame[],
  config: ScheduleConfig
): ScheduledResult[] {
  const { courts, startTime, gameLength, breakLength } = config;
  if (courts.length === 0 || games.length === 0) return [];

  const slotDuration = gameLength + breakLength;
  const results: ScheduledResult[] = [];

  // Track when each court is next available
  const courtAvailable: Map<string, string> = new Map();
  for (const court of courts) {
    courtAvailable.set(court, startTime);
  }

  // Track when each team is next available (prevent double-booking)
  const teamAvailable: Map<string, string> = new Map();

  // Sort games by round, then position
  const sorted = [...games]
    .filter((g) => !g.isBye)
    .sort((a, b) => a.round - b.round || a.pos - b.pos);

  for (const game of sorted) {
    // Find earliest available time considering court and team constraints
    let bestCourt = courts[0];
    let bestTime = startTime;
    let bestTimestamp = Infinity;

    for (const court of courts) {
      const courtTime = courtAvailable.get(court) || startTime;
      const homeTime = teamAvailable.get(game.home) || startTime;
      const awayTime = game.away ? teamAvailable.get(game.away) || startTime : startTime;

      // Earliest this game can start on this court
      const earliest = [courtTime, homeTime, awayTime].reduce((max, t) =>
        t > max ? t : max
      );
      const ts = new Date(earliest).getTime();

      if (ts < bestTimestamp) {
        bestTimestamp = ts;
        bestCourt = court;
        bestTime = earliest;
      }
    }

    results.push({ pos: game.pos, court: bestCourt, time: bestTime });

    // Update availability
    const nextAvail = addMinutes(bestTime, slotDuration);
    courtAvailable.set(bestCourt, nextAvail);
    teamAvailable.set(game.home, nextAvail);
    if (game.away) teamAvailable.set(game.away, nextAvail);
  }

  return results;
}

// ── Winner Advancement ──────────────────────────────────────────────────────

export interface BracketGame {
  id: number; // tournament_games.id
  gameId: number;
  bracketPosition: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  winnerAdvancesTo: number | null;
  loserDropsTo: number | null;
}

export interface AdvancementResult {
  nextBracketPosition: number;
  side: "home" | "away"; // which side the winner fills
  winnerTeam: string;
  loserBracketPosition?: number;
  loserSide?: "home" | "away";
  loserTeam?: string;
}

/**
 * Given a completed game, determine where the winner (and optionally loser) advance to.
 */
export function computeAdvancement(
  allGames: BracketGame[],
  completedGameId: number
): AdvancementResult | null {
  const game = allGames.find((g) => g.gameId === completedGameId);
  if (!game || game.status !== "final") return null;
  if (!game.winnerAdvancesTo) return null;

  const winner =
    game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
  const loser =
    game.homeScore > game.awayScore ? game.awayTeam : game.homeTeam;

  // Find the next game in the bracket
  const nextGame = allGames.find(
    (g) => g.bracketPosition === game.winnerAdvancesTo
  );
  if (!nextGame) return null;

  // Determine which side to fill: if home is empty or TBD, fill home; else fill away
  const side: "home" | "away" =
    !nextGame.homeTeam || nextGame.homeTeam === "TBD" ? "home" : "away";

  const result: AdvancementResult = {
    nextBracketPosition: game.winnerAdvancesTo,
    side,
    winnerTeam: winner,
  };

  // Handle loser advancement (double-elim)
  if (game.loserDropsTo) {
    const loserGame = allGames.find(
      (g) => g.bracketPosition === game.loserDropsTo
    );
    if (loserGame) {
      result.loserBracketPosition = game.loserDropsTo;
      result.loserSide =
        !loserGame.homeTeam || loserGame.homeTeam === "TBD" ? "home" : "away";
      result.loserTeam = loser;
    }
  }

  return result;
}

// ── Format Dispatcher ───────────────────────────────────────────────────────

export function generateBracket(
  format: TournamentFormat,
  teams: TeamEntry[],
  config: ScheduleConfig
): GameSlot[] {
  switch (format) {
    case "single_elim":
      return generateSingleElimBracket(teams, config);
    case "double_elim":
      return generateDoubleElimBracket(teams, config);
    case "round_robin":
      return generateRoundRobinSchedule(teams, config);
    case "pool_play":
      return generatePoolPlaySchedule(teams, config);
    default:
      return generateSingleElimBracket(teams, config);
  }
}
