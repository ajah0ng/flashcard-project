import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateCardModal from "./CreateCardModal";
import axios from "axios";

const fetchDeck = async (deckId) => {
  const response = await axios.get(
    `(http://localhost:5001/api/decks/${deckId})`
  );
  return response.data;
};

function DeckPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateCardModal, setShowCreateCardModal] = useState(false);

  const {
    data: deck,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    enabled: !!deckId,
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
  };

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (isError) {
    console.log("deckId:", deckId);
    console.error("Query Error:", error);
    console.log(error.response?.data);
    return <h2>{error.message}</h2>;
  }

  return (
    <div id="deck-page">
      <div className="section-1-page">
        <button onClick={() => navigate(-1)}>Go Back</button>

        <h1>{deck.deckName}</h1>
      </div>

      <div className="cards-container">
        {deck.cards?.length === 0 ? (
          <p>No cards in this deck.</p>
        ) : (
          deck.cards?.map((card) => (
            <div key={card._id} className="card-item-card">
              <h3>{card.courseOutcome}</h3>
            </div>
          ))
        )}

        <button
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
