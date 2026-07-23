import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Tiptap from "./Tiptap";
import filledStarIcon from '../../assets/filled-star.svg'
import unfilledStarIcon from '../../assets/unfilled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'
import unfilledQuestionIcon from '../../assets/unfilled-question.svg'
import '../styles/PracticeMode.css'

function PracticeSession({ cards, collectionId, onClose, onUpdateCard }) {
  const navigate = useNavigate();
  const [sessionCards, setSessionCards] = useState(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);

  const currentCard = sessionCards[currentIndex];
  const isComplete = !currentCard;

  const toggleField = (field) => {
    const nextValue = !currentCard[field];

    onUpdateCard(currentCard._id, currentCard.deckId, { [field]: nextValue });

    setSessionCards((prev) =>
      prev.map((c) => (c._id === currentCard._id ? { ...c, [field]: nextValue } : c))
    );
  };

  const goToNext = () => {
    if (currentIndex + 1 >= sessionCards.length) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setIsFlipped(false);
    setUserAnswer("");
    setShowHint(false);
  };

  const goToEditCard = () => {
    navigate(
      `/collections/${collectionId}/decks/${currentCard.deckId}/cards/${currentCard._id}`
    );
  };

  // Keep the listener subscribed exactly once; refs give the handler
  // access to the latest onClose/goToNext without re-subscribing on
  // every render (which previously caused a single keypress to double-fire).
  const onCloseRef = useRef(onClose);
  const goToNextRef = useRef(goToNext);

  useEffect(() => {
    onCloseRef.current = onClose;
    goToNextRef.current = goToNext;
  });

  useEffect(() => {
    // Capture phase + stopPropagation: the deck grid underneath this
    // fullscreen overlay stays mounted (just visually covered), and a
    // deck card can still hold DOM focus from before Practice Mode
    // started. Its own onKeyDown (Enter -> navigate to the deck) runs
    // via React's bubble-phase delegation, which fires before a normal
    // bubble-phase document listener would -- silently navigating away
    // and unmounting the whole session. Capturing at document and
    // stopping propagation for the keys we handle here runs first and
    // keeps the background handler from ever seeing them.
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.metaKey && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        goToNextRef.current();
        return;
      }

      if (event.metaKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        event.stopPropagation();
        setShowHint(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "Meta" || event.key.toLowerCase() === "h") {
        setShowHint(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
    };
  }, []);

  const topBarEl =
    typeof document !== "undefined" ? document.getElementById("top-bar") : null;

  const practiceModeBadge = topBarEl
    ? createPortal(
        <span className="practice-topbar-badge">Practice Mode</span>,
        topBarEl
      )
    : null;

  if (isComplete) {
    return (
      <div className="practice-overlay">
        {practiceModeBadge}

        <div className="practice-modal practice-complete">
          <button type="button" className="practice-esc-btn" onClick={onClose}>
            Esc
          </button>

          <h2>Session complete</h2>

          <p>
            You reviewed {sessionCards.length} course outcome
            {sessionCards.length === 1 ? "" : "s"}.
          </p>

          <button type="button" className="practice-primary-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const keyWords = Array.isArray(currentCard.keyWords) ? currentCard.keyWords : [];

  return (
    <div className="practice-overlay">
      {practiceModeBadge}

      <div className="practice-modal">
        <button type="button" className="practice-esc-btn" onClick={onClose}>
          Esc
        </button>

        <p className="practice-progress">
          Course outcome {currentIndex + 1} of {sessionCards.length}
          {currentCard.deckName ? ` · ${currentCard.deckName}` : ""}
        </p>

        <div className="practice-icon-row">
          <button
            type="button"
            className="card-icon-toggle"
            aria-pressed={Boolean(currentCard.flagged)}
            title={currentCard.flagged ? "Unflag to revise content" : "Flag to revise content"}
            onClick={() => toggleField("flagged")}
          >
            <img
              src={currentCard.flagged ? filledQuestionIcon : unfilledQuestionIcon}
              alt="Flag to revise"
            />
          </button>

          <button
            type="button"
            className="card-icon-toggle"
            aria-pressed={Boolean(currentCard.favourite)}
            title={
              currentCard.favourite
                ? "Unflag as likely to be assessed"
                : "Flag as likely to be assessed"
            }
            onClick={() => toggleField("favourite")}
          >
            <img
              src={currentCard.favourite ? filledStarIcon : unfilledStarIcon}
              alt="Likely to appear"
            />
          </button>
        </div>

        <div className="flashcard-scene">
          <div
            className={isFlipped ? "flashcard is-flipped" : "flashcard"}
            style={{ "--deck-colour": currentCard.deckColour }}
            role="button"
            tabIndex={0}
            onClick={() => setIsFlipped((flipped) => !flipped)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsFlipped((flipped) => !flipped);
              }
            }}
          >
            <div className="flashcard-face flashcard-front">
              <span className="flashcard-question">
                {currentCard.courseOutcome || "Untitled Course Outcome"}
              </span>
              <span className="flashcard-hint-text">Click to flip</span>

              {showHint && (
                <div className="flashcard-hint-popup" onClick={(e) => e.stopPropagation()}>
                  <h4>Key words</h4>

                  {keyWords.length > 0 ? (
                    <ul>
                      {keyWords.map((word) => (
                        <li key={word}>{word}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No key words saved for this card.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flashcard-face flashcard-back">
              <div
                className="flashcard-content"
                dangerouslySetInnerHTML={{
                  __html: currentCard.content || "<p><em>No content yet</em></p>",
                }}
              />
            </div>
          </div>
        </div>

        <div className="practice-below-card-row">
          <button type="button" className="practice-edit-link" onClick={goToEditCard}>
            ✎ Edit this card
          </button>

          <p className="practice-hint">Hold ⌘H for a key word hint</p>
        </div>

        <div className="practice-answer-editor">
          <Tiptap content={userAnswer} onChange={setUserAnswer} />
        </div>

        <button
          type="button"
          className="practice-primary-btn"
          title="⌘+Enter"
          onClick={goToNext}
        >
          {currentIndex + 1 >= sessionCards.length ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}

export default PracticeSession;
