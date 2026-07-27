import Card from "../models/Card.js";
import Deck from "../models/Deck.js";

// GET all cards
export const getCardList = async (req, res) => {
  try {
    const cards = await Card.find({ owner: req.user.id });
    res.status(200).json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET one card by id
export const getCardById = async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, owner: req.user.id });

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

    const deck = await Deck.findOne({ _id: deckId, owner: req.user.id });

    if (!deck) {
      return res.status(404).json({ message: "Deck not found" });
    }

    const newCard = await Card.create({
      owner: req.user.id,
      courseOutcome: courseOutcome?.trim() || "",
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
    const { courseOutcome, keyWords, content, favourite, flagged } = req.body;

    const updatedCard = await Card.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
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
        ...(favourite !== undefined && {
          favourite: Boolean(favourite),
        }),
        ...(flagged !== undefined && {
          flagged: Boolean(flagged),
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
    const deletedCard = await Card.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

    if (!deletedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    await Deck.updateMany(
      { cards: req.params.id, owner: req.user.id },
      { $pull: { cards: req.params.id } }
    );

    res.status(200).json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
