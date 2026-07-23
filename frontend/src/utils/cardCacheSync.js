import { rankDecksToRevise } from "./rankDecks";

// Patches a card's fields across every react-query cache that embeds it
// (card, deck, collection) so edits made from anywhere -- Practice Mode
// included -- stay consistent without waiting on a refetch.
export function patchCardFields(queryClient, { cardId, deckId, collectionId, updates }) {
  queryClient.setQueryData(["card", cardId], (oldCard) => {
    if (!oldCard) return oldCard;
    return { ...oldCard, ...updates };
  });

  queryClient.setQueryData(["deck", deckId], (oldDeck) => {
    if (!oldDeck) return oldDeck;

    return {
      ...oldDeck,
      cards: (oldDeck.cards || []).map((c) =>
        c._id === cardId ? { ...c, ...updates } : c
      ),
    };
  });

  queryClient.setQueryData(["collection", collectionId], (oldCollection) => {
    if (!oldCollection) return oldCollection;

    const decks = oldCollection.decks.map((d) =>
      d._id === deckId
        ? {
            ...d,
            cards: (d.cards || []).map((c) =>
              c._id === cardId ? { ...c, ...updates } : c
            ),
          }
        : d
    );

    return {
      ...oldCollection,
      decks,
      decksToRevise: rankDecksToRevise(decks),
    };
  });
}
