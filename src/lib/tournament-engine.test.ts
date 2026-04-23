import { describe, it, expect } from "vitest";
import {
  generateSingleElimBracket,
  generateRoundRobinSchedule,
  generatePoolPlaySchedule,
  generateBracket,
  computeAdvancement,
  type TeamEntry,
  type ScheduleConfig,
  type BracketGame,
} from "./tournament-engine";

const START = "2026-05-01T09:00:00.000Z";
const config: ScheduleConfig = {
  startTime: START,
  courts: ["Court 1", "Court 2"],
  gameLength: 50,
  breakLength: 10,
};

function mkTeams(n: number, opts: { pool?: string } = {}): TeamEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    teamName: `Team ${i + 1}`,
    seed: i + 1,
    poolGroup: opts.pool,
  }));
}

describe("tournament-engine / generateSingleElimBracket", () => {
  it("returns empty for fewer than 2 teams", () => {
    expect(generateSingleElimBracket([], config)).toEqual([]);
    expect(generateSingleElimBracket(mkTeams(1), config)).toEqual([]);
  });

  it("pairs 2 teams into a single final", () => {
    const slots = generateSingleElimBracket(mkTeams(2), config);
    expect(slots).toHaveLength(1);
    expect(slots[0].round).toBe("F");
    expect(new Set([slots[0].homeTeam, slots[0].awayTeam])).toEqual(
      new Set(["Team 1", "Team 2"])
    );
  });

  it("builds a full 8-team bracket with 7 games (4+2+1)", () => {
    const slots = generateSingleElimBracket(mkTeams(8), config);
    expect(slots).toHaveLength(7);
    expect(slots.filter((s) => s.round === "QF")).toHaveLength(4);
    expect(slots.filter((s) => s.round === "SF")).toHaveLength(2);
    expect(slots.filter((s) => s.round === "F")).toHaveLength(1);
  });

  it("wires winnerAdvancesTo so every non-final game points to a valid next game", () => {
    const slots = generateSingleElimBracket(mkTeams(8), config);
    const positions = new Set(slots.map((s) => s.bracketPosition));
    const nonFinals = slots.filter((s) => s.round !== "F");
    for (const g of nonFinals) {
      expect(g.winnerAdvancesTo).not.toBeNull();
      expect(positions.has(g.winnerAdvancesTo!)).toBe(true);
    }
    // The final itself has no next game.
    const final = slots.find((s) => s.round === "F")!;
    expect(final.winnerAdvancesTo).toBeNull();
  });

  it("inserts a BYE when team count is not a power of 2", () => {
    const slots = generateSingleElimBracket(mkTeams(5), config);
    const byes = slots.filter((s) => s.isBye);
    // 5 teams → bracket size 8 → 3 BYE slots in round 1.
    expect(byes.length).toBe(3);
  });

  it("seeds 1 vs lowest seed in round 1 (1 vs 8 for N=8)", () => {
    const slots = generateSingleElimBracket(mkTeams(8), config);
    const r1 = slots
      .filter((s) => !s.isBye && !s.homeTeam.startsWith("TBD") && !s.awayTeam.startsWith("TBD"))
      .filter((s) => s.round === "QF");
    // Top seed always starts at bracket position 1.
    const topGame = r1.find((g) => g.homeTeam === "Team 1" || g.awayTeam === "Team 1");
    expect(topGame).toBeDefined();
    expect(new Set([topGame!.homeTeam, topGame!.awayTeam])).toEqual(
      new Set(["Team 1", "Team 8"])
    );
  });

  it("assigns courts + scheduledTime to every non-bye game", () => {
    const slots = generateSingleElimBracket(mkTeams(4), config);
    for (const s of slots.filter((g) => !g.isBye)) {
      expect(s.court).toMatch(/^Court \d$/);
      expect(new Date(s.scheduledTime).toString()).not.toBe("Invalid Date");
    }
  });
});

describe("tournament-engine / generateRoundRobinSchedule", () => {
  it("returns empty for fewer than 2 teams", () => {
    expect(generateRoundRobinSchedule([], config)).toEqual([]);
    expect(generateRoundRobinSchedule(mkTeams(1), config)).toEqual([]);
  });

  it("plays every team exactly once against every other team (N=4 → 6 games)", () => {
    const slots = generateRoundRobinSchedule(mkTeams(4), config);
    expect(slots).toHaveLength(6); // C(4,2) = 6

    // Build set of pairings (unordered)
    const pairs = slots.map((s) =>
      [s.homeTeam, s.awayTeam].sort().join(" vs ")
    );
    expect(new Set(pairs).size).toBe(6);
  });

  it("handles odd team counts without including 'BYE' in output", () => {
    const slots = generateRoundRobinSchedule(mkTeams(5), config);
    for (const s of slots) {
      expect(s.homeTeam).not.toBe("BYE");
      expect(s.awayTeam).not.toBe("BYE");
    }
    // 5 teams round-robin = C(5,2) = 10 games
    expect(slots).toHaveLength(10);
  });

  it("has no winnerAdvancesTo links (round-robin doesn't advance)", () => {
    const slots = generateRoundRobinSchedule(mkTeams(4), config);
    for (const s of slots) {
      expect(s.winnerAdvancesTo).toBeNull();
    }
  });
});

describe("tournament-engine / generatePoolPlaySchedule", () => {
  it("splits teams into pools by poolGroup", () => {
    const teams = [
      ...mkTeams(3, { pool: "A" }).map((t, i) => ({ ...t, teamName: `A${i + 1}` })),
      ...mkTeams(3, { pool: "B" }).map((t, i) => ({ ...t, teamName: `B${i + 1}` })),
    ];
    const slots = generatePoolPlaySchedule(teams, config);

    // 3 teams per pool → C(3,2) = 3 games per pool → 6 total
    expect(slots).toHaveLength(6);
    expect(slots.filter((s) => s.poolGroup === "A")).toHaveLength(3);
    expect(slots.filter((s) => s.poolGroup === "B")).toHaveLength(3);

    // Cross-pool games should NOT exist
    for (const s of slots) {
      if (s.poolGroup === "A") {
        expect(s.homeTeam.startsWith("A")).toBe(true);
        expect(s.awayTeam.startsWith("A")).toBe(true);
      }
    }
  });
});

describe("tournament-engine / computeAdvancement", () => {
  it("returns null for a game that hasn't been finalized", () => {
    const g: BracketGame = {
      id: 1,
      gameId: 1,
      bracketPosition: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 10,
      awayScore: 8,
      status: "in_progress",
      winnerAdvancesTo: 3,
      loserDropsTo: null,
    };
    expect(computeAdvancement([g], 1)).toBeNull();
  });

  it("returns null when the completed game is the tournament final", () => {
    const g: BracketGame = {
      id: 1,
      gameId: 1,
      bracketPosition: 3,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 10,
      awayScore: 8,
      status: "final",
      winnerAdvancesTo: null,
      loserDropsTo: null,
    };
    expect(computeAdvancement([g], 1)).toBeNull();
  });

  it("routes the winner into the home slot of the next game (first fill)", () => {
    const g1: BracketGame = {
      id: 1,
      gameId: 1,
      bracketPosition: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 15,
      awayScore: 10,
      status: "final",
      winnerAdvancesTo: 3,
      loserDropsTo: null,
    };
    const g3: BracketGame = {
      id: 3,
      gameId: 3,
      bracketPosition: 3,
      homeTeam: "TBD",
      awayTeam: "TBD",
      homeScore: 0,
      awayScore: 0,
      status: "scheduled",
      winnerAdvancesTo: null,
      loserDropsTo: null,
    };
    const r = computeAdvancement([g1, g3], 1)!;
    expect(r.nextBracketPosition).toBe(3);
    expect(r.side).toBe("home");
    expect(r.winnerTeam).toBe("A");
  });

  it("routes the second feeder into the away slot", () => {
    const g1: BracketGame = {
      id: 1,
      gameId: 1,
      bracketPosition: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 15,
      awayScore: 10,
      status: "final",
      winnerAdvancesTo: 3,
      loserDropsTo: null,
    };
    // Next game already has home filled (from a previous computeAdvancement call).
    const g3: BracketGame = {
      id: 3,
      gameId: 3,
      bracketPosition: 3,
      homeTeam: "X",
      awayTeam: "TBD",
      homeScore: 0,
      awayScore: 0,
      status: "scheduled",
      winnerAdvancesTo: null,
      loserDropsTo: null,
    };
    const r = computeAdvancement([g1, g3], 1)!;
    expect(r.side).toBe("away");
    expect(r.winnerTeam).toBe("A");
  });

  it("fills both winner + loser when loserDropsTo is set (double-elim)", () => {
    const g1: BracketGame = {
      id: 1,
      gameId: 1,
      bracketPosition: 1,
      homeTeam: "A",
      awayTeam: "B",
      homeScore: 15,
      awayScore: 10,
      status: "final",
      winnerAdvancesTo: 3,
      loserDropsTo: 5,
    };
    const g3: BracketGame = {
      ...g1,
      id: 3,
      gameId: 3,
      bracketPosition: 3,
      homeTeam: "TBD",
      awayTeam: "TBD",
      status: "scheduled",
      winnerAdvancesTo: null,
      loserDropsTo: null,
    };
    const g5: BracketGame = {
      ...g1,
      id: 5,
      gameId: 5,
      bracketPosition: 5,
      homeTeam: "TBD",
      awayTeam: "TBD",
      status: "scheduled",
      winnerAdvancesTo: null,
      loserDropsTo: null,
    };
    const r = computeAdvancement([g1, g3, g5], 1)!;
    expect(r.winnerTeam).toBe("A");
    expect(r.loserBracketPosition).toBe(5);
    expect(r.loserTeam).toBe("B");
    expect(r.loserSide).toBe("home");
  });
});

describe("tournament-engine / generateBracket dispatcher", () => {
  it("routes to the right generator for each format", () => {
    const teams = mkTeams(4);
    // Just verify each returns a non-empty array — deeper behavior covered above.
    expect(generateBracket("single_elim", teams, config).length).toBeGreaterThan(0);
    expect(generateBracket("double_elim", teams, config).length).toBeGreaterThan(0);
    expect(generateBracket("round_robin", teams, config).length).toBeGreaterThan(0);
    expect(
      generateBracket("pool_play", teams.map((t) => ({ ...t, poolGroup: "A" })), config).length
    ).toBeGreaterThan(0);
  });
});
