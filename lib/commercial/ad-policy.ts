export const POST_MATCH_DAILY_CAP = 3;

export function mayShowPostMatchPromotion(input: {
  isAdultHost: boolean;
  isHost: boolean;
  isResults: boolean;
  premiumTheme: boolean;
  adsSuppressed: boolean;
  priorMatchKeys: readonly string[];
  matchKey: string;
  impressionsToday: number;
}) {
  return (
    input.isAdultHost &&
    input.isHost &&
    input.isResults &&
    !input.premiumTheme &&
    !input.adsSuppressed &&
    !input.priorMatchKeys.includes(input.matchKey) &&
    input.impressionsToday < POST_MATCH_DAILY_CAP
  );
}
