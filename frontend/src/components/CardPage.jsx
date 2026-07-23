import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Tiptap from "./Tiptap";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import "../styles/Card.css";
import "../styles/CollectionsPage.css";
import "../styles/Home.css";
import '../styles/Page.css'
import { getDeckColour } from "../utils/deckColours";
import { rankDecksToRevise } from "../utils/rankDecks";
import filledStarIcon from '../../assets/filled-star.svg'
import unfilledStarIcon from '../../assets/unfilled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'
import unfilledQuestionIcon from '../../assets/unfilled-question.svg'
import threeDotsIcon from '../../assets/three-dots-vertical-svgrepo-com.svg'

const SWIPE_THRESHOLD = 60;
const SWIPE_GESTURE_IDLE_MS = 200;

const fetchCard = async (cardId) => {
  const response = await axios.get(
    `http://localhost:5001/api/cards/${cardId}`
  );

  return response.data;
};

const fetchDeck = async (deckId) => {
  const response = await axios.get(
    `http://localhost:5001/api/decks/${deckId}`
  );

  return response.data;
};

function CardPage() {
  const { collectionId, deckId, cardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deckColour = getDeckColour(deckId);

  const [courseOutcome, setCourseOutcome] = useState("");
  const [content, setContent] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);

  const [isCardMenuOpen, setIsCardMenuOpen] = useState(false);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);

  const [saveError, setSaveError] = useState("");

  const pageRef = useRef(null);
  const swipeStateRef = useRef({ accumulatedX: 0, locked: false, timeoutId: null });

  const {
    data: card,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => fetchCard(cardId),
    enabled: Boolean(cardId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const { data: deck } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeck(deckId),
    enabled: Boolean(deckId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const cardIds = useMemo(
    () => (deck?.cards || []).map((existingCard) => existingCard._id),
    [deck]
  );
  const currentIndex = cardIds.indexOf(cardId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < cardIds.length - 1;

  const goToAdjacentCard = useCallback(
    (direction) => {
      if (currentIndex === -1) return;

      const targetIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;

      if (targetIndex < 0 || targetIndex >= cardIds.length) return;

      setSlideDirection(direction);

      navigate(
        `/collections/${collectionId}/decks/${deckId}/cards/${cardIds[targetIndex]}`
      );
    },
    [currentIndex, cardIds, collectionId, deckId, navigate]
  );

  useEffect(() => {
    if (currentIndex === -1) return;

    const neighbourIds = [
      cardIds[currentIndex - 1],
      cardIds[currentIndex + 1],
    ].filter(Boolean);

    neighbourIds.forEach((neighbourId) => {
      queryClient.prefetchQuery({
        queryKey: ["card", neighbourId],
        queryFn: () => fetchCard(neighbourId),
        staleTime: 1000 * 60 * 5,
      });
    });
  }, [cardIds, currentIndex, queryClient]);

  useEffect(() => {
    if (!card) return;

    setCourseOutcome(card.courseOutcome || "");
    setContent(card.content || "");
  }, [card]);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      event.preventDefault();

      const state = swipeStateRef.current;
      state.accumulatedX += event.deltaX;

      clearTimeout(state.timeoutId);
      state.timeoutId = setTimeout(() => {
        state.accumulatedX = 0;
        state.locked = false;
      }, SWIPE_GESTURE_IDLE_MS);

      if (state.locked) return;

      if (state.accumulatedX > SWIPE_THRESHOLD) {
        state.locked = true;
        goToAdjacentCard("next");
      } else if (state.accumulatedX < -SWIPE_THRESHOLD) {
        state.locked = true;
        goToAdjacentCard("prev");
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    const swipeState = swipeStateRef.current;

    return () => {
      container.removeEventListener("wheel", handleWheel);
      clearTimeout(swipeState.timeoutId);
    };
  }, [goToAdjacentCard]);

  if (isLoading) {
    return <h2>Loading card...</h2>;
  }

  if (isError || !card) {
    return (
      <h2>
        {error?.response?.data?.message ||
          error?.message ||
          "Card not found"}
      </h2>
    );
  }

  const saveCard = async (updates) => {
    try {
      setSaveError("");

      const response = await axios.put(
        `http://localhost:5001/api/cards/${cardId}`,
        updates
      );

      const updatedCard = response.data;

      queryClient.setQueryData(["card", cardId], updatedCard);

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return {
          ...oldDeck,
          cards: (oldDeck.cards || []).map((existingCard) =>
            existingCard._id === cardId ? updatedCard : existingCard
          ),
        };
      });
    } catch (saveError) {
      console.error("Failed to update card:", saveError);

      setSaveError(
        saveError.response?.data?.message ||
          "Unable to update the card."
      );
    }
  };

  const applyFieldToCaches = (field, value) => {
    queryClient.setQueryData(["card", cardId], (oldCard) => {
      if (!oldCard) return oldCard;
      return { ...oldCard, [field]: value };
    });

    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;

      return {
        ...oldDeck,
        cards: (oldDeck.cards || []).map((existingCard) =>
          existingCard._id === cardId
            ? { ...existingCard, [field]: value }
            : existingCard
        ),
      };
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

  const toggleField = async (field) => {
    const nextValue = !card[field];

    applyFieldToCaches(field, nextValue);

    try {
      await axios.put(`http://localhost:5001/api/cards/${cardId}`, {
        [field]: nextValue,
      });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);

      setSaveError(
        err.response?.data?.message || "Unable to update the card."
      );

      applyFieldToCaches(field, card[field]);
    }
  };

  const handleDeleteCard = async () => {
    try {
      await axios.delete(`http://localhost:5001/api/cards/${cardId}`);

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return {
          ...oldDeck,
          cards: (oldDeck.cards || []).filter(
            (existingCard) => existingCard._id !== cardId
          ),
        };
      });

      setShowDeleteCardModal(false);
      navigate(`/collections/${collectionId}/decks/${deckId}`);
    } catch (err) {
      console.error("Failed to delete card:", err);

      setSaveError(
        err.response?.data?.message || "Unable to delete the card."
      );
    }
  };

  const commitTitle = () => {
    setIsEditingTitle(false);

    const trimmed = courseOutcome.trim();

    if (!trimmed || trimmed === card.courseOutcome) {
      setCourseOutcome(card.courseOutcome || "");
      return;
    }

    saveCard({ courseOutcome: trimmed });
  };

  const cancelTitle = () => {
    setCourseOutcome(card.courseOutcome || "");
    setIsEditingTitle(false);
  };

  const commitContent = (html) => {
    if (html === (card.content || "")) return;

    saveCard({ content: html });
  };

  const displayedKeywords = Array.isArray(card.keyWords)
    ? card.keyWords
    : (card.keyWords || "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    setNewKeyword("");

    if (!trimmed || displayedKeywords.includes(trimmed)) return;

    saveCard({ keyWords: [...displayedKeywords, trimmed] });
  };

  const removeKeyword = (keyword) => {
    saveCard({
      keyWords: displayedKeywords.filter((existing) => existing !== keyword),
    });
  };

  return (
    <main id="card-page" ref={pageRef}>
      <div className="card-page-layout">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(`/collections/${collectionId}/decks/${deckId}`)
          }
        >
          Go Back
        </button>

        <div className="card-swipe-region">
          <button
            type="button"
            className="card-swipe-arrow card-swipe-arrow-prev"
            onClick={() => goToAdjacentCard("prev")}
            disabled={!hasPrev}
            title="Previous course outcome (swipe right)"
            aria-label="Previous course outcome"
          >
            ‹
          </button>

          <section
            key={cardId}
            className={
              slideDirection
                ? `card-details slide-${slideDirection}`
                : "card-details"
            }
            style={{ "--deck-colour": deckColour }}
          >
            {currentIndex !== -1 && (
              <p className="card-swipe-counter">
                {currentIndex + 1} of {cardIds.length}
              </p>
            )}

            <div className="card-title-row">
              {isEditingTitle ? (
                <input
                  autoFocus
                  className="card-title-input"
                  value={courseOutcome}
                  onChange={(event) => setCourseOutcome(event.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }

                    if (event.key === "Escape") {
                      cancelTitle();
                    }
                  }}
                />
              ) : (
                <h1
                  className={
                    card.courseOutcome
                      ? "card-title-display"
                      : "card-title-display course-outcome-placeholder"
                  }
                  title="Double-click to edit"
                  onDoubleClick={() => setIsEditingTitle(true)}
                >
                  {card.courseOutcome || "Untitled Course Outcome"}
                </h1>
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
                  onClick={() => toggleField("flagged")}
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
                  onClick={() => toggleField("favourite")}
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
                    onClick={() => setIsCardMenuOpen((open) => !open)}
                  >
                    <img src={threeDotsIcon} alt="Menu" />
                  </button>

                  {isCardMenuOpen && (
                    <div className="menu">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCardMenuOpen(false);
                          setShowDeleteCardModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card-page-section">
              <h2>Keywords</h2>

              <div className="card-keyword-list">
                {displayedKeywords.map((keyword) => (
                  <span key={keyword} className="keyword-tag">
                    {keyword}

                    <button
                      type="button"
                      className="keyword-tag-delete"
                      aria-label={`Remove ${keyword}`}
                      onClick={() => removeKeyword(keyword)}
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  className="keyword-add-input"
                  placeholder="Add keyword…"
                  value={newKeyword}
                  onChange={(event) => setNewKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addKeyword();
                    }
                  }}
                  onBlur={addKeyword}
                />
              </div>
            </div>

            <div className="card-page-section">
              <h2>Content</h2>

              <Tiptap
                content={content}
                onChange={setContent}
                onBlur={commitContent}
              />
            </div>

            {saveError && <p className="card-save-error">{saveError}</p>}
          </section>

          <button
            type="button"
            className="card-swipe-arrow card-swipe-arrow-next"
            onClick={() => goToAdjacentCard("next")}
            disabled={!hasNext}
            title="Next course outcome (swipe left)"
            aria-label="Next course outcome"
          >
            ›
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteCardModal}
        onClose={() => setShowDeleteCardModal(false)}
        onConfirm={handleDeleteCard}
        title="Delete Card"
        itemLabel="card"
        itemName={card.courseOutcome || "Untitled Course Outcome"}
      />
    </main>
  );
}

export default CardPage;
