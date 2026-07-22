import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Tiptap from "./Tiptap";
import "../styles/Card.css";
import "../styles/CollectionsPage.css";
import '../styles/Page.css'
import { getDeckColour } from "../utils/deckColours";
import filledStarIcon from '../../assets/filled-star.svg'
import unfilledStarIcon from '../../assets/unfilled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'
import unfilledQuestionIcon from '../../assets/unfilled-question.svg'

const fetchCard = async (cardId) => {
  const response = await axios.get(
    `http://localhost:5001/api/cards/${cardId}`
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

  const [saveError, setSaveError] = useState("");

  const {
    data: card,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["card", cardId],
    queryFn: () => fetchCard(cardId),
    enabled: Boolean(cardId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!card) return;

    setCourseOutcome(card.courseOutcome || "");
    setContent(card.content || "");
  }, [card]);

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

  const toggleField = async (field) => {
    const nextValue = !card[field];

    queryClient.setQueryData(["card", cardId], (oldCard) => {
      if (!oldCard) return oldCard;
      return { ...oldCard, [field]: nextValue };
    });

    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;

      return {
        ...oldDeck,
        cards: (oldDeck.cards || []).map((existingCard) =>
          existingCard._id === cardId
            ? { ...existingCard, [field]: nextValue }
            : existingCard
        ),
      };
    });

    try {
      await axios.put(`http://localhost:5001/api/cards/${cardId}`, {
        [field]: nextValue,
      });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);

      setSaveError(
        err.response?.data?.message || "Unable to update the card."
      );

      queryClient.setQueryData(["card", cardId], (oldCard) => {
        if (!oldCard) return oldCard;
        return { ...oldCard, [field]: card[field] };
      });

      queryClient.setQueryData(["deck", deckId], (oldDeck) => {
        if (!oldDeck) return oldDeck;

        return {
          ...oldDeck,
          cards: (oldDeck.cards || []).map((existingCard) =>
            existingCard._id === cardId
              ? { ...existingCard, [field]: card[field] }
              : existingCard
          ),
        };
      });
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
    <main id="card-page">
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

        <section
          className="card-details"
          style={{ "--deck-colour": deckColour }}
        >
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
                className="card-title-display"
                title="Double-click to edit"
                onDoubleClick={() => setIsEditingTitle(true)}
              >
                {card.courseOutcome}
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
      </div>
    </main>
  );
}

export default CardPage;
