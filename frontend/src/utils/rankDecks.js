// Mirrors the ranking algorithm in backend/src/controllers/collectionController.js
// so the "Lecture Decks to Revise" summary can be recomputed instantly on the
// client after a favourite/flagged toggle, without waiting on a refetch.
function scoreCard(card) {
    if (card.favourite && card.flagged) return 3;
    if (card.favourite || card.flagged) return 1;
    return 0;
}

export function rankDecksToRevise(decks) {
    return decks
        .map((deck) => {
            const cards = deck.cards || [];
            const bothCount = cards.filter((c) => c.favourite && c.flagged).length;
            const favouriteCount = cards.filter((c) => c.favourite).length;
            const flaggedCount = cards.filter((c) => c.flagged).length;
            const deckScore = cards.reduce((sum, c) => sum + scoreCard(c), 0);

            return {
                _id: deck._id,
                deckName: deck.deckName,
                deckScore,
                bothCount,
                favouriteCount,
                flaggedCount,
            };
        })
        .filter((deck) => deck.deckScore > 0)
        .sort((a, b) => b.deckScore - a.deckScore || b.bothCount - a.bothCount);
}
