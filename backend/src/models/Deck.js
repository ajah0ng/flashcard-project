import mongoose from "mongoose";

// Deck = Lectures
const deckSchema = new mongoose.Schema({

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    deckName: {
        type: String,
    },

    cards: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Card",
        }
    ]
});

const Deck = mongoose.model("Deck", deckSchema);

export default Deck;