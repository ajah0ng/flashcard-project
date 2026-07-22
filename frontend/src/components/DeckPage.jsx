import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateCardModal from "./modals/CreateCardModal";
import axios from "axios";
import "../styles/CollectionsPage.css";
import "../styles/Home.css";
import "../styles/Card.css";
import '../styles/Page.css'
import filledStarIcon from '../../assets/filled-star.svg'
import unfilledStarIcon from '../../assets/unfilled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'
import unfilledQuestionIcon from '../../assets/unfilled-question.svg'
import { getDeckColour } from "../utils/deckColours";

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
  const deckColour = getDeckColour(deckId);

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

  const toggleCardField = async (card, field) => {
    const nextValue = !card[field];

    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;

      return {
        ...oldDeck,
        cards: (oldDeck.cards || []).map((c) =>
          c._id === card._id ? { ...c, [field]: nextValue } : c
        ),
      };
    });

    try {
      await axios.put(`http://localhost:5001/api/cards/${card._id}`, {
        [field]: nextValue,
      });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return {
          ...oldDeck,
          cards: (oldDeck.cards || []).map((c) =>
            c._id === card._id ? { ...c, [field]: card[field] } : c
          ),
        };
      });
    }
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
    <div id="deck-page"
    
    >

      
      <div className="section-1-page">
          <button
            type="button"
            onClick={() =>
              navigate(`/collections/${collectionId}`)
            }
          >
            ←
          </button>

          <div className="title-row">
              <h1>{deck.deckName}</h1>

              <div className="exam-buttons">
                  <button type="button">Practice Mode</button>
                  <button type="button">Exam Mode</button>
              </div>
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
              style={{ "--deck-colour": deckColour }}
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
              <div className="course-outline-card-header">
                <h3>{card.courseOutcome}</h3>

                <div className="course-outline-card-icons">
                  <button
                    type="button"
                    className="card-icon-toggle"
                    aria-pressed={Boolean(card.flagged)}
                    title={
                      card.flagged
                        ? "Unflag to revise content"
                        : "Flag to revise content"
                    }
                    aria-label={
                      card.flagged
                        ? "Unflag to revise content"
                        : "Flag to revise content"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCardField(card, "flagged");
                    }}
                  >
                    <img
                      src={card.flagged ? filledQuestionIcon : unfilledQuestionIcon}
                      alt=""
                    />
                  </button>

                  <button
                    type="button"
                    className="card-icon-toggle"
                    aria-pressed={Boolean(card.favourite)}
                    title={
                      card.favourite
                        ? "Unflag as likely to be assessed"
                        : "Flag as likely to be assessed"
                    }
                    aria-label={
                      card.favourite
                        ? "Unflag as likely to be assessed"
                        : "Flag as likely to be assessed"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleCardField(card, "favourite");
                    }}
                  >
                    <img
                      src={card.favourite ? filledStarIcon : unfilledStarIcon}
                      alt=""
                    />
                  </button>
                </div>
              </div>
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