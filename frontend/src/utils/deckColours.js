export const deckColours = [
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

// When the deck's position within its collection is known, colour is assigned
// by that position so decks in the same collection never collide until there
// are more decks than colours. Without a position (e.g. no collection context
// yet available), falls back to a hash of the deckId.
export const getDeckColour = (deckId = "", deckIndex) => {
  if (typeof deckIndex === "number") {
    return deckColours[deckIndex % deckColours.length];
  }

  let hash = 0;

  for (let index = 0; index < deckId.length; index += 1) {
    hash = deckId.charCodeAt(index) + ((hash << 5) - hash);
  }

  return deckColours[Math.abs(hash) % deckColours.length];
};