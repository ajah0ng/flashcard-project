import Card from "../models/Card.js";
import Deck from "../models/Deck.js";

// GET all cards
export const getCardList = async (req, res) => {
  try {
    const cards = await Card.find();
    res.status(200).json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET one card by id
export const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.status(200).json(card);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE new card
export const createCard = async (req, res) => {
  try {
    const { deckId, courseOutcome, keyWords, content } = req.body;

    if (!deckId) {
      return res.status(400).json({ message: "deckId is required" });
    }

    if (!courseOutcome || !courseOutcome.trim()) {
      return res.status(400).json({ message: "courseOutcome is required" });
    }

    const deck = await Deck.findById(deckId);

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    const newCard = await Card.create({
      courseOutcome: courseOutcome.trim(),
      keyWords: Array.isArray(keyWords) ? keyWords : [],
      content: content?.trim() || "",
    });

    deck.cards.push(newCard._id);
    await deck.save();

    res.status(201).json(newCard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE card
export const updateCard = async (req, res) => {
  try {
    const { courseOutcome, keyWords, content } = req.body;

    const updatedCard = await Card.findByIdAndUpdate(
      req.params.id,
      {
        ...(courseOutcome !== undefined && {
          courseOutcome: courseOutcome.trim(),
        }),
        ...(keyWords !== undefined && {
          keyWords: Array.isArray(keyWords) ? keyWords : [],
        }),
        ...(content !== undefined && {
          content: content.trim(),
        }),
      },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.status(200).json(updatedCard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE card
export const deleteCard = async (req, res) => {
  try {
    const deletedCard = await Card.findByIdAndDelete(req.params.id);

    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    await Deck.updateMany(
      { cards: req.params.id },
      { $pull: { cards: req.params.id } }
    );

    res.status(200).json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
