import express from "express";
import {
  getCardList,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
} from "../controllers/cardController.js";

const router = express.Router();

router.get("/", getCardList);
router.get("/:id", getCardById);
router.post("/", createCard);
router.put("/:id", updateCard);
router.delete("/:id", deleteCard);

export default router;
