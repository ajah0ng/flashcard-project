import express from "express"
import { createDeck, updateDeckName, getDeckById, deleteDeck } from "../controllers/deckController.js"

const router = express.Router();

// GET a specific deck by its ID
// Maps directly to: GET http://localhost:5001/api/decks/:id
router.get("/:id", getDeckById)

// UPDATE lecture
router.put("/:id", updateDeckName)

// Post lecture
// CREATE deck
router.post("/", createDeck);

// DELETE deck
router.delete("/:id", deleteDeck);


export default router;