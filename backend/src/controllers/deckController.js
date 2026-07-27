import Deck from "../models/Deck.js";
import Card from "../models/Card.js";
import Collection from "../models/Collection.js";

import mongoose from "mongoose";


// GET a single deck by ID
export async function getDeckById(req, res) {

    try {
        const { id } = req.params;

        const deck = await Deck.findOne({ _id: id, owner: req.user.id }).populate("cards");


        if (!deck) {
            return res.status(404).json({
                message: "Deck not found"
            });
        }

        res.status(200).json(deck);

    } catch (error) {
        console.error("Error in getDeckById", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
// UPDATE lecture name
export async function updateDeckName(req, res) {

    try {

        const { id } = req.params;

        const { updatedDeckName } = req.body;

        const updatedDeck = await Deck.findOneAndUpdate(
            { _id: id, owner: req.user.id },
            {
                deckName: updatedDeckName,
            },
            { new: true }
        );

        if (!updatedDeck) {
            return res.status(404).json({
                message: "Deck not found"
            });
        }

        res.status(200).json(updatedDeck);

    } catch (error) {

        console.error("Error in updateDeckName", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}

// DELETE deck
export async function deleteDeck(req, res) {
    try {
        const { id } = req.params;

        const deck = await Deck.findOneAndDelete({ _id: id, owner: req.user.id });

        if (!deck) {
            return res.status(404).json({
                message: "Deck not found"
            });
        }

        await Card.deleteMany({ _id: { $in: deck.cards } });

        await Collection.updateMany(
            { decks: id, owner: req.user.id },
            { $pull: { decks: id } }
        );

        res.status(200).json({ message: "Deck deleted successfully" });

    } catch (error) {
        console.error("Error in deleteDeck", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const createDeck = async (req, res) => {
  try {
    const { collectionId, deckName, cards } = req.body;

    const collection = await Collection.findOne({ _id: collectionId, owner: req.user.id });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const createdCards = await Card.insertMany(
        (cards || []).map((card) => ({ ...card, owner: req.user.id }))
    );

    const deck = await Deck.create({
        owner: req.user.id,
        deckName,
        cards: createdCards.map(card => card._id),
    });

    collection.decks.push(deck._id);
    await collection.save();

    const populatedDeck = await Deck.findById(deck._id).populate("cards");
    res.status(201).json(populatedDeck);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
