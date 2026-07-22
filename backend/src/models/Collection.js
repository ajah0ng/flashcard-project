import mongoose, { mongo } from "mongoose"

const collectionSchema = new mongoose.Schema({
    // Course Name
    collectionName: {
        type: String,
    },

    // List of Decks (Lectures)
    decks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deck",
        }
    ],

    lastStudiedAt: {
       type: Date,
    }
})

const Collection = mongoose.model("Collection", collectionSchema)

export default Collection;