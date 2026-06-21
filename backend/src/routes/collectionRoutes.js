import express from "express"
import { getCollectionList, getCollectionById, createCollection, updateCollection, deleteCollection } from "../controllers/collectionController.js"


const router = express.Router();

// GET all decks
router.get("/", getCollectionList);

router.get("/:id", getCollectionById);

// CREATE deck
router.post("/", createCollection);

// UPDATE deck
router.put("/:id", updateCollection);

// DELETE deck
router.delete("/:id", deleteCollection);


export default router;