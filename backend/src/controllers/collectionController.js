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

export async function getCollectionById(req, res) {
    try {
        const { id } = req.params;

        const collection = await Collection.findById(id)
            .populate({
                path: "decks",
                select: "_id deckName cards"
            })
            .lean();

        if (!collection) {
            return res.status(404).json({
                message: "Collection not found"
            });
        }

        const formattedCollection = {
            ...collection,
            decks: collection.decks.map((deck) => ({
                _id: deck._id,
                deckName: deck.deckName,
                cards: deck.cards
            }))
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
    const { collectionName, decks } = req.body;

    console.log(req.body)
  
    if (!collectionName) {
      return res.status(400).json({ message: "Course name is required" });
    }

    const createdDecks = await Deck.insertMany(
        decks.filter(name => name.trim()).map(name => ({ deckName: name }))
    );

    console.log(createdDecks)

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

