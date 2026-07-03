import { useState } from "react";
import axios from "axios";

import { useQueryClient } from "@tanstack/react-query";
// import Tiptap from './Tiptap'

function CreateCardModal({ isOpen, onClose, deckId }) {
    
  const queryClient = useQueryClient();

  const [courseOutcome, setCourseOutcome] = useState("");
  const [keyWords, setKeyWords] = useState("");
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  const handleCreateCard = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/cards", {
        deckId,
        courseOutcome: courseOutcome.trim(),
        keyWords: keyWords
          .split(",")
          .map((word) => word.trim())
          .filter(Boolean),
        content: content.trim(),
      });

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
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div id="create-collection-overlay">
    <div id="create-card-modal">
      <p>New Card</p>

      <button className="close-btn" onClick={onClose}>
        ×
      </button>

      <span>Course Outcome</span>
      <input
        type="text"
        placeholder="e.g. Identify some disease caused by mutations in the key Factros involved in maintaining ribsome homeostasis."
        value={courseOutcome}
        onChange={(e) => setCourseOutcome(e.target.value)}
      />

      <span>Keywords</span>
      <input
        type="text"
        placeholder="keyword1, keyword2, keyword3"
        value={keyWords}
        onChange={(e) => setKeyWords(e.target.value)}
      />

      <span>Content</span>
      <textarea
        className="card-content"
        placeholder="Enter card content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={handleCreateCard}>Create Card</button>
    </div>
    </div>
  );
}

export default CreateCardModal;
