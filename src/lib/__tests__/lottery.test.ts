import { describe, it, expect } from "vitest";
import {
  getLotteryHistory,
  calculateFrequencies,
  calculateCooccurrence,
  findHotNumbers,
  findOverdueNumbers,
} from "../lottery";

describe("Lottery Service", () => {
  describe("getLotteryHistory", () => {
    it("should return Melate history", () => {
      const history = getLotteryHistory("melate");
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].lotteryId).toBe("melate");
    });

    it("should return Revancha history", () => {
      const history = getLotteryHistory("revancha");
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].lotteryId).toBe("revancha");
    });

    it("should return Super Lotto history", () => {
      const history = getLotteryHistory("super-lotto");
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].lotteryId).toBe("super-lotto");
    });

    it("should return empty for unknown slug", () => {
      const history = getLotteryHistory("unknown");
      expect(history).toEqual([]);
    });
  });

  describe("calculateFrequencies", () => {
    it("should calculate frequencies for all numbers", () => {
      const history = getLotteryHistory("melate");
      const freq = calculateFrequencies(history, 1, 56);

      expect(freq.length).toBe(56);
      expect(freq.every((f) => f.number >= 1 && f.number <= 56)).toBe(true);
    });

    it("should have relative frequencies between 0 and 1", () => {
      const history = getLotteryHistory("melate");
      const freq = calculateFrequencies(history, 1, 56);

      freq.forEach((f) => {
        expect(f.relativeFrequency).toBeGreaterThanOrEqual(0);
        expect(f.relativeFrequency).toBeLessThanOrEqual(100);
      });
    });

    it("should assign temperature labels", () => {
      const history = getLotteryHistory("melate");
      const freq = calculateFrequencies(history, 1, 56);

      freq.forEach((f) => {
        expect(["hot", "warm", "cold"]).toContain(f.temperature);
      });
    });

    it("should sort by absolute frequency descending", () => {
      const history = getLotteryHistory("melate");
      const freq = calculateFrequencies(history, 1, 56);

      for (let i = 1; i < freq.length; i++) {
        expect(freq[i - 1].absoluteFrequency).toBeGreaterThanOrEqual(
          freq[i].absoluteFrequency
        );
      }
    });
  });

  describe("calculateCooccurrence", () => {
    it("should return co-occurring pairs", () => {
      const history = getLotteryHistory("melate");
      const co = calculateCooccurrence(history, 1, 56);

      expect(co.length).toBeGreaterThan(0);
      expect(co.length).toBeLessThanOrEqual(20);
    });

    it("should have number_a < number_b", () => {
      const history = getLotteryHistory("melate");
      const co = calculateCooccurrence(history, 1, 56);

      co.forEach((c) => {
        expect(c.numberA).toBeLessThan(c.numberB);
      });
    });

    it("should sort by cooccurrence count descending", () => {
      const history = getLotteryHistory("melate");
      const co = calculateCooccurrence(history, 1, 56);

      for (let i = 1; i < co.length; i++) {
        expect(co[i - 1].cooccurrenceCount).toBeGreaterThanOrEqual(
          co[i].cooccurrenceCount
        );
      }
    });
  });

  describe("findHotNumbers", () => {
    it("should return 10 hot numbers", () => {
      const history = getLotteryHistory("melate");
      const hot = findHotNumbers(history, 1, 56, 10);

      expect(hot.length).toBe(10);
    });

    it("should return numbers sorted by frequency", () => {
      const history = getLotteryHistory("melate");
      const hot = findHotNumbers(history, 1, 56, 10);

      for (let i = 1; i < hot.length; i++) {
        expect(hot[i - 1].absoluteFrequency).toBeGreaterThanOrEqual(
          hot[i].absoluteFrequency
        );
      }
    });
  });

  describe("findOverdueNumbers", () => {
    it("should return overdue numbers", () => {
      const history = getLotteryHistory("melate");
      const overdue = findOverdueNumbers(history, 1, 56, 10);

      expect(overdue.length).toBe(10);
    });

    it("should return numbers sorted by draws since last", () => {
      const history = getLotteryHistory("melate");
      const overdue = findOverdueNumbers(history, 1, 56, 10);

      for (let i = 1; i < overdue.length; i++) {
        expect(overdue[i - 1].drawsSinceLast).toBeGreaterThanOrEqual(
          overdue[i].drawsSinceLast
        );
      }
    });
  });
});
