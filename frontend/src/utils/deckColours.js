export const deckColours = [
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

export const getDeckColour = (deckId = "") => {
  let hash = 0;

  for (let index = 0; index < deckId.length; index += 1) {
    hash = deckId.charCodeAt(index) + ((hash << 5) - hash);
  }

  return deckColours[Math.abs(hash) % deckColours.length];
};