import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateCardModal from "./modals/CreateCardModal";
import axios from "axios";
import "../styles/CollectionsPage.css";
import "../styles/Home.css";
import "../styles/Card.css";

const fetchDeck = async (deckId) => {
  const response = await axios.get(
    `http://localhost:5001/api/decks/${deckId}`
  );

  return response.data;
};

function DeckPage() {
  const { collectionId, deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateCardModal, setShowCreateCardModal] =
    useState(false);

  const {
    data: deck,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    enabled: Boolean(deckId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const addCard = (newCard) => {
    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;

      return {
        ...oldDeck,
        cards: [...(oldDeck.cards || []), newCard],
      };
    });

    setShowCreateCardModal(false);
  };

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (isError || !deck) {
    console.error("Deck query error:", error);

    return (
      <h2>
        {error?.response?.data?.message ||
          error?.message ||
          "Deck not found"}
      </h2>
    );
  }

  return (
    <div id="deck-page">
      <div className="section-1-page">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate(`/collections/${collectionId}`)
            }
          >
            Go Back
          </button>

          <h1>{deck.deckName}</h1>
        </div>

        <div className="exam-buttons">
          <button type="button">Practice</button>
          <button type="button">Exam Inspera mode</button>
        </div>
      </div>

      <div className="course-outline-container">
        {!deck.cards || deck.cards.length === 0 ? (
          <p>No cards in this deck.</p>
        ) : (
          deck.cards.map((card) => (
            <div
              key={card._id}
              className="course-outline-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigate(
                  `/collections/${collectionId}/decks/${deckId}/cards/${card._id}`
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(
                    `/collections/${collectionId}/decks/${deckId}/cards/${card._id}`
                  );
                }
              }}
            >
              <h3>{card.courseOutcome}</h3>
            </div>
          ))
        )}

        <button
          type="button"
          className="create-btn"
          onClick={() => setShowCreateCardModal(true)}
        >
          Create Card +
        </button>
      </div>

      <CreateCardModal
        isOpen={showCreateCardModal}
        onClose={() => setShowCreateCardModal(false)}
        deckId={deckId}
        onCardCreated={addCard}
      />
    </div>
  );
}

export default DeckPage;