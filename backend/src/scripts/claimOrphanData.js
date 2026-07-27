// One-time helper: assigns every pre-auth Collection/Deck/Card (created
// before the owner field existed) to a user, by email.
//
// Usage: sign in through the app once first (so the User document exists),
// then run:
//   node src/scripts/claimOrphanData.js you@example.com

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Collection from "../models/Collection.js";
import Deck from "../models/Deck.js";
import Card from "../models/Card.js";

dotenv.config();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error("Usage: node src/scripts/claimOrphanData.js <email>");
        process.exit(1);
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
        console.error(`No user found for ${email}. Sign in through the app once first.`);
        await mongoose.disconnect();
        process.exit(1);
    }

    const collectionResult = await Collection.updateMany(
        { owner: { $exists: false } },
        { $set: { owner: user._id } }
    );

    const deckResult = await Deck.updateMany(
        { owner: { $exists: false } },
        { $set: { owner: user._id } }
    );

    const cardResult = await Card.updateMany(
        { owner: { $exists: false } },
        { $set: { owner: user._id } }
    );

    console.log(`Claimed for ${email}:`);
    console.log(`  collections: ${collectionResult.modifiedCount}`);
    console.log(`  decks: ${deckResult.modifiedCount}`);
    console.log(`  cards: ${cardResult.modifiedCount}`);

    await mongoose.disconnect();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
