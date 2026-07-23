import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import "../styles/CollectionsPage.css";
import "../styles/Home.css";
import "../styles/Card.css";
import '../styles/Page.css'
import filledStarIcon from '../../assets/filled-star.svg'
import unfilledStarIcon from '../../assets/unfilled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'
import unfilledQuestionIcon from '../../assets/unfilled-question.svg'
import threeDotsIcon from '../../assets/three-dots-vertical-svgrepo-com.svg'
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

  const [isEditingDeckName, setIsEditingDeckName] = useState(false);
  const [editedDeckName, setEditedDeckName] = useState("");
  const [deckTitleSize, setDeckTitleSize] = useState(null);
  const deckTitleRef = useRef(null);

  const [openCardMenuId, setOpenCardMenuId] = useState(null);
  const [deleteCardId, setDeleteCardId] = useState(null);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editedCourseOutcome, setEditedCourseOutcome] = useState("");

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
  };

  const handleCreateCard = async () => {
    try {
      const response = await axios.post("http://localhost:5001/api/cards", {
        deckId,
      });

      addCard(response.data);
    } catch (err) {
      console.error("Failed to create card:", err);
    }
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

  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`http://localhost:5001/api/cards/${cardId}`);

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return {
          ...oldDeck,
          cards: (oldDeck.cards || []).filter((c) => c._id !== cardId),
        };
      });

      setDeleteCardId(null);
    } catch (err) {
      console.error("Failed to delete card:", err);
    }
  };

  const handleEditCard = (card) => {
    setEditingCardId(card._id);
    setEditedCourseOutcome(card.courseOutcome || "");
  };

  const handleSaveCourseOutcome = async (cardId) => {
    const trimmedOutcome = editedCourseOutcome.trim();

    if (!trimmedOutcome) {
      setEditingCardId(null);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5001/api/cards/${cardId}`,
        { courseOutcome: trimmedOutcome }
      );

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return {
          ...oldDeck,
          cards: (oldDeck.cards || []).map((c) =>
            c._id === cardId
              ? { ...c, courseOutcome: response.data.courseOutcome }
              : c
          ),
        };
      });

      queryClient.setQueryData(["card", cardId], (oldCard) => {
        if (!oldCard) return oldCard;

        return { ...oldCard, courseOutcome: response.data.courseOutcome };
      });

      setEditingCardId(null);
    } catch (error) {
      console.error("Failed to edit card:", error);
    }
  };

  const handleEditDeckName = () => {
    if (deckTitleRef.current) {
      const rect = deckTitleRef.current.getBoundingClientRect();
      setDeckTitleSize({ width: rect.width, height: rect.height });
    }

    setEditedDeckName(deck.deckName);
    setIsEditingDeckName(true);
  };

  const handleSaveDeckName = async () => {
    const trimmedName = editedDeckName.trim();

    if (!trimmedName) {
      setIsEditingDeckName(false);
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5001/api/decks/${deckId}`,
        { updatedDeckName: trimmedName }
      );

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return { ...oldDeck, deckName: response.data.deckName };
      });

      queryClient.setQueryData(
        ["collection", collectionId],
        (oldCollection) => {
          if (!oldCollection) return oldCollection;

          return {
            ...oldCollection,
            decks: oldCollection.decks.map((d) =>
              d._id === deckId
                ? { ...d, deckName: response.data.deckName }
                : d
            ),
          };
        }
      );

      setIsEditingDeckName(false);
    } catch (error) {
      console.error("Failed to edit deck:", error);
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
              {isEditingDeckName ? (
                  <input
                      className="collection-name-input"
                      style={
                          deckTitleSize
                              ? {
                                    width: deckTitleSize.width,
                                    height: deckTitleSize.height,
                                }
                              : undefined
                      }
                      autoFocus
                      value={editedDeckName}
                      onChange={(e) => setEditedDeckName(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === "Enter") {
                              handleSaveDeckName();
                          }

                          if (e.key === "Escape") {
                              setIsEditingDeckName(false);
                          }
                      }}
                      onBlur={handleSaveDeckName}
                  />
              ) : (
                  <h1
                      ref={deckTitleRef}
                      className={!deck.deckName ? "deck-name-placeholder" : undefined}
                      onDoubleClick={handleEditDeckName}
                  >
                      {deck.deckName || "Untitled Lecture"}
                  </h1>
              )}

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
                {editingCardId === card._id ? (
                  <input
                    className="course-outcome-input"
                    autoFocus
                    value={editedCourseOutcome}
                    onChange={(e) => setEditedCourseOutcome(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();

                      if (e.key === "Enter") {
                        handleSaveCourseOutcome(card._id);
                      }

                      if (e.key === "Escape") {
                        setEditingCardId(null);
                      }
                    }}
                    onBlur={() => handleSaveCourseOutcome(card._id)}
                  />
                ) : (
                  <h3
                    className={!card.courseOutcome ? "course-outcome-placeholder" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleEditCard(card);
                    }}
                  >
                    {card.courseOutcome || "Untitled Course Outcome"}
                  </h3>
                )}

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

                  <div className="menu-container">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenCardMenuId(
                          openCardMenuId === card._id ? null : card._id
                        );
                      }}
                    >
                      <img src={threeDotsIcon} alt="Menu" />
                    </button>

                    {openCardMenuId === card._id && (
                      <div
                        className="menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteCardId(card._id);
                            setOpenCardMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <button
          type="button"
          className="create-btn"
          onClick={handleCreateCard}
        >
          Create Card +
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteCardId}
        onClose={() => setDeleteCardId(null)}
        onConfirm={() => handleDeleteCard(deleteCardId)}
        title="Delete Card"
        itemLabel="card"
        itemName={
          deck.cards.find((card) => card._id === deleteCardId)
            ?.courseOutcome || "Untitled Course Outcome"
        }
      />
    </div>
  );
}

export default DeckPage;