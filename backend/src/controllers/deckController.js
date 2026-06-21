import Deck from "../models/Deck.js";
import Card from "../models/Card.js";

import mongoose from "mongoose";


// GET a single deck by ID
export async function getDeckById(req, res) {


    try {
        const { id } = req.params;

        const deck = await Deck.findById(id).populate("cards");


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

        const updatedDeck = await Deck.findByIdAndUpdate(
            id,
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