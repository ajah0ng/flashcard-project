import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import Tiptap from "../Tiptap";
import '../../styles/Card.css'

function CreateCardModal({ isOpen, onClose, deckId }) {
    const queryClient = useQueryClient();

    const [courseOutcome, setCourseOutcome] = useState("");
    const [keyWords, setKeyWords] = useState("");
    const [content, setContent] = useState("");

    if (!isOpen) return null;

    const handleCreateCard = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5001/api/cards",
                {
                    deckId,
                    courseOutcome: courseOutcome.trim(),
                    keyWords: keyWords
                        .split(",")
                        .map((word) => word.trim())
                        .filter(Boolean),
                    content,
                }
            );

            const newCard = response.data;

            queryClient.setQueryData(["deck", deckId], (oldDeck) => {
                if (!oldDeck) return oldDeck;

                return {
                    ...oldDeck,
                    cards: [...oldDeck.cards, newCard],
                };
            });

            setCourseOutcome("");
            setKeyWords("");
            setContent("");

            onClose();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="create-card-overlay">
            <div className="create-card-modal">

                <div className="modal-header">
                    <h2>Create Course Outcome</h2>

                    <button
                        className="close-btn"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <label>Course Outcome</label>
                <input
                    type="text"
                    placeholder="Course Outcome..."
                    value={courseOutcome}
                    onChange={(e) =>
                        setCourseOutcome(e.target.value)
                    }
                />

                <label>Keywords</label>
                <input
                    type="text"
                    placeholder="keyword1, keyword2, keyword3"
                    value={keyWords}
                    onChange={(e) =>
                        setKeyWords(e.target.value)
                    }
                />

                <label>Content</label>

                <Tiptap
                    content={content}
                    onChange={setContent}
                />

                <div className="modal-footer">
                    <button onClick={handleCreateCard}>
                        Create Card
                    </button>
                </div>

            </div>
        </div>
    );
}

export default CreateCardModal;