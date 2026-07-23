import Collection from "../models/Collection.js"
import Deck from "../models/Deck.js";

/**
 * Retrieves all Collections owned by user from MongoDB database.
 * 
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A collection
 * @throws {DatabaseError} - Throws if the connection pool fails.
 */
export async function getCollectionList(req, res) {
    try {
        const collections = await Collection.find()
            .populate({
                path: "decks",
                select: "_id"
            })
            .lean();

        res.status(200).json(collections);
    } catch (error) {
        console.error("Error in getCollectionList", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}

// Cards that are both starred (favourite) and flagged for revision are
// weighted highest since they're both likely to appear on the exam and
// not yet mastered. Ranking is by raw counts, not proportion of the deck.
function scoreCard(card) {
    if (card.favourite && card.flagged) return 3;
    if (card.favourite || card.flagged) return 1;
    return 0;
}

function rankDecksToRevise(decks) {
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

export async function getCollectionById(req, res) {
    try {
        const { id } = req.params;

        const collection = await Collection.findById(id)
            .populate({
                path: "decks",
                select: "_id deckName cards",
                populate: {
                    path: "cards",
                    select: "favourite flagged"
                }
            })
            .lean();

        if (!collection) {
            return res.status(404).json({
                message: "Collection not found"
            });
        }

        const decksToRevise = rankDecksToRevise(collection.decks);

        const formattedCollection = {
            ...collection,
            decks: collection.decks.map((deck) => ({
                _id: deck._id,
                deckName: deck.deckName,
                cards: deck.cards
            })),
            decksToRevise
        };

        res.status(200).json(formattedCollection);
    } catch (error) {
        console.error("Error in getCollectionById", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Creates a new Collection.
export async function createCollection(req, res) {

  try {
    const { collectionName = "", decks = [] } = req.body;

    const createdDecks = await Deck.insertMany(
        decks.filter(name => name.trim()).map(name => ({ deckName: name }))
    );

    const deckIds = createdDecks.map((deck) => deck._id);

    const newCollection = new Collection({
      collectionName: collectionName,
      decks: deckIds,
    });

    await newCollection.save();
    return res.status(201).json(newCollection);
  } catch (err) {
    console.error("Error in createCollection", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


// UPDATE deck
export async function updateCollection(req, res) {
    try {
        const { id } = req.params;
        const { collectionName } = req.body;

        const updatedCollection = await Collection.findByIdAndUpdate(
            id,
            { collectionName },
            { new: true }
        );

        if (!updatedCollection) {
            return res.status(404).json({
                message: "Collection not found",
            });
        }

        res.status(200).json(updatedCollection);
    } catch (error) {
        console.error("Error updating collection:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
}

// DELETE collection
export async function deleteCollection(req, res) {
    try {
        const { id } = req.params;

        const deletedCollection = await Collection.findByIdAndDelete(id);

        if (!deletedCollection) {
            return res.status(404).json({
                message: "Collection not found",
            });
        }

        res.status(200).json({
            message: "Collection deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleteCollection:", error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
}

export const updateLastStudied = async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);

        if (!collection) {
            return res.status(404).json({ message: "Collection not found" });
        }

        collection.lastStudiedAt = new Date();
        await collection.save();

        res.json(collection);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

