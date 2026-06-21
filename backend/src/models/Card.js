import mongoose, { mongo } from "mongoose"

const cardSchema = new mongoose.Schema({

    courseOutcome: {
        type: String,
    },

    keyWords: {
        type: [String],
    },

    content: {
        type: String,
    }
})

const Card = mongoose.model("Card", cardSchema)

export default Card;