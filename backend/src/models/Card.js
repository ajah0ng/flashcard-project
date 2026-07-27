import mongoose, { mongo } from "mongoose"

const cardSchema = new mongoose.Schema({

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    courseOutcome: {
        type: String,
    },

    keyWords: {
        type: [String],
    },

    content: {
        type: String,
    },

    favourite: {
        type: Boolean,
        default: false,
    },

    flagged: {
        type: Boolean,
        default: false,
    }
})

const Card = mongoose.model("Card", cardSchema)

export default Card;