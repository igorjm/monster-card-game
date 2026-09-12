import { describe, expect, it } from "vitest";
import { mayShowPostMatchPromotion } from "./ad-policy";

const eligible = {
  isAdultHost: true,
  isHost: true,
  isResults: true,
  premiumTheme: false,
  adsSuppressed: false,
  priorMatchKeys: [],
  matchKey: "match-1",
  impressionsToday: 0,
};

describe("post-match promotion policy", () => {
  it("allows one starter promotion to an adult host after results", () => {
    expect(mayShowPostMatchPromotion(eligible)).toBe(true);
  });
  it("suppresses guests, gameplay, premium/no-ads, duplicates and the daily cap", () => {
    expect(mayShowPostMatchPromotion({ ...eligible, isHost: false })).toBe(false);
    expect(mayShowPostMatchPromotion({ ...eligible, isResults: false })).toBe(false);
    expect(mayShowPostMatchPromotion({ ...eligible, premiumTheme: true })).toBe(false);
    expect(mayShowPostMatchPromotion({ ...eligible, adsSuppressed: true })).toBe(false);
    expect(mayShowPostMatchPromotion({ ...eligible, priorMatchKeys: ["match-1"] })).toBe(false);
    expect(mayShowPostMatchPromotion({ ...eligible, impressionsToday: 3 })).toBe(false);
  });
});
