import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

function AddDeckModal({ isOpen, onClose, collectionId }) {

    const queryClient = useQueryClient();

    const [deckName, setDeckName] = useState("");
    const [cards, setCards] = useState(["", "", "", "", ""]);

    const updateCard = (index, value) => {
        const updated = [...cards];
        updated[index] = value;
        setCards(updated);
    };

    const addCard = () => {
        setCards([...cards, ""]);
    };

    if (!isOpen) return null;

    const handleCreateDeck = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5001/api/decks",
                {
                    collectionId,
                    deckName: deckName.trim(),
                    cards: cards
                        .filter((c) => c.trim())
                        .map((c) => ({
                            courseOutcome: c.trim(),
                        })),
                }
            );

            const newDeck = response.data;

            queryClient.setQueryData(
                ["collection", collectionId],
                (oldCollection) => {
                    if (!oldCollection) return oldCollection;

                    return {
                        ...oldCollection,
                        decks: [
                            ...oldCollection.decks,
                            newDeck,
                        ],
                    };
                }
            );

            setDeckName("");
            setCards(["", "", "", "", ""]);
            onClose();

        } catch (err) {
            alert(
                `Error: ${
                    err.response?.data?.message ||
                    err.message
                }`
            );
        }
    };

    return (
        <div id="create-deck-modal">
            <p>New Deck</p>

            <button className="close-btn" onClick={onClose}>
                ×
            </button>

            <span>Add Deck name</span>
            <input
                type="text"
                placeholder="Lecture 1"
                value={deckName}
                onChange={(e) =>
                    setDeckName(e.target.value)
                }
            />

            <span>Add Cards</span>

            {cards.map((card, index) => (
                <input
                    key={index}
                    type="text"
                    placeholder={`Course outcome ${index + 1}`}
                    value={card}
                    onChange={(e) =>
                        updateCard(index, e.target.value)
                    }
                />
            ))}

            <button type="button" onClick={addCard}>
                +
            </button>

            <button onClick={handleCreateDeck}>
                Create Deck
            </button>
        </div>
    );
}

export default AddDeckModal;