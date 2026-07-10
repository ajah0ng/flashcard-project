import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Tiptap from "./Tiptap";
import "../styles/Card.css";
import "../styles/CollectionsPage.css";

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

  const [isEditing, setIsEditing] = useState(false);
  const [courseOutcome, setCourseOutcome] = useState("");
  const [keyWords, setKeyWords] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

    setKeyWords(
      Array.isArray(card.keyWords)
        ? card.keyWords.join(", ")
        : card.keyWords || ""
    );

    setContent(card.content || "");
  }, [card]);

  const resetForm = () => {
    if (!card) return;

    setCourseOutcome(card.courseOutcome || "");

    setKeyWords(
      Array.isArray(card.keyWords)
        ? card.keyWords.join(", ")
        : card.keyWords || ""
    );

    setContent(card.content || "");
  };

  const handleCancel = () => {
    resetForm();
    setSaveError("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError("");

      const formattedKeywords = keyWords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

      const response = await axios.put(
        `http://localhost:5001/api/cards/${cardId}`,
        {
          courseOutcome: courseOutcome.trim(),
          keyWords: formattedKeywords,
          content,
        }
      );

      const updatedCard = response.data;

      queryClient.setQueryData(
        ["card", cardId],
        updatedCard
      );

      queryClient.setQueryData(
        ["deck", deckId],
        (oldDeck) => {
          if (!oldDeck) return oldDeck;

          return {
            ...oldDeck,
            cards: (oldDeck.cards || []).map(
              (existingCard) =>
                existingCard._id === cardId
                  ? updatedCard
                  : existingCard
            ),
          };
        }
      );

      setIsEditing(false);
    } catch (saveError) {
      console.error("Failed to update card:", saveError);

      setSaveError(
        saveError.response?.data?.message ||
          "Unable to update the card."
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  const displayedKeywords = Array.isArray(card.keyWords)
    ? card.keyWords
    : (card.keyWords || "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  return (
    <main id="card-page">
      <div className="card-page-header">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/collections/${collectionId}/decks/${deckId}`
            )
          }
        >
          Go Back
        </button>

        {!isEditing && (
          <button
            type="button"
            className="edit-card-button"
            onClick={() => setIsEditing(true)}
          >
            Edit Card
          </button>
        )}
      </div>

      <section className="card-details">
        {isEditing ? (
          <>
            <div className="card-form-group">
              <label htmlFor="courseOutcome">
                Course outcome
              </label>

              <input
                id="courseOutcome"
                type="text"
                value={courseOutcome}
                onChange={(event) =>
                  setCourseOutcome(event.target.value)
                }
              />
            </div>

            <div className="card-form-group">
              <label htmlFor="keyWords">Keywords</label>

              <input
                id="keyWords"
                type="text"
                value={keyWords}
                placeholder="React, JavaScript, Components"
                onChange={(event) =>
                  setKeyWords(event.target.value)
                }
              />

              <small>
                Separate keywords using commas.
              </small>
            </div>

            <div className="card-form-group">
              <label>Content</label>

              <Tiptap
                content={content}
                onChange={setContent}
              />
            </div>

            {saveError && (
              <p className="card-save-error">
                {saveError}
              </p>
            )}

            <div className="card-edit-actions">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  isSaving || !courseOutcome.trim()
                }
              >
                {isSaving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>{card.courseOutcome}</h1>

            <div className="card-page-section">
              <h2>Keywords</h2>

              {displayedKeywords.length === 0 ? (
                <p>No keywords added.</p>
              ) : (
                <div className="card-keyword-list">
                  {displayedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="keyword-tag"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="card-page-section">
              <h2>Content</h2>

              <div
                className="card-content"
                dangerouslySetInnerHTML={{
                  __html:
                    card.content ||
                    "<p>No content added.</p>",
                }}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default CardPage;