import { describe, it, expect } from "vitest";
import { computeStandings, type GameResult } from "./standings";

function game(
  home: string,
  homeScore: number,
  away: string,
  awayScore: number,
  time?: string
): GameResult {
  return { homeTeam: home, awayTeam: away, homeScore, awayScore, scheduledTime: time ?? null };
}

describe("standings / computeStandings", () => {
  it("returns an empty array for no games", () => {
    expect(computeStandings([])).toEqual([]);
  });

  it("assigns W/L correctly from scores", () => {
    const games = [
      game("A", 80, "B", 70),
      game("C", 60, "A", 75),
      game("B", 50, "C", 45),
    ];
    const rows = computeStandings(games);
    const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]));

    expect(byTeam.A.wins).toBe(2);
    expect(byTeam.A.losses).toBe(0);
    expect(byTeam.B.wins).toBe(1);
    expect(byTeam.B.losses).toBe(1);
    expect(byTeam.C.wins).toBe(0);
    expect(byTeam.C.losses).toBe(2);
  });

  it("respects an explicit `winner` field over scores", () => {
    // Tied-score "official forfeit" scenario — winner set explicitly.
    const games: GameResult[] = [
      { homeTeam: "A", awayTeam: "B", homeScore: 0, awayScore: 0, winner: "A" },
    ];
    const rows = computeStandings(games);
    const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]));
    expect(byTeam.A.wins).toBe(1);
    expect(byTeam.B.losses).toBe(1);
  });

  it("treats 0-0 games with no declared winner as unplayed (no W/L credited)", () => {
    const rows = computeStandings([game("A", 0, "B", 0)]);
    const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]));
    expect(byTeam.A.wins).toBe(0);
    expect(byTeam.A.losses).toBe(0);
    expect(byTeam.B.wins).toBe(0);
    expect(byTeam.B.losses).toBe(0);
  });

  it("skips '—' placeholder team names", () => {
    const rows = computeStandings([game("A", 10, "—", 0)]);
    const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]));
    expect(byTeam["—"]).toBeUndefined();
    expect(byTeam.A).toBeDefined();
  });

  it("accumulates points-for / points-against / point-diff", () => {
    const games = [game("A", 100, "B", 80), game("B", 60, "A", 70)];
    const rows = computeStandings(games);
    const byTeam = Object.fromEntries(rows.map((r) => [r.team, r]));
    expect(byTeam.A.pointsFor).toBe(170);
    expect(byTeam.A.pointsAgainst).toBe(140);
    expect(byTeam.A.pointDiff).toBe(30);
    expect(byTeam.B.pointsFor).toBe(140);
    expect(byTeam.B.pointsAgainst).toBe(170);
    expect(byTeam.B.pointDiff).toBe(-30);
  });

  it("sorts: wins desc → point-diff desc → points-for desc", () => {
    // A: 2-0 (+30), B: 2-0 (+10), C: 0-2
    const games = [
      game("A", 100, "C", 70),
      game("A", 100, "D", 85), // introduce D so we have 4 teams
      game("B", 90, "E", 80),
      game("B", 90, "F", 85),
    ];
    const rows = computeStandings(games);
    // A should rank above B because A's point diff is larger.
    const a = rows.findIndex((r) => r.team === "A");
    const b = rows.findIndex((r) => r.team === "B");
    expect(a).toBeLessThan(b);
  });

  it("computes streak from the most-recent game chronologically", () => {
    // Team A: W, W, L (chronologically)
    const games = [
      game("A", 80, "B", 70, "2026-01-01T10:00:00Z"),
      game("A", 82, "C", 75, "2026-01-02T10:00:00Z"),
      game("A", 60, "D", 72, "2026-01-03T10:00:00Z"),
    ];
    const rows = computeStandings(games);
    const A = rows.find((r) => r.team === "A")!;
    expect(A.streak).toBe("L1");
  });

  it("reports L5 as W-L counts of last 5 chronologically", () => {
    const games = [
      // 6 games: W W L W L W (last 5 = W L W L W → 3-2)
      game("A", 90, "X", 80, "2026-01-01T00:00:00Z"),
      game("A", 90, "X", 80, "2026-01-02T00:00:00Z"),
      game("A", 60, "X", 80, "2026-01-03T00:00:00Z"),
      game("A", 90, "X", 80, "2026-01-04T00:00:00Z"),
      game("A", 60, "X", 80, "2026-01-05T00:00:00Z"),
      game("A", 90, "X", 80, "2026-01-06T00:00:00Z"),
    ];
    const rows = computeStandings(games);
    const A = rows.find((r) => r.team === "A")!;
    expect(A.lastFive).toBe("3-2");
  });

  it("marks leader's GB as '—' and computes GB for followers", () => {
    // A: 3-0, B: 2-1 → B's GB = ((3-2)+(1-0))/2 = 1
    const games = [
      game("A", 80, "X", 70),
      game("A", 80, "Y", 70),
      game("A", 80, "Z", 70),
      game("B", 80, "X", 70),
      game("B", 80, "Y", 70),
      game("B", 60, "Z", 80),
    ];
    const rows = computeStandings(games);
    const leader = rows.find((r) => r.team === "A")!;
    const second = rows.find((r) => r.team === "B")!;
    expect(leader.gb).toBe("—");
    expect(second.gb).toBe("1");
  });
});
