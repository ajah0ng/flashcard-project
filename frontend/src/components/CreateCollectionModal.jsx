import { useState } from "react";
import axios from "axios";

// When you create a deck it should put in the title of the lecture.
// A deck is a subject and contains a list of decks.
function CreateCollectionModal({ isOpen, onClose, onCollectionCreated }) {
  const [collectionName, setCollectionName] = useState("");
  // On mount, 5 empty fields.
  const [decks, setDecks] = useState(['', '', '', '', '']);

  const updateDeck = (index, value) => {
    const updated = [...decks];
    updated[index] = value;
    setDecks(updated);
  };

  // Adds an lecture input
  const addDeck = () => {
    setDecks([...decks, '']);
  };

  // Keeps the modal closed initially.
  if (!isOpen) return null;

  const handleCreateCollection = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/collections", {
        collectionName: collectionName.trim(),
        decks: decks,
      });

      // Refresh
      onCollectionCreated(response.data);
      setDecks(['', '', '', '', '']);
      setCollectionName("");
      onClose();

    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div id="create-collection-card">
      <p>New Collection</p>
      <button className="close-btn" onClick={onClose}>×</button>

      <span>Add Course name</span>
      <input
        type="text"
        placeholder="26T1 Final BABS3121"
        value={collectionName}
        onChange={(e) => setCollectionName(e.target.value)}
      />

      {/* decks have 5 fields to start */}
      <span>Add Decks</span>
      {decks.map((deck, index) => (
        <input
          key={index}
          type="text"
          placeholder={`e.g. Lecture ${index + 1}`}
          value={deck}
          onChange={(e) => updateDeck(index, e.target.value)}
        />
      ))}
      <button type="button" onClick={addDeck}>+</button>

      <button onClick={handleCreateCollection}>Create Collection</button>
    </div>
  );
}

export default CreateCollectionModal;