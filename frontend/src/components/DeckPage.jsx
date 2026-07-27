import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import "../styles/CollectionsPage.css";
import "../styles/Home.css";
import "../styles/Card.css";
import '../styles/Page.css'
import '../styles/PracticeMode.css'
import filledStarIcon from '../../assets/filled-star.svg'
import unfilledStarIcon from '../../assets/unfilled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'
import unfilledQuestionIcon from '../../assets/unfilled-question.svg'
import threeDotsIcon from '../../assets/three-dots-vertical-svgrepo-com.svg'
import { getDeckColour } from "../utils/deckColours";
import { rankDecksToRevise } from "../utils/rankDecks";
import { shuffleArray } from "../utils/shuffle";
import { patchCardFields } from "../utils/cardCacheSync";
import PracticeSession from "./PracticeSession";

const fetchDeck = async (deckId) => {
  const response = await axios.get(
    `http://localhost:5001/api/decks/${deckId}`
  );

  return response.data;
};

const fetchCollection = async (collectionId) => {
  const response = await axios.get(
    `http://localhost:5001/api/collections/${collectionId}`
  );

  return response.data;
};

function DeckPage() {
  const { collectionId, deckId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: collection } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: () => fetchCollection(collectionId),
    enabled: Boolean(collectionId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const deckIndex = collection?.decks
    ? collection.decks.findIndex((d) => d._id === deckId)
    : -1;
  const deckColour = getDeckColour(deckId, deckIndex === -1 ? undefined : deckIndex);

  const [isEditingDeckName, setIsEditingDeckName] = useState(false);
  const [editedDeckName, setEditedDeckName] = useState("");
  const [deckTitleSize, setDeckTitleSize] = useState(null);
  const deckTitleRef = useRef(null);

  const [openCardMenuId, setOpenCardMenuId] = useState(null);
  const [deleteCardId, setDeleteCardId] = useState(null);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editedCourseOutcome, setEditedCourseOutcome] = useState("");
  const cardClickTimeoutRef = useRef(null);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    flagged: false,
    favourite: false,
  });
  const filterMenuRef = useRef(null);

  useEffect(() => {
    if (!isFilterMenuOpen) return;

    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isFilterMenuOpen]);

  const toggleActiveFilter = (field) => {
    setActiveFilters((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isFiltering = activeFilters.flagged || activeFilters.favourite;

  const [isSelectingCards, setIsSelectingCards] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [practiceCards, setPracticeCards] = useState(null);
  const dragSelectRef = useRef({ isDragging: false, mode: "select" });

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

  const visibleCards = isFiltering
    ? (deck?.cards || []).filter(
        (card) =>
          (activeFilters.flagged && card.flagged) ||
          (activeFilters.favourite && card.favourite)
      )
    : deck?.cards || [];

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

  const applyCardFieldToCaches = (cardId, field, value) => {
    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;

      return {
        ...oldDeck,
        cards: (oldDeck.cards || []).map((c) =>
          c._id === cardId ? { ...c, [field]: value } : c
        ),
      };
    });

    queryClient.setQueryData(["card", cardId], (oldCard) => {
      if (!oldCard) return oldCard;
      return { ...oldCard, [field]: value };
    });

    queryClient.setQueryData(
      ["collection", collectionId],
      (oldCollection) => {
        if (!oldCollection) return oldCollection;

        const decks = oldCollection.decks.map((d) =>
          d._id === deckId
            ? {
                ...d,
                cards: (d.cards || []).map((c) =>
                  c._id === cardId ? { ...c, [field]: value } : c
                ),
              }
            : d
        );

        return {
          ...oldCollection,
          decks,
          decksToRevise: rankDecksToRevise(decks),
        };
      }
    );
  };

  const toggleCardField = async (card, field) => {
    const nextValue = !card[field];

    applyCardFieldToCaches(card._id, field, nextValue);

    try {
      await axios.put(`http://localhost:5001/api/cards/${card._id}`, {
        [field]: nextValue,
      });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);

      applyCardFieldToCaches(card._id, field, card[field]);
    }
  };

  const handleToggleCardSelection = (cardId, forceMode) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      const shouldSelect = forceMode ?? !next.has(cardId);

      if (shouldSelect) {
        next.add(cardId);
      } else {
        next.delete(cardId);
      }

      return next;
    });
  };

  const handleCardMouseDown = (cardId) => {
    if (!isSelectingCards) return;

    const mode = selectedCardIds.has(cardId) ? "deselect" : "select";
    dragSelectRef.current = { isDragging: true, mode };
    handleToggleCardSelection(cardId, mode === "select");
  };

  const handleCardMouseEnter = (cardId) => {
    if (!isSelectingCards || !dragSelectRef.current.isDragging) return;
    handleToggleCardSelection(cardId, dragSelectRef.current.mode === "select");
  };

  const handleStartSelectingCards = () => {
    setIsSelectingCards((wasSelecting) => {
      if (wasSelecting) {
        setSelectedCardIds(new Set());
        return false;
      }

      // All cards are selected by default; the user toggles off what
      // they don't want to practice.
      setSelectedCardIds(new Set(visibleCards.map((card) => card._id)));
      return true;
    });
  };

  const handleCancelSelectingCards = () => {
    setIsSelectingCards(false);
    setSelectedCardIds(new Set());
  };

  const handleStartPractice = () => {
    if (selectedCardIds.size === 0) return;

    const selected = visibleCards
      .filter((card) => selectedCardIds.has(card._id))
      .map((card) => ({
        ...card,
        deckId,
        deckName: deck.deckName,
        deckColour,
      }));

    setPracticeCards(shuffleArray(selected));
    setIsSelectingCards(false);
    setSelectedCardIds(new Set());
  };

  const handleUpdatePracticeCard = async (cardId, cardDeckId, updates) => {
    patchCardFields(queryClient, {
      cardId,
      deckId: cardDeckId,
      collectionId,
      updates,
    });

    try {
      await axios.put(`http://localhost:5001/api/cards/${cardId}`, updates);
    } catch (err) {
      console.error("Failed to update card:", err);
    }
  };

  useEffect(() => {
    if (!isSelectingCards) return;

    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        handleStartPractice();
      }

      if (event.key === "Escape") {
        handleCancelSelectingCards();
      }
    };

    const handleMouseUp = () => {
      dragSelectRef.current.isDragging = false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelectingCards, selectedCardIds]);

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
                  <button
                      type="button"
                      className={isSelectingCards ? "practice-mode-btn-active" : undefined}
                      onClick={handleStartSelectingCards}
                  >
                      {isSelectingCards ? "Cancel Selection" : "Practice Mode"}
                  </button>
                  <button type="button">Exam Mode</button>
              </div>
          </div>
      
      </div>

      <div className="deck-filter-bar">
        <div className="menu-container" ref={filterMenuRef}>
          <button
            type="button"
            className={
              isFiltering ? "filter-toggle-btn filter-toggle-btn-active" : "filter-toggle-btn"
            }
            onClick={() => setIsFilterMenuOpen((open) => !open)}
          >
            Filter{isFiltering ? ` (${[activeFilters.flagged && "❓", activeFilters.favourite && "★"].filter(Boolean).join(" ")})` : ""}
          </button>

          {isFilterMenuOpen && (
            <div className="menu filter-menu">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.flagged}
                  onChange={() => toggleActiveFilter("flagged")}
                />
                <img src={filledQuestionIcon} alt="" />
                To revise
              </label>

              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={activeFilters.favourite}
                  onChange={() => toggleActiveFilter("favourite")}
                />
                <img src={filledStarIcon} alt="" />
                Likely to appear
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="course-outline-container">
        {!visibleCards || visibleCards.length === 0 ? (
          <p>
            {isFiltering
              ? "No cards match the selected filters."
              : "No cards in this deck."}
          </p>
        ) : (
          visibleCards.map((card) => (
            <div
              key={card._id}
              className={
                "course-outline-card" +
                (isSelectingCards ? " deck-card-wiggle" : "") +
                (selectedCardIds.has(card._id) ? " deck-card-selected" : "")
              }
              style={{ "--deck-colour": deckColour }}
              role="button"
              tabIndex={0}
              onMouseDown={() => handleCardMouseDown(card._id)}
              onMouseEnter={() => handleCardMouseEnter(card._id)}
              onClick={() => {
                if (isSelectingCards) return;

                if (cardClickTimeoutRef.current) {
                  clearTimeout(cardClickTimeoutRef.current);
                }
                cardClickTimeoutRef.current = setTimeout(() => {
                  navigate(
                    `/collections/${collectionId}/decks/${deckId}/cards/${card._id}`
                  );
                  cardClickTimeoutRef.current = null;
                }, 200);
              }}
              onDoubleClick={() => {
                if (isSelectingCards) return;

                if (cardClickTimeoutRef.current) {
                  clearTimeout(cardClickTimeoutRef.current);
                  cardClickTimeoutRef.current = null;
                }
                handleEditCard(card);
              }}
              onKeyDown={(event) => {
                if (isSelectingCards) return;

                if (event.key === "Enter" || event.key === " ") {
                  navigate(
                    `/collections/${collectionId}/decks/${deckId}/cards/${card._id}`
                  );
                }
              }}
            >
              {isSelectingCards && (
                <span
                  className={
                    selectedCardIds.has(card._id)
                      ? "deck-select-badge deck-select-badge-active"
                      : "deck-select-badge"
                  }
                >
                  {selectedCardIds.has(card._id) ? "✓" : ""}
                </span>
              )}

              <div className="course-outline-card-header">
                {editingCardId === card._id ? (
                  <input
                    className="course-outcome-input"
                    autoFocus
                    value={editedCourseOutcome}
                    onChange={(e) => setEditedCourseOutcome(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
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
                    onClick={(e) => {
                      if (!isSelectingCards) e.stopPropagation();
                    }}
                    onDoubleClick={(e) => {
                      if (isSelectingCards) return;
                      e.stopPropagation();
                      handleEditCard(card);
                    }}
                  >
                    {card.courseOutcome || "Untitled Course Outcome"}
                  </h3>
                )}

                {!isSelectingCards && (
                <div
                  className="course-outline-card-icons"
                  onDoubleClick={(e) => e.stopPropagation()}
                >
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
                )}
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

      {isSelectingCards && (
        <div className="selection-hint-bar">
          <span className="selection-hint-count">
            {selectedCardIds.size} card{selectedCardIds.size === 1 ? "" : "s"} selected
          </span>
          <span className="selection-hint-instruction">
            Click or drag across cards to toggle · Press Enter to start · Esc to cancel
          </span>
        </div>
      )}

      {practiceCards && (
        <PracticeSession
          cards={practiceCards}
          onClose={() => setPracticeCards(null)}
          onUpdateCard={handleUpdatePracticeCard}
        />
      )}
    </div>
  );
}

export default DeckPage;