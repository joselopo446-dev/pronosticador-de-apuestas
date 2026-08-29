import { describe, it, expect } from "vitest";
import { predictMatch } from "../poisson";

describe("predictMatch (Poisson Model)", () => {
  it("should return valid probabilities that sum to ~1", () => {
    const result = predictMatch({
      homeTeamAttack: 1.2,
      homeTeamDefense: 1.0,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.2,
    });

    const total =
      result.probabilities.homeWin +
      result.probabilities.draw +
      result.probabilities.awayWin;

    // Poisson truncates at maxGoals=6, so total is ~0.98 (not exactly 1)
    expect(total).toBeGreaterThan(0.95);
    expect(total).toBeLessThanOrEqual(1);
  });

  it("should return positive expected goals", () => {
    const result = predictMatch({
      homeTeamAttack: 1.5,
      homeTeamDefense: 0.8,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.0,
    });

    expect(result.expectedHomeGoals).toBeGreaterThan(0);
    expect(result.expectedAwayGoals).toBeGreaterThan(0);
  });

  it("should give advantage to stronger home team", () => {
    const result = predictMatch({
      homeTeamAttack: 1.6,
      homeTeamDefense: 0.7,
      awayTeamAttack: 0.8,
      awayTeamDefense: 1.3,
    });

    expect(result.probabilities.homeWin).toBeGreaterThan(
      result.probabilities.awayWin
    );
  });

  it("should handle balanced teams", () => {
    const result = predictMatch({
      homeTeamAttack: 1.0,
      homeTeamDefense: 1.0,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.0,
    });

    // With home advantage, home should still be slightly favored
    expect(result.probabilities.homeWin).toBeGreaterThan(0.3);
    expect(result.probabilities.draw).toBeGreaterThan(0.2);
  });

  it("should return most likely score with positive probability", () => {
    const result = predictMatch({
      homeTeamAttack: 1.2,
      homeTeamDefense: 1.0,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.2,
    });

    expect(result.mostLikelyScore.probability).toBeGreaterThan(0);
    expect(result.mostLikelyScore.home).toBeGreaterThanOrEqual(0);
    expect(result.mostLikelyScore.away).toBeGreaterThanOrEqual(0);
  });

  it("should return over/under probabilities that sum to ~1", () => {
    const result = predictMatch({
      homeTeamAttack: 1.2,
      homeTeamDefense: 1.0,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.2,
    });

    expect(
      result.overUnder.over25 + result.overUnder.under25
    ).toBeCloseTo(1, 2);
  });

  it("should return btts probabilities that sum to ~1", () => {
    const result = predictMatch({
      homeTeamAttack: 1.2,
      homeTeamDefense: 1.0,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.2,
    });

    expect(result.btts.yes + result.btts.no).toBeCloseTo(1, 2);
  });

  it("should include explanation with factors", () => {
    const result = predictMatch({
      homeTeamAttack: 1.5,
      homeTeamDefense: 0.8,
      awayTeamAttack: 1.0,
      awayTeamDefense: 1.0,
    });

    expect(result.explanation.factors.length).toBeGreaterThan(0);
    expect(result.explanation.summary).toBeTruthy();
  });
});
